// The parent's own controls (G2, F23; PLAN-PARENT P5): which check-ins are on, what the child may
// see, her companion, the reminder gaps, and deleting her own recordings and words. Consent is
// revocable at any time (G9): pausing revokes it; resuming records a new consent.

import { type AvatarId, isSelectableCompanion } from "@/config/brand";
import type { Repos } from "@/data/repo";
import type { CheckinType, ConsentRow, HouseholdRow, ParentProfileRow } from "@/data/types";
import { activeConsents } from "@/domain/engine";
import { cleanNewCheckin, GAP_CHOICES, isClockTime } from "@/domain/parent-setup";
import { deleteVoiceRepliesFrom } from "./replies";
import type { VoiceStore } from "./voice";

const iso = (d: Date) => d.toISOString();

export type MyCheckin = {
  metaItemId: string;
  label: string;
  checkinType: CheckinType;
  localTime: string | null;
  on: boolean;
  /** She agreed to it at some point (false = not ticked in setup and never turned on). */
  agreed: boolean;
  shared: boolean;
};

/**
 * Her check-ins, by time: every item on her list (P-028: also the ones she did not tick in setup,
 * so she can turn them on later) and every item she ever agreed to (paused ones included).
 */
export async function listMyCheckins(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, now: Date): Promise<MyCheckin[]> {
  const [metas, consents] = await Promise.all([
    repos.metaItems.find({ householdId: household.id, parentId: parent.id }),
    repos.consents.find({ householdId: household.id }),
  ]);
  const active = new Map(activeConsents(consents, now).map((c) => [c.metaItemId, c]));
  const ever = new Map<string, ConsentRow>();
  for (const c of [...consents].sort((a, b) => a.grantedAt.localeCompare(b.grantedAt))) ever.set(c.metaItemId, c);
  return metas
    .filter((m) => ever.has(m.id) || m.source === "parent")
    .map((m) => {
      const c = active.get(m.id) ?? ever.get(m.id);
      return { metaItemId: m.id, label: m.label, checkinType: m.checkinType, localTime: m.localTime, on: active.has(m.id), agreed: ever.has(m.id), shared: c?.shareInDigest ?? true };
    })
    .sort((a, b) => (a.localTime ?? "99").localeCompare(b.localTime ?? "99"));
}

async function itemOf(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, metaItemId: string) {
  const meta = await repos.metaItems.get(metaItemId);
  return meta && meta.householdId === household.id && meta.parentId === parent.id ? meta : null;
}

/** Pause (revoke) or resume (new consent, keeping her last sharing choice) one check-in. */
export async function setCheckinOn(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, metaItemId: string, on: boolean, now: Date): Promise<boolean> {
  if (!(await itemOf(repos, household, parent, metaItemId))) return false;
  const consents = await repos.consents.find({ householdId: household.id, metaItemId });
  const current = activeConsents(consents, now);
  if (!on) {
    for (const c of current) await repos.consents.update(c.id, { revokedAt: iso(now) });
    return true;
  }
  if (current.length > 0) return true;
  const last = [...consents].sort((a, b) => b.grantedAt.localeCompare(a.grantedAt))[0];
  await repos.consents.insert({ householdId: household.id, metaItemId, grantedAt: iso(now), revokedAt: null, shareInDigest: last?.shareInDigest ?? true });
  return true;
}

/**
 * She changes the time of one check-in (P-028). Check-ins already asked keep going; the ones not yet
 * asked are re-planned at the new time by the next scheduler run. The child is told in their chat.
 */
export async function setCheckinTime(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, metaItemId: string, time: string | null, now: Date): Promise<boolean> {
  const meta = await itemOf(repos, household, parent, metaItemId);
  if (!meta || (time !== null && !isClockTime(time))) return false;
  if (meta.localTime === time) return true;
  await repos.metaItems.update(meta.id, { localTime: time });
  for (const c of await repos.checkins.find({ householdId: household.id, metaItemId, status: "scheduled" })) await repos.checkins.remove(c.id);
  await repos.chatMessages.insert({
    householdId: household.id,
    kind: "setup",
    direction: "in",
    audience: "child",
    refId: null,
    data: { timeChanged: true, label: meta.label, time },
    createdAt: iso(now),
    readAt: null,
  });
  return true;
}

