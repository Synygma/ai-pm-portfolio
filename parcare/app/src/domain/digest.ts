// Daily digest (5.7, F19-F22). Pure functions:
// - when is a digest due (the child's chosen local time, default 19:00)
// - what it contains: the parent's own words for items she shares, quoted exactly
// - factual pattern notes ("usually walks at 6:30; not done today"), computed in code, never a
//   diagnosis (G13); no scores or streaks (G12).

import { BLOCKED_DIAGNOSIS_WORDS } from "@/config/blocked-words";
import type { CheckinRow, ConsentRow, DigestFlag, DigestItem, MetaItemRow, ResponseRow } from "@/data/types";
import { addDays, localDate, zonedTimeToUtc } from "./time";

const DAY_MS = 24 * 3600000;
const ms = (s: string) => new Date(s).getTime();

/** Days of history used to decide what is "usual", and how many of them make a habit. */
export const PATTERN_DAYS = 7;
export const PATTERN_MIN_DAYS = 3;

/** The latest digest moment at or before `now`: today's digest time in the child's zone, or yesterday's. */
export function latestDigestSlot(now: Date, digestLocalTime: string, childTimeZone: string): Date {
  const today = zonedTimeToUtc(localDate(now, childTimeZone), digestLocalTime, childTimeZone);
  if (today.getTime() <= now.getTime()) return today;
  return zonedTimeToUtc(addDays(localDate(now, childTimeZone), -1), digestLocalTime, childTimeZone);
}

/**
 * The digest slot to send now, or null. A slot is sent once, only after setup finished, and only
 * if it is later than the last digest (so changing the digest time never back-fills old days).
 */
export function digestDue(input: {
  now: Date;
  digestLocalTime: string;
  childTimeZone: string;
  setupCompletedAt: string | null;
  lastDigestSentAt: string | null;
}): { periodStart: Date; periodEnd: Date } | null {
  if (!input.setupCompletedAt) return null;
  const slot = latestDigestSlot(input.now, input.digestLocalTime, input.childTimeZone);
  if (slot.getTime() < ms(input.setupCompletedAt)) return null;
  if (input.lastDigestSentAt && slot.getTime() <= ms(input.lastDigestSentAt)) return null;
  return { periodStart: new Date(slot.getTime() - DAY_MS), periodEnd: slot };
}

/** Items the parent shares in the digest: consent active at the end of the period, sharing on (G2). */
export function sharedItems(metaItems: MetaItemRow[], consents: ConsentRow[], at: Date): MetaItemRow[] {
  const t = at.getTime();
  const shared = new Set(
    consents
      .filter((c) => c.shareInDigest && ms(c.grantedAt) <= t && (c.revokedAt === null || ms(c.revokedAt) > t))
      .map((c) => c.metaItemId),
  );
  return metaItems.filter((m) => shared.has(m.id));
}

export type DigestInput = {
  periodStart: Date;
  periodEnd: Date;
  metaItems: MetaItemRow[];
  consents: ConsentRow[];
  checkins: CheckinRow[];
  responses: ResponseRow[];
};

export function buildDigest(input: DigestInput): { items: DigestItem[]; flags: DigestFlag[] } {
  const { periodStart, periodEnd } = input;
  const shared = sharedItems(input.metaItems, input.consents, periodEnd);
  const checkinItem = new Map(input.checkins.map((c) => [c.id, c.metaItemId]));
  const inWindow = (iso: string, from: number, to: number) => ms(iso) > from && ms(iso) <= to;
  const answersFor = (itemId: string, from: number, to: number) =>
    input.responses.filter((r) => r.checkinId && checkinItem.get(r.checkinId) === itemId && inWindow(r.createdAt, from, to));

  const items: DigestItem[] = [];
  const flags: DigestFlag[] = [];
  const start = periodStart.getTime();
  const end = periodEnd.getTime();

  for (const meta of shared) {
    const answers = answersFor(meta.id, start, end);
    for (const r of answers) {
      items.push({ metaItemId: meta.id, checkinType: meta.checkinType, label: meta.label, responseId: r.id, quote: r.text, at: r.createdAt });
    }

    // Pattern notes only for daily items with an established habit (done on most recent days).
    if (meta.onDate !== null) continue;
    let doneDays = 0;
    for (let d = 1; d <= PATTERN_DAYS; d++) {
      const past = answersFor(meta.id, start - d * DAY_MS, end - d * DAY_MS);
      if (past.some((r) => r.outcome === "yes")) doneDays++;
    }
    if (doneDays < PATTERN_MIN_DAYS) continue;
    const base = { metaItemId: meta.id, checkinType: meta.checkinType, label: meta.label, usualLocalTime: meta.localTime };
    const dueInWindow = input.checkins.some((c) => c.metaItemId === meta.id && inWindow(c.dueAt, start, end));
    if (answers.some((r) => r.outcome === "no") && !answers.some((r) => r.outcome === "yes")) flags.push({ ...base, kind: "not_done" });
    else if (answers.length === 0 && dueInWindow) flags.push({ ...base, kind: "not_mentioned" });
  }

  items.sort((a, b) => a.at.localeCompare(b.at));
  return { items, flags };
}

/** G13 check for text ParCare writes itself. True = safe to show. */
export function isFreeOfDiagnosis(text: string): boolean {
  const t = text.toLowerCase();
  return !BLOCKED_DIAGNOSIS_WORDS.some((w) => {
    const stem = w.endsWith("*");
    const word = (stem ? w.slice(0, -1) : w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(stem ? `\\b${word}` : `\\b${word}\\b`).test(t);
  });
}

/**
 * A label safe to put into ParCare's own pattern sentence: if a child-written label contains a
 * blocked word, the neutral check-in type name is used instead (G13).
 */
export function safeLabel(label: string, fallback: string): string {
  return isFreeOfDiagnosis(label) ? label : fallback;
}
