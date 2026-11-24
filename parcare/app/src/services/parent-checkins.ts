// The parent answers her check-ins in the parent app (PLAN-PARENT P3): buttons, her own words
// (typed or hold-to-talk), snooze, or "I'm okay today". Her words are stored exactly (the digest
// quotes them). An emergency word stops everything: PAUSE on her screen and the child's distinct
// alarm (G5).

import type { AnswerOutcome } from "@/ai";
import type { Repos } from "@/data/repo";
import type { CheckinRow, HouseholdRow, ResponseRow } from "@/data/types";
import { findEmergencyWord } from "@/domain/emergency";
import { addMinutes } from "@/domain/time";
import { raiseAlert } from "./alerts";

const iso = (d: Date) => d.toISOString();

export const SNOOZE_CHECKIN_MINUTES = 30;
/** She may still answer a check-in after the child was alerted (the alarm stays until switched off). */
const ANSWERABLE: readonly CheckinRow["status"][] = ["prompted1", "prompted2", "snoozed", "escalated", "acknowledged"];

/** The check-in waiting for her answer now: the latest prompted one (or a snoozed one). */
export async function openCheckin(repos: Repos, householdId: string): Promise<CheckinRow | null> {
  const open = (await repos.checkins.find({ householdId })).filter((c) => c.status === "prompted1" || c.status === "prompted2" || c.status === "snoozed");
  return open.sort((a, b) => b.dueAt.localeCompare(a.dueAt))[0] ?? null;
}

/** How long after its due time a check-in can still be answered from her chat. */
export const ANSWER_WINDOW_HOURS = 24;

/**
 * Every check-in she can still answer from her chat, newest first: asked, not answered, due in
 * the last day. Includes those already told to the child (she can still say she is all right).
 */
export async function answerableCheckins(repos: Repos, householdId: string, now: Date): Promise<CheckinRow[]> {
  const since = now.getTime() - ANSWER_WINDOW_HOURS * 3600000;
  return (await repos.checkins.find({ householdId }))
    .filter((c) => ANSWERABLE.includes(c.status) && !c.answeredAt && c.prompted1At && new Date(c.dueAt).getTime() > since)
    .sort((a, b) => b.dueAt.localeCompare(a.dueAt));
}

export type AnswerInput = {
  text: string;
  outcome: AnswerOutcome | null;
  source: NonNullable<ResponseRow["source"]>;
};

export type AnswerResult =
  | { ok: true; emergency: false }
  /** G5: an emergency word. The child's alarm is ringing; her screen shows PAUSE. */
  | { ok: true; emergency: true }
  | { ok: false; reason: "notFound" | "closed" | "empty" };

async function companionSays(repos: Repos, householdId: string, data: Record<string, unknown>, now: Date) {
  await repos.chatMessages.insert({ householdId, kind: "checkin", direction: "in", audience: "parent", refId: null, data, createdAt: iso(now), readAt: null });
}

export async function answerCheckin(repos: Repos, household: HouseholdRow, checkinId: string, input: AnswerInput, now: Date): Promise<AnswerResult> {
  const text = input.text.trim().slice(0, 1000);
  if (!text) return { ok: false, reason: "empty" };
  // Claim the check-in first (one answer only, even with a double tap or the scheduler moving it
  // on at the same moment); retry once if the scheduler changed its status in between.
  let checkin = await repos.checkins.get(checkinId);
  if (!checkin || checkin.householdId !== household.id) return { ok: false, reason: "notFound" };
  let claimed = null;
  for (let attempt = 0; attempt < 2 && checkin && !claimed; attempt++) {
    if (!ANSWERABLE.includes(checkin.status) || checkin.answeredAt) return { ok: false, reason: "closed" };
    // An escalated check-in keeps its status (the child's alarm rings until switched off).
    const stillOpen = checkin.status === "prompted1" || checkin.status === "prompted2" || checkin.status === "snoozed";
    claimed = await repos.checkins.updateIf(
      checkin.id,
      { status: checkin.status, answeredAt: null },
      { answeredAt: iso(now), snoozedUntil: null, ...(stillOpen ? { status: "answered" as const } : {}) },
    );
    if (!claimed) checkin = await repos.checkins.get(checkinId);
  }
  if (!claimed || !checkin) return { ok: false, reason: "closed" };

  const response = await repos.responses.insert({
    householdId: household.id,
    checkinId: checkin.id,
    text,
    outcome: input.outcome,
    audioPath: null,
    source: input.source,
    createdAt: iso(now),
  });
  await repos.chatMessages.insert({
    householdId: household.id,
    kind: "answer",
    direction: "out",
    audience: "parent",
    refId: response.id,
    data: {},
    createdAt: iso(now),
    readAt: iso(now),
  });

  if (findEmergencyWord(text)) {
    await raiseAlert(repos, household.id, "emergency_word", now, { data: { source: "response" } });
    await companionSays(repos, household.id, { paused: true }, addMinutes(now, 0));
    return { ok: true, emergency: true };
  }
  await companionSays(repos, household.id, { thanks: true }, now);
  // After the last check-in of the day: if something today is worth sharing, send the child a
  // photo through the family's own chat app (N13). ParCare itself stores no photos.
  const meta = await repos.metaItems.get(checkin.metaItemId);
  if (meta?.checkinType === "last_checkin") await companionSays(repos, household.id, { photoPrompt: true }, now);
  return { ok: true, emergency: false };
}

/** F3: "Snooze 30 min" counts as a reply; she is asked again at the snooze time. */
export async function snoozeCheckin(repos: Repos, household: HouseholdRow, checkinId: string, now: Date): Promise<{ ok: boolean; until?: string }> {
  const checkin = await repos.checkins.get(checkinId);
  if (!checkin || checkin.householdId !== household.id) return { ok: false };
  if (checkin.status !== "prompted1" && checkin.status !== "prompted2") return { ok: false };
  const until = iso(addMinutes(now, SNOOZE_CHECKIN_MINUTES));
  if (!(await repos.checkins.updateIf(checkin.id, { status: checkin.status }, { status: "snoozed", snoozedUntil: until }))) return { ok: false };
  await companionSays(repos, household.id, { snoozedUntil: until }, now);
  return { ok: true, until };
}
