// Runs the review-prompt plan (5.11) against the database. Called from the tick.

import type { Repos } from "@/data/repo";
import type { AlertRow } from "@/data/types";
import { planReviews } from "@/domain/review";
import { getAvatar } from "@/config/brand";
import { translator } from "@/i18n/translator";
import { raiseAlert } from "./alerts";
import { sendPushToHousehold } from "./push";

const iso = (d: Date) => d.toISOString();

export async function tickReviews(repos: Repos, householdId: string, now: Date): Promise<AlertRow[]> {
  const prompts = await repos.reviewPrompts.find({ householdId });
  const alerts: AlertRow[] = [];
  for (const a of planReviews(prompts, now)) {
    if (a.type === "schedule") {
      await repos.reviewPrompts.insertUnique({ householdId, audience: a.audience, dueAt: a.dueAt, shownAt: null, doneAt: null }, ["householdId", "audience", "dueAt"]);
      continue;
    }
    // Shown once, by whichever run gets there first.
    if (!(await repos.reviewPrompts.updateIf(a.id, { shownAt: null }, { shownAt: iso(now) }))) continue;
    // Child: a bubble in the companion chat + a notification.
    if (a.notify) alerts.push(await raiseAlert(repos, householdId, "review", now, { data: { reviewPromptId: a.id } }));
    // Parent: the companion asks in her chat (+2 weeks, then every 3 months; G9), latest one only.
    if (a.audience === "parent" && a.latest) await askParentToReview(repos, householdId, a.id, now);
  }
  return alerts;
}

/** The companion asks the parent in her chat (and notifies her phone). */
async function askParentToReview(repos: Repos, householdId: string, promptId: string, now: Date) {
  await repos.chatMessages.insert({ householdId, kind: "review", direction: "in", audience: "parent", refId: promptId, data: {}, createdAt: iso(now), readAt: null });
  const household = await repos.households.get(householdId);
  const child = household ? await repos.profiles.get(household.childId) : null;
  const childName = child?.petName || child?.fullName.trim().split(" ")[0] || "";
  await sendPushToHousehold(
    repos,
    householdId,
    { title: household?.parentAvatarId ? getAvatar(household.parentAvatarId).name : "ParCare", body: translator("parentChat")("review", { childName }), url: "/p", tag: `review-${promptId}` },
    "parent",
  );
}

/** The parent taps "All is fine" on her review question. */
export async function markParentReviewDone(repos: Repos, householdId: string, promptId: string, now: Date): Promise<boolean> {
  const prompt = await repos.reviewPrompts.get(promptId);
  if (!prompt || prompt.householdId !== householdId || prompt.audience !== "parent") return false;
  if (!prompt.doneAt) await repos.reviewPrompts.update(prompt.id, { doneAt: iso(now) });
  return true;
}

/** The child taps "Done, we talked" on a review bubble. */
export async function markReviewDone(repos: Repos, householdId: string, alertId: string, now: Date): Promise<boolean> {
  const alert = await repos.alerts.get(alertId);
  if (!alert || alert.householdId !== householdId || alert.kind !== "review") return false;
  if (!alert.ackAt) await repos.alerts.update(alert.id, { ackAt: iso(now) });
  const promptId = typeof alert.data.reviewPromptId === "string" ? alert.data.reviewPromptId : null;
  const prompt = promptId ? await repos.reviewPrompts.get(promptId) : null;
  if (prompt && prompt.householdId === householdId && !prompt.doneAt) await repos.reviewPrompts.update(prompt.id, { doneAt: iso(now) });
  return true;
}
