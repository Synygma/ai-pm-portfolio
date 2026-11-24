// Weekly and monthly summaries (P-011 item 4), in words. Rule G12 (the parent is not a score):
// no totals, percentages, ticks or streaks. Per shared check-in it says plainly whether it
// happened as planned, and on which days it did not happen or got no answer. It also quotes a few
// of the parent's own words, exactly. Like the digest, only consented + shared items appear
// (G1/G2), and the text is facts from the check-ins, never a diagnosis (G13).

import type { CheckinRow, CheckinType, ConsentRow, MetaItemRow, ResponseRow } from "@/data/types";
import { sharedItems } from "./digest";
import { localDate } from "./time";

export const SUMMARY_DAYS = { week: 7, month: 30 } as const;
export type SummaryPeriod = keyof typeof SUMMARY_DAYS;
export const SUMMARY_QUOTES = 5;

export type SummaryLine = {
  metaItemId: string;
  label: string;
  checkinType: CheckinType;
  localTime: string | null;
  /** Due at least once in the period with a final outcome. */
  asked: boolean;
  /** Parent-local dates ("YYYY-MM-DD"), oldest first. */
  notDone: string[];
  noAnswer: string[];
  unclear: string[];
};

export type SummaryQuote = { text: string; at: string; label: string };

export type Summary = { lines: SummaryLine[]; quotes: SummaryQuote[] };

const ms = (s: string) => new Date(s).getTime();
const FINAL_NO_ANSWER = new Set(["escalated", "acknowledged", "lapsed"]);

export function buildSummary(input: {
  periodStart: Date;
  periodEnd: Date;
  parentTimeZone: string;
  metaItems: MetaItemRow[];
  consents: ConsentRow[];
  checkins: CheckinRow[];
  responses: ResponseRow[];
}): Summary {
  const from = input.periodStart.getTime();
  const to = input.periodEnd.getTime();
  const shared = sharedItems(input.metaItems, input.consents, input.periodEnd);
  const byCheckin = new Map<string, ResponseRow>();
  for (const r of input.responses) if (r.checkinId) byCheckin.set(r.checkinId, r);
  const day = (iso: string) => localDate(new Date(iso), input.parentTimeZone);
  const uniq = (dates: string[]) => [...new Set(dates)].sort();

  const lines: SummaryLine[] = shared.map((item) => {
    const due = input.checkins.filter((c) => c.metaItemId === item.id && ms(c.dueAt) > from && ms(c.dueAt) <= to);
    const notDone: string[] = [];
    const noAnswer: string[] = [];
    const unclear: string[] = [];
    let asked = false;
    for (const c of due) {
      const r = byCheckin.get(c.id);
      if (r) {
        asked = true;
        if (r.outcome === "no") notDone.push(day(c.dueAt));
        else if (r.outcome === "unclear" || r.outcome === null) unclear.push(day(c.dueAt));
      } else if (FINAL_NO_ANSWER.has(c.status)) {
        asked = true;
        noAnswer.push(day(c.dueAt));
      }
    }
    return {
      metaItemId: item.id,
      label: item.label,
      checkinType: item.checkinType,
      localTime: item.localTime,
      asked,
      notDone: uniq(notDone),
      noAnswer: uniq(noAnswer),
      unclear: uniq(unclear),
    };
  });

  const sharedIds = new Set(shared.map((m) => m.id));
  const itemOf = new Map(input.checkins.map((c) => [c.id, c.metaItemId]));
  const labelOf = new Map(shared.map((m) => [m.id, m.label]));
  const quotes = input.responses
    .filter((r) => r.checkinId && sharedIds.has(itemOf.get(r.checkinId) ?? "") && ms(r.createdAt) > from && ms(r.createdAt) <= to && r.text.trim())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, SUMMARY_QUOTES)
    .map((r) => ({ text: r.text, at: r.createdAt, label: labelOf.get(itemOf.get(r.checkinId!)!) ?? "" }));

  return { lines, quotes };
}
