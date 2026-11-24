"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentParent } from "@/data/parent-access";
import { appNow } from "@/domain/clock";
import { setAllConsents, tickHousehold } from "@/services/checkins";
import { addMyCheckin, deleteMyWords, setCheckinOn, setCheckinShared, setCheckinTime, setCompanion, setGaps } from "@/services/parent-settings";
import { markParentReviewDone } from "@/services/review";
import { getServiceVoiceStore } from "@/services/voice-store";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

/** Her phone's push subscription (the companion's questions reach her in the background). */
export async function saveParentPushAction(sub: Sub): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me) return { ok: false };
  if (!/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) return { ok: false };
  const householdId = me.household.id;
  try {
    // Called on every visit to re-check (P-034): nothing to write when it is already saved.
    const mine = (await me.repos.pushSubscriptions.find({ householdId, endpoint: sub.endpoint })).filter((r) => r.audience === "parent");
    if (mine.length === 1 && mine[0].p256dh === sub.keys.p256dh && mine[0].auth === sub.keys.auth) return { ok: true };
    for (const old of mine) await me.repos.pushSubscriptions.remove(old.id);
    await me.repos.pushSubscriptions.insert({
      householdId,
      userId: null,
      audience: "parent",
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      createdAt: appNow(me.household).toISOString(),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function removeParentPushAction(endpoint: string): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me) return { ok: false };
  for (const s of await me.repos.pushSubscriptions.find({ householdId: me.household.id, endpoint })) {
    if (s.audience === "parent") await me.repos.pushSubscriptions.remove(s.id);
  }
  return { ok: true };
}

// "Who can see what" (G2) and her other controls. Plain form actions: each button works on its own.

async function me2() {
  const me = await getCurrentParent();
  if (!me) redirect("/parent");
  return me;
}

export async function setCheckinOnAction(metaItemId: string, on: boolean): Promise<void> {
  const me = await me2();
  await setCheckinOn(me.repos, me.household, me.parent, metaItemId, on, appNow(me.household));
  revalidatePath("/p", "layout");
}

export async function setSharedAction(metaItemId: string, shared: boolean): Promise<void> {
  const me = await me2();
  await setCheckinShared(me.repos, me.household, me.parent, metaItemId, shared, appNow(me.household));
  revalidatePath("/p", "layout");
}

/** A new time for one check-in (empty = no fixed time). */
export async function setTimeAction(metaItemId: string, formData: FormData): Promise<void> {
  const me = await me2();
  const value = String(formData.get("time") ?? "");
  const now = appNow(me.household);
  if (await setCheckinTime(me.repos, me.household, me.parent, metaItemId, value || null, now)) await tickHousehold(me.repos, me.household, now);
  revalidatePath("/p", "layout");
}

/** She adds a check-in herself (P-040). Returns false when the words or time are not valid. */
export async function addCheckinAction(_prev: { ok: boolean | null }, formData: FormData): Promise<{ ok: boolean | null }> {
  const me = await me2();
  const now = appNow(me.household);
  const ok = await addMyCheckin(
    me.repos,
    me.household,
    me.parent,
    { label: formData.get("label"), checkinType: formData.get("checkinType"), localTime: String(formData.get("time") ?? "") },
    formData.get("share") === "on",
    now,
  );
  if (ok) await tickHousehold(me.repos, me.household, now);
  revalidatePath("/p", "layout");
  return { ok };
}

/** Stop every check-in at once (the child is told: "All check-ins are switched off"). */
export async function stopAllAction(): Promise<void> {
  const me = await me2();
  const now = appNow(me.household);
  await setAllConsents(me.repos, me.household, false, now);
  await tickHousehold(me.repos, me.household, now);
  revalidatePath("/p", "layout");
}

export async function setCompanionAction(formData: FormData): Promise<void> {
  const me = await me2();
  await setCompanion(me.repos, me.household, String(formData.get("companion") ?? ""));
  revalidatePath("/p", "layout");
}

export async function setGapsAction(formData: FormData): Promise<void> {
  const me = await me2();
  await setGaps(me.repos, me.household, Number(formData.get("gapA")), Number(formData.get("gapB")));
  revalidatePath("/p", "layout");
}

/** Needs the confirmation tick. */
export async function deleteMyWordsAction(formData: FormData): Promise<void> {
  const me = await me2();
  if (formData.get("confirm") !== "on") return;
  await deleteMyWords(me.repos, getServiceVoiceStore(), me.household);
  revalidatePath("/p", "layout");
  redirect("/p/settings?deleted=1");
}

/** Her review question: "All is fine". */
export async function parentReviewDoneAction(promptId: string): Promise<void> {
  const me = await me2();
  await markParentReviewDone(me.repos, me.household.id, promptId, appNow(me.household));
  revalidatePath("/p", "layout");
}
