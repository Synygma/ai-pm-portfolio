// Scoring for the meta-list evaluation (docs/AI_EVAL.md). Pure, shared by the unit test and
// `npm run ai:eval`.

import type { MetaSuggestion } from "./types";

export type Expected = [checkinType: string, localTime: string | null];
export type CaseScore = { truePositives: number; falsePositives: number; falseNegatives: number };

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Same type, and times within 30 minutes (or both null). Each expected item matches once. */
export function scoreCase(predicted: MetaSuggestion[], expected: Expected[]): CaseScore {
  const remaining = [...expected];
  let truePositives = 0;
  for (const p of predicted) {
    const i = remaining.findIndex(
      ([type, time]) =>
        type === p.checkinType &&
        (time === null ? p.localTime === null : p.localTime !== null && Math.abs(minutes(time) - minutes(p.localTime)) <= 30),
    );
    if (i >= 0) {
      truePositives++;
      remaining.splice(i, 1);
    }
  }
  return { truePositives, falsePositives: predicted.length - truePositives, falseNegatives: remaining.length };
}

export function totals(scores: CaseScore[]) {
  const tp = scores.reduce((s, x) => s + x.truePositives, 0);
  const fp = scores.reduce((s, x) => s + x.falsePositives, 0);
  const fn = scores.reduce((s, x) => s + x.falseNegatives, 0);
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);
  return { tp, fp, fn, precision, recall };
}
