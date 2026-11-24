// Admin page: every login with its family's activity band, deleting a test user completely (so the
// same person can test again with the same email), and gentle check-in notes to children's apps.

import { DEMO_CHILD_EMAIL } from "@/config/demo";
import type { Repos } from "@/data/repo";
import { type Activity, activityOf, allIsOk, checkGentleNote, type NoteProblem } from "@/domain/admin";
import { appNow } from "@/domain/clock";
import { deleteFamilyData } from "./household";
import { sendPushToHousehold } from "./push";
import type { VoiceStore } from "./voice";

export type Login = { id: string; email: string; createdAt: string };

export type AdminUser = Login & {
  name: string | null;
  /** Child's setup finished. */
  setupDone: boolean;
  parentName: string | null;
  /** The parent finished her own setup in her app. */
  parentSetupDone: boolean;
  activity: Activity;
  /** Priya's sample family is what every teammate's Demo login uses, so it cannot be deleted here. */
  locked: boolean;
};

export const isSampleLogin = (email: string) => email.trim().toLowerCase() === DEMO_CHILD_EMAIL;

export async function listAdminUsers(repos: Repos, logins: Login[], realNow = Date.now()): Promise<AdminUser[]> {
  const [profiles, households, parents, checkins] = await Promise.all([
    repos.profiles.find({}),
    repos.households.find({}),
    repos.parentProfiles.find({}),
    repos.checkins.find({}),
  ]);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const householdByChild = new Map(households.map((h) => [h.childId, h]));
  return logins
    .map((login) => {
      const household = householdByChild.get(login.id);
      const parent = household ? (parents.find((p) => p.householdId === household.id && p.managed) ?? null) : null;
      const own = household ? checkins.filter((c) => c.householdId === household.id) : [];
      return {
        ...login,
        name: profileById.get(login.id)?.fullName || null,
        setupDone: !!household?.setupCompletedAt,
        parentName: parent?.name ?? null,
        parentSetupDone: !!parent?.setupCompletedAt,
        activity: activityOf(own, appNow(household ?? null, realNow)),
        locked: isSampleLogin(login.email),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type DeleteUserResult = { ok: true } | { ok: false; reason: "locked" | "notFound" | "failed" };

/**
 * Deletes one user completely: voice clips, every row of the family (the parent's phone is signed
 * out, its session rows go too), the profile, then the login. The record that they agreed to the
 * terms is kept, as with "Delete all our data" (P-011).
 */
export async function deleteUserCompletely(
  repos: Repos,
  voice: VoiceStore,
  login: Login | undefined,
  removeLogin: (userId: string) => Promise<boolean>,
): Promise<DeleteUserResult> {
  if (!login) return { ok: false, reason: "notFound" };
  if (isSampleLogin(login.email)) return { ok: false, reason: "locked" };
  try {
    await deleteFamilyData(repos, voice, login.id);
    return (await removeLogin(login.id)) ? { ok: true } : { ok: false, reason: "failed" };
  } catch (e) {
    console.error("admin delete failed", e instanceof Error ? e.message : e);
    return { ok: false, reason: "failed" };
  }
}

export type SendNoteResult = { ok: true; families: number; skipped: number; pushed: number } | { ok: false; reason: NoteProblem };

/**
 * Sends a gentle check-in note to every family whose setup is done and where all is OK (no alarm
 * still ringing): a labelled bubble in the child's chat plus a notification to the child's phone.
 * Never to the parent. Marketing, links and prices are refused.
 */
export async function sendGentleNote(
  repos: Repos,
  input: { text: string; preset: string | null; pushTitle: string },
  now: Date,
): Promise<SendNoteResult> {
  const text = input.text.trim();
  const problem = checkGentleNote(text);
  if (problem) return { ok: false, reason: problem };
  const [households, alerts] = await Promise.all([repos.households.find({}), repos.alerts.find({})]);
  let families = 0;
  let skipped = 0;
  let pushed = 0;
  for (const h of households.filter((x) => x.setupCompletedAt)) {
    if (!allIsOk(alerts.filter((a) => a.householdId === h.id))) {
      skipped++;
      continue;
    }
    await repos.chatMessages.insert({
      householdId: h.id,
      kind: "note",
      audience: "child",
      direction: "in",
      refId: null,
      data: { text },
      createdAt: appNow(h, now.getTime()).toISOString(),
      readAt: null,
    });
    pushed += await sendPushToHousehold(repos, h.id, { title: input.pushTitle, body: text, url: "/chat", tag: "parcare-note" }, "child");
    families++;
  }
  await repos.adminBroadcasts.insert({ message: text, preset: input.preset, sentAt: now.toISOString(), families, pushed });
  return { ok: true, families, skipped, pushed };
}
