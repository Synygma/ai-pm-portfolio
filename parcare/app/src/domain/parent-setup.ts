// The parent's own setup (handoff 7.1 A–F; PLAN-PARENT P2). Pure rules:
// - up to 3 follow-up questions about items the child mentioned that she did not (A3, G4),
// - nothing is checked without her Yes, item by item (G1),
// - the finished setup is checked again on the server before anything is stored.

import { isSelectableCompanion } from "@/config/brand";
import type { CheckinType } from "@/data/types";
import { type DayItemInput, type FieldErrors, validateDayItems } from "./setup";

// One list (P-028): she ticks yes / no, picks the time and the sharing for each item in ONE place
// ("checklist"); the later steps only show that list with a big Edit button.
export const PARENT_SETUP_STEPS = ["companion", "day", "followups", "checklist", "thanks", "alarms", "terms"] as const;
export type ParentSetupStep = (typeof PARENT_SETUP_STEPS)[number];
/** Saved drafts from before P-028 had separate "recap" and "consent" steps (8 steps). */
export const PARENT_SETUP_LAYOUT = 2;
export function stepFromOldLayout(step: number): number {
  return step <= 3 ? step : step - 1; // recap (3) and consent (4) are now the one checklist (3)
}

/** Times she can pick from: every 15 minutes, plus the item's own time if it is not on the grid. */
export const TIME_STEP_MINUTES = 15;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isClockTime = (t: unknown): t is string => typeof t === "string" && TIME_RE.test(t);
export function timeChoices(current: string | null = null): string[] {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += TIME_STEP_MINUTES) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  if (isClockTime(current) && !out.includes(current)) out.push(current);
  return out.sort();
}

/** Handoff G4: at most 3 follow-up prompts after her free speech. */
export const MAX_FOLLOW_UPS = 3;
/** Minutes either side within which the child's item counts as one she mentioned. */
export const MATCH_WINDOW_MINUTES = 90;
/** Gaps she can choose for the reminders (F2/F5), "after discussing with the child". */
export const GAP_CHOICES = [5, 10, 15, 20, 30, 60] as const;
/** The nearest offered gap, so a saved value not on the list never leaves Next greyed out. */
export function nearestGap(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 10;
  return GAP_CHOICES.reduce((best, c) => (Math.abs(c - v) < Math.abs(best - v) ? c : best), GAP_CHOICES[0] as number);
}
/** Handoff 7.4: soft time limit; after this the companion says "we can finish this later". */
export const SOFT_LIMIT_MINUTES = 12;

export type ParentItem = DayItemInput & {
  /** Her Yes to being checked on this item (G1). */
  consent: boolean;
  /** She lets the child see this item in the daily digest (G2). */
  share: boolean;
};

type Timed = { checkinType: CheckinType; localTime: string | null; label: string };

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Did she mention this item of the child's (same kind of check-in, about the same time)? */
export function mentions(her: Timed[], item: Timed): boolean {
  return her.some(
    (h) => h.checkinType === item.checkinType && (!h.localTime || !item.localTime || Math.abs(minutes(h.localTime) - minutes(item.localTime)) <= MATCH_WINDOW_MINUTES),
  );
}

/** The child's items she did not mention, earliest first, at most 3 (A3, G4). */
export function followUpQuestions<T extends Timed>(her: Timed[], childItems: T[], max = MAX_FOLLOW_UPS): T[] {
  return childItems
    .filter((c) => !mentions(her, c))
    .sort((a, b) => (a.localTime ?? "99").localeCompare(b.localTime ?? "99"))
    .slice(0, max);
}

export type ParentSetupInput = {
  companionId: string;
  items: ParentItem[];
  /** E: she agrees that a daily summary goes to the child (off = nothing is shared). */
  summaryToChild: boolean;
  gapAMinutes: number;
  gapBMinutes: number;
  termsAccepted: boolean;
};

export function validateParentSetup(input: ParentSetupInput): FieldErrors & { companion?: "required"; gaps?: "type"; terms?: "required" } {
  const errors: FieldErrors & { companion?: "required"; gaps?: "type"; terms?: "required" } = { ...validateDayItems(input.items) };
  // An empty list is allowed (P-040): she may skip speaking and agree to nothing; nothing is checked.
  if (input.items.length === 0) delete errors.items;
  if (!isSelectableCompanion(input.companionId)) errors.companion = "required";
  if (!(GAP_CHOICES as readonly number[]).includes(input.gapAMinutes) || !(GAP_CHOICES as readonly number[]).includes(input.gapBMinutes)) errors.gaps = "type";
  if (!input.termsAccepted) errors.terms = "required";
  return errors;
}

/** Every item is on her one list; her Yes per item decides what is checked (G1). */
export function asOneList(items: ParentItem[]): ParentItem[] {
  return items.map((i) => ({ ...i, included: true }));
}

/** What will be checked: included items she said Yes to, by time. */
export function consentedItems(items: ParentItem[]): ParentItem[] {
  return items.filter((i) => i.included && i.consent).sort((a, b) => (a.localTime ?? "99").localeCompare(b.localTime ?? "99"));
}

/** A check-in she adds by hand (P-040): when the voice reader missed one, or she skipped speaking. */
export type NewCheckin = { label: string; checkinType: CheckinType; localTime: string | null };
export const NEW_CHECKIN_MAX = 80;

/** The new item, cleaned, or null when it is not valid (empty / too long label, unknown kind, bad time). */
export function cleanNewCheckin(input: { label?: unknown; checkinType?: unknown; localTime?: unknown }): NewCheckin | null {
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const localTime = input.localTime === null || input.localTime === "" || input.localTime === undefined ? null : input.localTime;
  const item = { label, checkinType: input.checkinType as CheckinType, localTime: localTime as string | null, included: true };
  if (!label || label.length > NEW_CHECKIN_MAX) return null;
  if (localTime !== null && !isClockTime(localTime)) return null;
  if (Object.keys(validateDayItems([item])).length > 0) return null;
  return { label, checkinType: item.checkinType, localTime: item.localTime };
}
