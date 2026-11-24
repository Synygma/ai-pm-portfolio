// Review prompts (5.11, G9): "check with your parent that all is OK and ask if they want to change
// any check-in". Child: setup + 1 week, then every 3 months. Parent: setup + 2 weeks, then every
// 3 months (recorded in data only; the parent app delivers it). Pure "prompts + now -> actions".

import type { ReviewPromptRow } from "@/data/types";
import { addMinutes } from "./time";

const DAY = 24 * 60;
export const FIRST_REVIEW_DAYS = { child: 7, parent: 14 } as const;
/** "Every 3 months" = 13 weeks, so it always lands on the same weekday and time. */
export const REVIEW_EVERY_DAYS = 91;

type Audience = ReviewPromptRow["audience"];
const AUDIENCES: Audience[] = ["child", "parent"];

/** The first prompts, created when setup finishes. */
export function initialReviewPrompts(setupAt: Date): { audience: Audience; dueAt: string }[] {
  return AUDIENCES.map((audience) => ({ audience, dueAt: addMinutes(setupAt, FIRST_REVIEW_DAYS[audience] * DAY).toISOString() }));
}

export type ReviewAction =
  /** notify = tell the child (bubble + push). Only the latest due prompt per audience notifies,
   *  so a long demo-clock jump does not pile up several prompts at once. */
  | { type: "show"; id: string; audience: Audience; notify: boolean; latest: boolean }
  | { type: "schedule"; audience: Audience; dueAt: string };

export function planReviews(prompts: ReviewPromptRow[], now: Date): ReviewAction[] {
  const t = now.getTime();
  const actions: ReviewAction[] = [];
  for (const audience of AUDIENCES) {
    const mine = prompts.filter((p) => p.audience === audience).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if (mine.length === 0) continue; // setup not finished
    const due = mine.filter((p) => p.shownAt === null && new Date(p.dueAt).getTime() <= t);
    due.forEach((p, i) => actions.push({ type: "show", id: p.id, audience, notify: audience === "child" && i === due.length - 1, latest: i === due.length - 1 }));
    if (mine.some((p) => new Date(p.dueAt).getTime() > t)) continue;
    // Next one: every 3 months after the last one, the first that is still in the future.
    let next = new Date(mine[mine.length - 1].dueAt);
    while (next.getTime() <= t) next = addMinutes(next, REVIEW_EVERY_DAYS * DAY);
    actions.push({ type: "schedule", audience, dueAt: next.toISOString() });
  }
  return actions;
}

/** The child's next review date (for Settings), or null. */
export function nextChildReview(prompts: ReviewPromptRow[], now: Date): string | null {
  const next = prompts
    .filter((p) => p.audience === "child" && new Date(p.dueAt).getTime() > now.getTime())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
  return next?.dueAt ?? null;
}
