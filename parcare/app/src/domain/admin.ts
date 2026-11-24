// Pure rules for the admin page: activity bands and the "gentle check-in only" message check.
//
// Activity bands show how well the service is working for a family (admin only, never shown to the
// child or the parent, and never a score of the parent: G12). Over the last 14 days: the share of
// check-ins the parent answered before the child's alarm.

import type { AlertRow, CheckinRow } from "@/data/types";
import { isFreeOfDiagnosis } from "./digest";

export const BAND_DAYS = 14;
export const BAND_HIGH = 80;
export const BAND_MID = 50;

export type Band = "active" | "partly" | "low" | "notStarted";
export type Activity = { band: Band; asked: number; answered: number; alarms: number; percent: number | null };

/** Statuses of a check-in the parent was actually asked (lapsed = scheduler off, not counted). */
const ASKED = new Set(["prompted1", "prompted2", "snoozed", "answered", "escalated", "acknowledged"]);

export function activityOf(checkins: CheckinRow[], now: Date): Activity {
  const from = now.getTime() - BAND_DAYS * 86_400_000;
  const recent = checkins.filter((c) => {
    const due = new Date(c.dueAt).getTime();
    return due > from && due <= now.getTime() && ASKED.has(c.status);
  });
  const alarms = recent.filter((c) => c.escalatedAt).length;
  const answered = recent.filter((c) => c.status === "answered" && !c.escalatedAt).length;
  if (recent.length === 0) return { band: "notStarted", asked: 0, answered: 0, alarms: 0, percent: null };
  const percent = Math.round((answered / recent.length) * 100);
  const band: Band = percent >= BAND_HIGH ? "active" : percent >= BAND_MID ? "partly" : "low";
  return { band, asked: recent.length, answered, alarms, percent };
}

/** "All is OK" for a family: no alarm still ringing (a gentle note is never sent into an alarm). */
export function allIsOk(alerts: AlertRow[]): boolean {
  return !alerts.some((a) => (a.kind === "missed_checkin" || a.kind === "emergency_word") && !a.ackAt);
}

// ---- Gentle check-in messages (no marketing) ----

export const NOTE_MAX = 160;
export const NOTE_PRESETS = ["hello", "weekend", "thanks", "working"] as const;
export type NotePreset = (typeof NOTE_PRESETS)[number];

/** Words and signs that make a note an advert, a sales pitch or a link. */
const MARKETING = [
  "offer", "discount", "sale", "buy", "deal", "price", "pricing", "upgrade", "subscribe", "subscription",
  "premium", "trial", "coupon", "promo", "promotion", "cashback", "refer", "referral", "limited time",
  "install", "download", "plan", "pay", "payment", "rupees", "rs", "inr", "free", "win", "prize", "shop",
  "order now", "click", "sponsor", "partner", "brand", "product",
];

export type NoteProblem = "empty" | "tooLong" | "marketing" | "link" | "wording";

export function checkGentleNote(text: string): NoteProblem | null {
  const t = text.trim();
  if (!t) return "empty";
  if (t.length > NOTE_MAX) return "tooLong";
  const lower = t.toLowerCase();
  if (/https?:|www\.|\.(com|in|net|org|app|io)\b|@/.test(lower)) return "link";
  if (/[₹$€£%]/.test(t)) return "marketing";
  if (MARKETING.some((w) => new RegExp(`\\b${w.replace(/ /g, "\\s+")}\\b`).test(lower))) return "marketing";
  if (!isFreeOfDiagnosis(t)) return "wording";
  return null;
}
