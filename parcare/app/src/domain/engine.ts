// Check-in engine (5.5): pure "state + now -> actions". /api/tick and the demo clock run it.
//
//   check-in due -> parent prompt #1
//     -> no reply within gap A (from the actual prompt) -> parent prompt #2 (alarm-like)
//     -> no reply within gap B (from prompt #2)         -> CHILD ALARM (until the child switches it off)
//
// Truthfulness: the child alarm says "I checked in twice and did not hear back", so a check-in
// only escalates through prompts that really happened. If the app was not running when a
// check-in was due (its prompt-1 window has passed unprompted), it "lapses" with no alarm.

import type { AlertRow, CheckinRow, ConsentRow, HouseholdRow, MetaItemRow } from "@/data/types";
import { addDays, addMinutes, localDate, zonedTimeToUtc } from "./time";

/** How far ahead check-ins are created. */
export const SCHEDULE_HORIZON_HOURS = 36;

export type EngineInput = {
  now: Date;
  household: Pick<HouseholdRow, "gapAMinutes" | "gapBMinutes" | "setupCompletedAt">;
  parentTimeZone: string;
  metaItems: MetaItemRow[];
  consents: ConsentRow[];
  checkins: CheckinRow[];
  alerts: AlertRow[];
};

export type EngineAction =
  /** promptAt set = already due, so it is created as prompt #1 straight away. */
  | { type: "createCheckin"; metaItemId: string; dueAt: string; promptAt: string | null }
  | { type: "deleteCheckin"; id: string }
  | { type: "prompt1"; id: string; at: string }
  | { type: "prompt2"; id: string; at: string }
  | { type: "escalate"; id: string; at: string }
  | { type: "lapse"; id: string }
  | { type: "allDisabled" };

const iso = (d: Date) => d.toISOString();
const ms = (s: string) => new Date(s).getTime();

/** Consents active right now (granted, not revoked). */
export function activeConsents(consents: ConsentRow[], now: Date): ConsentRow[] {
  return consents.filter((c) => ms(c.grantedAt) <= now.getTime() && (c.revokedAt === null || ms(c.revokedAt) > now.getTime()));
}

/** Due times (UTC) of one item between two instants. Items without a time are not scheduled. */
export function occurrences(item: MetaItemRow, timeZone: string, from: Date, to: Date): Date[] {
  if (!item.localTime) return [];
  const dates = item.onDate ? [item.onDate] : [-1, 0, 1, 2].map((d) => addDays(localDate(from, timeZone), d));
  return dates
    .map((date) => zonedTimeToUtc(date, item.localTime!, timeZone))
    .filter((t) => t.getTime() > from.getTime() && t.getTime() <= to.getTime());
}

export function planTick(input: EngineInput): EngineAction[] {
  const { now, household, parentTimeZone } = input;
  if (!household.setupCompletedAt) return [];
  const actions: EngineAction[] = [];
  const t = now.getTime();
  const gapA = household.gapAMinutes * 60000;
  const gapB = household.gapBMinutes * 60000;

  const active = activeConsents(input.consents, now);
  const activeByItem = new Map(active.map((c) => [c.metaItemId, c]));

  // 1. Consent revoked -> future (not yet prompted) check-ins are removed (G1, G9).
  for (const c of input.checkins) {
    if (c.status === "scheduled" && !activeByItem.has(c.metaItemId)) actions.push({ type: "deleteCheckin", id: c.id });
  }

  // 2. Schedule upcoming check-ins for consented items. Never before the consent was given, and
  //    never in the past beyond the prompt-1 window (the app did not exist / was not running).
  const existing = new Set(input.checkins.map((c) => `${c.metaItemId}|${ms(c.dueAt)}`));
  const from = new Date(t - gapA);
  const to = addMinutes(now, SCHEDULE_HORIZON_HOURS * 60);
  for (const item of input.metaItems) {
    const consent = activeByItem.get(item.id);
    if (!consent) continue;
    for (const due of occurrences(item, parentTimeZone, from, to)) {
      if (due.getTime() <= ms(consent.grantedAt)) continue;
      const key = `${item.id}|${due.getTime()}`;
      if (existing.has(key)) continue;
      existing.add(key);
      actions.push({ type: "createCheckin", metaItemId: item.id, dueAt: iso(due), promptAt: due.getTime() <= t ? iso(now) : null });
    }
  }

  // 3. Advance existing check-ins.
  for (const c of input.checkins) {
    if (!activeByItem.has(c.metaItemId) && (c.status === "scheduled" || c.status === "prompted1" || c.status === "prompted2" || c.status === "snoozed")) {
      // Consent withdrawn mid-flow: stop prompting (scheduled ones were deleted above).
      continue;
    }
    if (c.status === "scheduled" && ms(c.dueAt) <= t) {
      if (t < ms(c.dueAt) + gapA) actions.push({ type: "prompt1", id: c.id, at: iso(now) });
      else actions.push({ type: "lapse", id: c.id });
    } else if (c.status === "prompted1" && c.prompted1At && t >= ms(c.prompted1At) + gapA) {
      actions.push({ type: "prompt2", id: c.id, at: iso(now) });
    } else if (c.status === "prompted2" && c.prompted2At && t >= ms(c.prompted2At) + gapB) {
      actions.push({ type: "escalate", id: c.id, at: iso(now) });
    } else if (c.status === "snoozed" && c.snoozedUntil && t >= ms(c.snoozedUntil)) {
      // F3: snoozing was a reply. At the snooze time she is asked again and the chain starts
      // afresh from prompt 1 (or lapses, if the app was not running then).
      if (t < ms(c.snoozedUntil) + gapA) actions.push({ type: "prompt1", id: c.id, at: iso(now) });
      else actions.push({ type: "lapse", id: c.id });
    }
  }

  // 4. "All check-ins are switched off" (N7): the parent had consents and has revoked them all.
  if (input.consents.length > 0 && active.length === 0) {
    const lastRevoked = Math.max(...input.consents.map((c) => (c.revokedAt ? ms(c.revokedAt) : 0)));
    const alreadyTold = input.alerts.some((a) => a.kind === "all_disabled" && ms(a.createdAt) >= lastRevoked);
    if (!alreadyTold) actions.push({ type: "allDisabled" });
  }
  return actions;
}

/** Alarms still ringing: missed check-ins and emergency words the child has not switched off. */
export function activeAlarms(alerts: AlertRow[], now?: Date): AlertRow[] {
  return alerts
    .filter((a) => (a.kind === "missed_checkin" || a.kind === "emergency_word") && a.ackAt === null)
    .filter((a) => !now || ms(a.createdAt) <= now.getTime())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
