// The last check-in of the day asks a personalised question (handoff N13, AI task A6). Picked in
// code, not by an AI: questions about things she agreed to be checked on first, a few general
// ones after, and never one she was asked in the last 7 days. Deterministic for a given day, so
// the same question shows on her chat and on her answer card.

import type { CheckinType } from "@/data/types";

/** Question keys (text in messages/en.json under parentChat.lastQuestions). */
export const QUESTIONS_BY_TYPE: Partial<Record<CheckinType, string[]>> = {
  physical_activity: ["walkHow", "movedToday"],
  puja: ["pujaSpecial"],
  social: ["metAnyone", "friendsNews"],
  appointment: ["appointmentHow"],
  help_arrived: ["helpWent"],
};
export const GENERAL_QUESTIONS = ["daySpecial", "smileToday", "ateToday", "lookForward", "heardToday"];
export const NO_REPEAT_DAYS = 7;

/**
 * @param consentedTypes the kinds of check-in she has agreed to (most personal first)
 * @param recentKeys question keys asked in the last NO_REPEAT_DAYS days
 * @param dayNumber a number for the day (e.g. days since 1970 in her time zone), to rotate
 */
export function pickLastQuestion(consentedTypes: CheckinType[], recentKeys: string[], dayNumber: number): string {
  const personal = [...new Set(consentedTypes)].flatMap((t) => QUESTIONS_BY_TYPE[t] ?? []);
  const all = [...personal, ...GENERAL_QUESTIONS];
  const fresh = all.filter((k) => !recentKeys.includes(k));
  const pool = fresh.length > 0 ? fresh : all;
  // Personal questions first when available; rotate by day within the pool.
  const personalFresh = pool.filter((k) => personal.includes(k));
  const choose = personalFresh.length > 0 && dayNumber % 2 === 0 ? personalFresh : pool;
  return choose[((dayNumber % choose.length) + choose.length) % choose.length];
}

/** Days since 1970 for a "YYYY-MM-DD" date. */
export function dayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
}
