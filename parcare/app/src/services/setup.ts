// Setup wizard persistence (save-and-resume after every step). Works on any Repos, so the same
// code runs on the memory adapter (tests, local) and Supabase (row-level security applies).

import { TERMS_VERSION } from "@/config/terms";
import type { Repos } from "@/data/repo";
import type { HouseholdRow, MetaItemRow, ParentProfileRow, SetupDraftRow } from "@/data/types";
import {
  canFinishSetup,
  type ChildInput,
  type DayItemInput,
  decideEmergencyContact,
  type EmergencyDecision,
  type EmergencyInput,
  type ParentInput,
  type ParentsInput,
  SETUP_STEPS,
  type SetupStep,
} from "@/domain/setup";
import { hashInviteToken, INVITE_VALID_DAYS, newInviteToken } from "@/domain/invite";
import { initialReviewPrompts } from "@/domain/review";
import { addMinutes, normalizeTimeZone } from "@/domain/time";

const iso = (d: Date) => d.toISOString();
const DAY = 24 * 60;

export const DEFAULT_GAP_A_MINUTES = 10;
export const DEFAULT_GAP_B_MINUTES = 20;
export const DEFAULT_DIGEST_TIME = "19:00";

export type SetupState = {
  householdId: string | null;
  /** Number of steps completed (0..9). The wizard opens at this index. */
  completed: number;
  setupDone: boolean;
  child: ChildInput | null;
  parents: ParentInput[];
  managedIndex: number;
  day: { transcript: string; items: DayItemInput[] };
  emergency: { name: string; phone: string } | null;
  emergencyChoice: "skipped" | "stored" | "notStored" | null;
};

type DraftData = { transcript?: string; emergencyChoice?: SetupState["emergencyChoice"] };

async function getDraft(repos: Repos, householdId: string): Promise<SetupDraftRow | null> {
  // The child's draft (the parent app keeps its own, audience "parent"; older rows have none).
  return (await repos.setupDrafts.find({ householdId })).find((d) => d.audience !== "parent") ?? null;
}

async function updateDraft(repos: Repos, householdId: string, now: Date, step: SetupStep, data: DraftData = {}) {
  const completed = SETUP_STEPS.indexOf(step) + 1;
  const draft = await getDraft(repos, householdId);
  if (!draft) {
    await repos.setupDrafts.insert({ householdId, audience: "child", step: completed, data: { ...data }, updatedAt: iso(now) });
    return;
  }
  await repos.setupDrafts.update(draft.id, {
    step: Math.max(draft.step, completed),
    data: { ...draft.data, ...data },
    updatedAt: iso(now),
  });
}

async function parentsOf(repos: Repos, householdId: string): Promise<ParentProfileRow[]> {
  return repos.parentProfiles.find({ householdId }, { orderBy: "createdAt" });
}

export async function getSetupState(repos: Repos, userId: string): Promise<SetupState> {
  const [profile, household] = await Promise.all([repos.profiles.get(userId), repos.households.findOne({ childId: userId })]);
  const empty: SetupState = {
    householdId: null,
    completed: 0,
    setupDone: false,
    child: null,
    parents: [],
    managedIndex: 0,
    day: { transcript: "", items: [] },
    emergency: null,
    emergencyChoice: null,
  };
  if (!household) return { ...empty, child: profile ? childFromProfile(profile) : null };

  const [draft, parents, metaItems, contact] = await Promise.all([
    getDraft(repos, household.id),
    parentsOf(repos, household.id),
    repos.metaItems.find({ householdId: household.id, source: "child" }, { orderBy: "localTime" }),
    repos.emergencyContacts.findOne({ householdId: household.id }),
  ]);
  const data = (draft?.data ?? {}) as DraftData;
  return {
    householdId: household.id,
    completed: household.setupCompletedAt ? SETUP_STEPS.length : (draft?.step ?? 1),
    setupDone: household.setupCompletedAt !== null,
    child: profile ? childFromProfile(profile) : null,
    parents: parents.map((p) => ({
      name: p.name,
      petName: p.petName,
      gender: p.gender,
      age: p.age,
      country: p.country ?? "",
      city: p.city ?? "",
      timeZone: p.timeZone,
    })),
    managedIndex: Math.max(0, parents.findIndex((p) => p.id === household.managedParentId)),
    day: {
      transcript: data.transcript ?? "",
      items: metaItems.map((m) => ({ label: m.label, checkinType: m.checkinType, localTime: m.localTime, included: true })),
    },
    emergency: contact ? { name: contact.name, phone: contact.phone } : null,
    emergencyChoice: data.emergencyChoice ?? null,
  };
}

