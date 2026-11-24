// Demo clock and "let a check-in go unanswered" (5.12). Every clock change runs the tick.

import { isSelectableCompanion, type AvatarId } from "@/config/brand";
import type { Repos } from "@/data/repo";
import type { HouseholdRow } from "@/data/types";
import { appNow } from "@/domain/clock";
import { tickHousehold } from "./checkins";

export const CLOCK_STEPS = { "5m": 5 * 60000, "1h": 3600000, "1d": 86400000, "1w": 7 * 86400000, "3mo": 91 * 86400000 } as const;
export type ClockStep = keyof typeof CLOCK_STEPS;

/** Moves the household's clock (or resets it to real time) and runs the tick at the new time. */
export async function moveClock(repos: Repos, household: HouseholdRow, step: ClockStep | "reset", realNow = Date.now()) {
  const offset = step === "reset" ? 0 : household.demoClockOffsetMs + CLOCK_STEPS[step];
  const updated = await repos.households.update(household.id, { demoClockOffsetMs: offset });
  return tickHousehold(repos, updated, appNow(updated, realNow));
}

/** Jumps the clock to an exact moment (never backwards) and ticks. */
async function jumpTo(repos: Repos, household: HouseholdRow, target: number, realNow: number) {
  const offset = Math.max(household.demoClockOffsetMs, target - realNow);
  const updated = await repos.households.update(household.id, { demoClockOffsetMs: offset });
  const result = await tickHousehold(repos, updated, appNow(updated, realNow));
  return { household: updated, result };
}

/**
 * Simulates the parent not answering the next check-in: clock to its due time (prompt #1),
 * + gap A (prompt #2), + gap B (child alarm). Returns the new alarm, or null if nothing is due.
 */
export async function letNextGoUnanswered(repos: Repos, household: HouseholdRow, realNow = Date.now()) {
  let current = household;
  await tickHousehold(repos, current, appNow(current, realNow)); // make sure the schedule exists
  const now = appNow(current, realNow).getTime();
  const next = (await repos.checkins.find({ householdId: current.id }, { orderBy: "dueAt" })).find(
    (c) => (c.status === "scheduled" && new Date(c.dueAt).getTime() >= now) || c.status === "prompted1" || c.status === "prompted2",
  );
  if (!next) return null;

  let step = { household: current, result: null as Awaited<ReturnType<typeof tickHousehold>> | null };
  if (next.status === "scheduled") step = await jumpTo(repos, current, new Date(next.dueAt).getTime(), realNow);
  current = step.household;
  for (const gap of [current.gapAMinutes, current.gapBMinutes]) {
    const fresh = (await repos.checkins.get(next.id))!;
    if (fresh.status === "escalated") break;
    const from = fresh.status === "prompted2" && fresh.prompted2At ? fresh.prompted2At : (fresh.prompted1At ?? next.dueAt);
    step = await jumpTo(repos, current, new Date(from).getTime() + gap * 60000, realNow);
    current = step.household;
  }
  const alerts = await repos.alerts.find({ householdId: current.id, checkinId: next.id });
  return alerts.find((a) => a.kind === "missed_checkin") ?? null;
}

/** Clock to the next check-in's due time: the parent is asked now (prompt 1 in her app). */
export async function askNextNow(repos: Repos, household: HouseholdRow, realNow = Date.now()) {
  await tickHousehold(repos, household, appNow(household, realNow)); // make sure the schedule exists
  const now = appNow(household, realNow).getTime();
  const next = (await repos.checkins.find({ householdId: household.id }, { orderBy: "dueAt" })).find(
    (c) => c.status === "scheduled" && new Date(c.dueAt).getTime() >= now,
  );
  if (!next) return null;
  await jumpTo(repos, household, new Date(next.dueAt).getTime(), realNow);
  return next.id;
}

export async function changeCompanion(repos: Repos, household: HouseholdRow, avatarId: string) {
  // "My Child" is never an AI companion.
  if (!isSelectableCompanion(avatarId)) throw new Error("Not a selectable companion");
  return repos.households.update(household.id, { parentAvatarId: avatarId as AvatarId });
}