/**
 * She adds a check-in herself (P-040), e.g. one the voice reader missed. Adding it is her Yes (G1),
 * with her sharing choice (G2). The child is told in their chat; the next scheduler run plans it.
 */
export async function addMyCheckin(
  repos: Repos,
  household: HouseholdRow,
  parent: ParentProfileRow,
  input: { label?: unknown; checkinType?: unknown; localTime?: unknown },
  share: boolean,
  now: Date,
): Promise<boolean> {
  const item = cleanNewCheckin(input);
  if (!item) return false;
  const meta = await repos.metaItems.insert({
    householdId: household.id,
    parentId: parent.id,
    label: item.label,
    checkinType: item.checkinType,
    localTime: item.localTime,
    onDate: null,
    source: "parent",
    createdAt: iso(now),
  });
  await repos.consents.insert({ householdId: household.id, metaItemId: meta.id, grantedAt: iso(now), revokedAt: null, shareInDigest: share });
  await repos.chatMessages.insert({
    householdId: household.id,
    kind: "setup",
    direction: "in",
    audience: "child",
    refId: null,
    data: { checkinAdded: true, label: item.label, time: item.localTime },
    createdAt: iso(now),
    readAt: null,
  });
  return true;
}

/** Whether the child may see this check-in in the digest (G2). */
export async function setCheckinShared(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, metaItemId: string, shared: boolean, now: Date): Promise<boolean> {
  if (!(await itemOf(repos, household, parent, metaItemId))) return false;
  const current = activeConsents(await repos.consents.find({ householdId: household.id, metaItemId }), now);
  for (const c of current) await repos.consents.update(c.id, { shareInDigest: shared });
  return current.length > 0;
}

export async function setCompanion(repos: Repos, household: HouseholdRow, avatarId: string): Promise<boolean> {
  if (!isSelectableCompanion(avatarId)) return false; // "My Child" is never a companion
  await repos.households.update(household.id, { parentAvatarId: avatarId as AvatarId });
  return true;
}

export async function setGaps(repos: Repos, household: HouseholdRow, gapA: number, gapB: number): Promise<boolean> {
  const ok = (n: number) => (GAP_CHOICES as readonly number[]).includes(n);
  if (!ok(gapA) || !ok(gapB)) return false;
  await repos.households.update(household.id, { gapAMinutes: gapA, gapBMinutes: gapB });
  return true;
}

/**
 * "Delete my recordings and words" (G15): her check-in answers (and their chat bubbles), the
 * digests made of them, and every voice clip of hers. Her help requests stay on the child's list
 * as text (so the child can still help), without their voice clips.
 */
export async function deleteMyWords(repos: Repos, voice: VoiceStore, household: HouseholdRow): Promise<{ answers: number; digests: number; clips: number }> {
  const householdId = household.id;
  let clips = 0;
  const responses = await repos.responses.find({ householdId });
  for (const r of responses) {
    if (r.audioPath) {
      await voice.remove(r.audioPath).catch(() => undefined);
      clips++;
    }
    for (const m of await repos.chatMessages.find({ householdId, refId: r.id })) await repos.chatMessages.remove(m.id);
    await repos.responses.remove(r.id);
  }
  const digests = await repos.digests.find({ householdId });
  for (const d of digests) {
    for (const f of await repos.digestFeedback.find({ householdId, digestId: d.id })) await repos.digestFeedback.remove(f.id);
    for (const m of await repos.chatMessages.find({ householdId, refId: d.id })) await repos.chatMessages.remove(m.id);
    await repos.digests.remove(d.id);
  }
  for (const h of await repos.helperRequests.find({ householdId })) {
    if (!h.audioPath) continue;
    await voice.remove(h.audioPath).catch(() => undefined);
    await repos.helperRequests.update(h.id, { audioPath: null });
    clips++;
  }
  // Her voice replies to the child (P-030): both bubbles and the clip.
  clips += await deleteVoiceRepliesFrom(repos, voice, householdId, "parent");
  return { answers: responses.length, digests: digests.length, clips };
}