function childFromProfile(p: { fullName: string; petName: string | null; country: string | null; city: string | null; age: number | null; timeZone: string }): ChildInput {
  return { fullName: p.fullName, petName: p.petName ?? "", country: p.country ?? "", city: p.city ?? "", age: p.age, timeZone: p.timeZone };
}

/** Step a: creates the profile and household on first save. */
export async function saveChildStep(repos: Repos, user: { id: string; email: string }, input: ChildInput, now: Date): Promise<HouseholdRow> {
  const fields = {
    fullName: input.fullName.trim(),
    petName: input.petName.trim() || null,
    country: input.country.trim(),
    city: input.city.trim(),
    age: input.age,
    timeZone: normalizeTimeZone(input.timeZone),
  };
  const profile = await repos.profiles.get(user.id);
  if (profile) await repos.profiles.update(user.id, fields);
  else await repos.profiles.insert({ id: user.id, email: user.email, createdAt: iso(now), ...fields });

  let household = await repos.households.findOne({ childId: user.id });
  if (!household) {
    household = await repos.households.insert({
      childId: user.id,
      managedParentId: null,
      parentAvatarId: null,
      gapAMinutes: DEFAULT_GAP_A_MINUTES,
      gapBMinutes: DEFAULT_GAP_B_MINUTES,
      digestLocalTime: DEFAULT_DIGEST_TIME,
      demoClockOffsetMs: 0,
      retentionDays: 30,
      setupCompletedAt: null,
      createdAt: iso(now),
    });
  }
  await updateDraft(repos, household.id, now, "child");
  return household;
}

/** Step b: one or two parents; v1 manages exactly one. Updates in place so ids stay stable. */
export async function saveParentsStep(repos: Repos, household: HouseholdRow, input: ParentsInput, now: Date): Promise<void> {
  const existing = await parentsOf(repos, household.id);
  const ids: string[] = [];
  for (let i = 0; i < input.parents.length; i++) {
    const p = input.parents[i];
    const fields = {
      name: p.name.trim(),
      petName: p.petName.trim(),
      gender: p.gender,
      age: p.age,
      country: p.country.trim(),
      city: p.city.trim() || null,
      timeZone: normalizeTimeZone(p.timeZone),
      managed: i === input.managedIndex,
    };
    if (existing[i]) {
      await repos.parentProfiles.update(existing[i].id, fields);
      ids.push(existing[i].id);
    } else {
      ids.push((await repos.parentProfiles.insert({ householdId: household.id, setupCompletedAt: null, lastSeenAt: null, createdAt: iso(addMinutes(now, i / 60)), ...fields })).id);
    }
  }
  const managedId = ids[input.managedIndex];
  await repos.households.update(household.id, { managedParentId: managedId });

  // The day description belongs to the managed parent.
  for (const m of await repos.metaItems.find({ householdId: household.id })) {
    if (m.parentId !== managedId) await repos.metaItems.update(m.id, { parentId: managedId });
  }
  for (const extra of existing.slice(input.parents.length)) await repos.parentProfiles.remove(extra.id);
  await updateDraft(repos, household.id, now, "parent");
}

/** Steps with nothing to save (c, d, h): just remember the progress. */
export async function markStepDone(repos: Repos, householdId: string, step: SetupStep, now: Date): Promise<void> {
  await updateDraft(repos, householdId, now, step);
}

/**
 * Step e: the child's version of the parent's day. Stored as meta items only; nothing is
 * checked until the parent consents item by item in their app (G1).
 */
export async function saveDayStep(repos: Repos, household: HouseholdRow, items: DayItemInput[], transcript: string, now: Date): Promise<MetaItemRow[]> {
  if (!household.managedParentId) throw new Error("Parent details first");
  const consented = new Set((await repos.consents.find({ householdId: household.id })).map((c) => c.metaItemId));
  for (const m of await repos.metaItems.find({ householdId: household.id, source: "child" })) {
    if (!consented.has(m.id)) await repos.metaItems.remove(m.id);
  }
  const created = await repos.metaItems.insertMany(
    items
      .filter((i) => i.included)
      .map((i) => ({
        householdId: household.id,
        parentId: household.managedParentId!,
        label: i.label.trim(),
        checkinType: i.checkinType,
        localTime: i.localTime,
        onDate: null,
        source: "child" as const,
        createdAt: iso(now),
      })),
  );
  await updateDraft(repos, household.id, now, "day", { transcript: transcript.slice(0, 4000) });
  return created;
}

