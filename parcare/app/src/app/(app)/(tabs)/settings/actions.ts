"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/auth";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { type FieldErrors, inviteUrl, shareLink } from "@/domain/setup";
import { isValidTimeZone, normalizeTimeZone } from "@/domain/time";
import { RETENTION_CHOICES, type RetentionDays } from "@/data/types";
import { deleteFamilyData } from "@/services/household";
import { purgeOldData } from "@/services/retention";
import { newParentInvite, removeEmergencyContact, saveEmergencyContact } from "@/services/setup";
import { getVoiceStore } from "@/services/voice-store";

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Saves this browser's push subscription for the child's household (alarm notifications on). */
export async function savePushSubscriptionAction(sub: BrowserSubscription): Promise<{ ok: boolean }> {
  const child = await getCurrentChild();
  if (!child?.household) return { ok: false };
  if (!/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const repos = await getRepos();
  try {
    // Called on every visit to re-check (P-034): nothing to write when it is already saved.
    const mine = (await repos.pushSubscriptions.find({ householdId: child.household.id, endpoint: sub.endpoint })).filter((r) => r.audience === "child");
    if (mine.length === 1 && mine[0].p256dh === sub.keys.p256dh && mine[0].auth === sub.keys.auth) return { ok: true };
    for (const old of mine) await repos.pushSubscriptions.remove(old.id);
    await repos.pushSubscriptions.insert({
      householdId: child.household.id,
      userId: child.userId,
      audience: "child",
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      createdAt: appNow(child.household).toISOString(),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function removePushSubscriptionAction(endpoint: string): Promise<{ ok: boolean }> {
  const child = await getCurrentChild();
  if (!child?.household) return { ok: false };
  const repos = await getRepos();
  for (const s of await repos.pushSubscriptions.find({
    householdId: child.household.id,
    endpoint,
  }))
    await repos.pushSubscriptions.remove(s.id);
  return { ok: true };
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type DigestTimeState = { saved?: string; error?: boolean };

/** Daily digest time in the child's local time (5.10; default 19:00). */
export async function saveDigestTimeAction(_prev: DigestTimeState, formData: FormData): Promise<DigestTimeState> {
  const time = String(formData.get("time") ?? "").slice(0, 5);
  if (!TIME_RE.test(time)) return { error: true };
  const child = await getCurrentChild();
  if (!child?.household) return { error: true };
  await (await getRepos()).households.update(child.household.id, { digestLocalTime: time });
  return { saved: time };
}

export type TimeZoneState = { saved?: string; error?: boolean };

/** The child's own time zone (5.10). Digest time and every time shown follow it. */
export async function saveTimeZoneAction(_prev: TimeZoneState, formData: FormData): Promise<TimeZoneState> {
  const timeZone = normalizeTimeZone(String(formData.get("timeZone") ?? "").slice(0, 64));
  if (!timeZone || !isValidTimeZone(timeZone)) return { error: true };
  const child = await getCurrentChild();
  if (!child?.profile) return { error: true };
  await (await getRepos()).profiles.update(child.profile.id, { timeZone });
  revalidatePath("/", "layout");
  return { saved: timeZone };
}

export type EmergencyContactState =
  | { status: "idle" }
  | { status: "saved"; name: string }
  | { status: "notStored"; name: string }
  | { status: "removed" }
  | {
      status: "invalid";
      errors: FieldErrors;
      values: { name: string; phone: string };
    };

/** Settings: add, replace (G7: only on "Yes") or remove (intent=remove) the emergency contact. */
export async function saveEmergencyContactAction(_prev: EmergencyContactState, formData: FormData): Promise<EmergencyContactState> {
  const child = await getCurrentChild();
  if (!child?.household) return { status: "invalid", errors: {}, values: { name: "", phone: "" } };
  if (formData.get("intent") === "remove") {
    await removeEmergencyContact(await getRepos(), child.household.id);
    revalidatePath("/settings");
    return { status: "removed" };
  }
  const told = formData.get("told");
  const input = {
    choice: "add" as const,
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    told: told === "yes" ? true : told === "no" ? false : null,
  };
  const decision = await saveEmergencyContact(await getRepos(), child.household.id, input, appNow(child.household));
  revalidatePath("/settings");
  if (decision.action === "invalid")
    return {
      status: "invalid",
      errors: decision.errors,
      values: {
        name: input.name.slice(0, 80),
        phone: input.phone.slice(0, 30),
      },
    };
  if (decision.action === "store") return { status: "saved", name: decision.name };
  return { status: "notStored", name: input.name.trim() };
}

/** "Delete all our data" (G14): needs the confirmation tick. Signs out afterwards. */
export async function deleteFamilyDataAction(formData: FormData): Promise<void> {
  if (formData.get("confirm") !== "on") return;
  const child = await getCurrentChild();
  if (!child) redirect("/login");
  await deleteFamilyData(await getRepos(), await getVoiceStore(), child.userId);
  await signOut();
  redirect("/deleted");
}

export type RetentionState = { saved?: RetentionDays; error?: boolean };

/** How long the parent's words, voice clips and digests are kept: 8, 15 or 30 days (item 3). */
export async function saveRetentionAction(_prev: RetentionState, formData: FormData): Promise<RetentionState> {
  const days = Number(formData.get("days"));
  if (!(RETENTION_CHOICES as readonly number[]).includes(days)) return { error: true };
  const child = await getCurrentChild();
  if (!child?.household) return { error: true };
  const repos = await getRepos();
  const household = await repos.households.update(child.household.id, { retentionDays: days as RetentionDays });
  // A shorter period applies at once.
  await purgeOldData(repos, household, appNow(household), await getVoiceStore());
  revalidatePath("/", "layout");
  return { saved: days as RetentionDays };
}

/** "Make a new link for <parent>'s phone": a new one-time invite (older unused links stop working). */
export async function newParentLinkAction(): Promise<{ ok: true; url: string; shareUrl: string } | { ok: false }> {
  const child = await getCurrentChild();
  if (!child?.household || !child.parent) return { ok: false };
  const { token } = await newParentInvite(await getRepos(), child.household.id, appNow(child.household));
  const h = await headers();
  const base = h.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = inviteUrl(base, token);
  const t = await getTranslations("settings.parentLink");
  return { ok: true, url, shareUrl: shareLink(t("shareText", { parentPetName: child.parent.petName, url })) };
}