/**
 * G7, used by setup step f and Settings: a new contact replaces the old one only when the child
 * confirms the person knows. On "No" nothing is stored and the saved contact stays as it was.
 */
export async function saveEmergencyContact(repos: Repos, householdId: string, input: EmergencyInput, now: Date): Promise<EmergencyDecision> {
  const decision = decideEmergencyContact(input);
  if (decision.action === "store") {
    await removeEmergencyContact(repos, householdId);
    await repos.emergencyContacts.insert({ householdId, name: decision.name, phone: decision.phone, confirmedToldAt: iso(now), createdAt: iso(now) });
  }
  return decision;
}

export async function removeEmergencyContact(repos: Repos, householdId: string): Promise<void> {
  for (const c of await repos.emergencyContacts.find({ householdId })) await repos.emergencyContacts.remove(c.id);
}

/** Step f: applies G7. Name and phone are never kept anywhere unless the answer was Yes. */
export async function saveEmergencyStep(repos: Repos, householdId: string, input: EmergencyInput, now: Date): Promise<EmergencyDecision> {
  const decision = await saveEmergencyContact(repos, householdId, input, now);
  if (decision.action === "invalid") return decision;
  const emergencyChoice = decision.action === "store" ? "stored" : decision.action === "skip" ? "skipped" : "notStored";
  await updateDraft(repos, householdId, now, "emergency", { emergencyChoice });
  return decision;
}

/** Step g: new one-time invite. Older unused invites stop working. Returns the token once. */
export async function createParentInvite(repos: Repos, householdId: string, now: Date): Promise<{ token: string; expiresAt: string }> {
  const invite = await newParentInvite(repos, householdId, now);
  await updateDraft(repos, householdId, now, "invite");
  return invite;
}

/** A new one-time link for the parent's phone (setup step g, or Settings later). Older unused links stop working. */
export async function newParentInvite(repos: Repos, householdId: string, now: Date): Promise<{ token: string; expiresAt: string }> {
  for (const inv of await repos.parentInvites.find({ householdId, usedAt: null })) await repos.parentInvites.remove(inv.id);
  const token = newInviteToken();
  const expiresAt = iso(addMinutes(now, INVITE_VALID_DAYS * DAY));
  await repos.parentInvites.insert({ householdId, tokenHash: hashInviteToken(token), expiresAt, usedAt: null, createdAt: iso(now) });
  return { token, expiresAt };
}

/** Step i: needs the tick (G10). Records the acceptance, review prompts and the first bubble. */
export async function finishSetup(
  repos: Repos,
  household: HouseholdRow,
  userId: string,
  termsAccepted: boolean,
  now: Date,
): Promise<{ ok: true } | { ok: false; reason: "termsRequired" | "incomplete" }> {
  const [profile, parent] = await Promise.all([
    repos.profiles.get(userId),
    household.managedParentId ? repos.parentProfiles.get(household.managedParentId) : null,
  ]);
  const check = canFinishSetup({ termsAccepted, hasProfile: profile !== null, hasManagedParent: parent !== null });
  if (!check.ok) return check;
  if (household.setupCompletedAt) return { ok: true };

  await repos.termsAcceptances.insert({ householdId: household.id, role: "child", userId, termsVersion: TERMS_VERSION, acceptedAt: iso(now) });
  // G9: child review prompt at +1 week, parent at +2 weeks; the tick adds one every 3 months.
  await repos.reviewPrompts.insertMany(initialReviewPrompts(now).map((p) => ({ householdId: household.id, ...p, shownAt: null, doneAt: null })));
  await repos.chatMessages.insert({
    householdId: household.id,
    kind: "setup",
    direction: "in",
    audience: "child",
    refId: null,
    data: { parentPetName: parent!.petName },
    createdAt: iso(now),
    readAt: null,
  });
  await repos.households.update(household.id, { setupCompletedAt: iso(now) });
  await updateDraft(repos, household.id, now, "terms");
  return { ok: true };
}
