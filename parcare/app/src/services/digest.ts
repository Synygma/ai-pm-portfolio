// Sends the daily digest when the child's digest time passes (called from every tick, so it also
// arrives in real time during a demo) and stores the child's feedback.

import type { Repos } from "@/data/repo";
import type { DigestFeedbackRow, DigestRow, HouseholdRow } from "@/data/types";
import { buildDigest, digestDue } from "@/domain/digest";
import { translator } from "@/i18n/translator";
import { sendPushToHousehold } from "./push";

const iso = (d: Date) => d.toISOString();
const DAY_MS = 24 * 3600000;

export async function maybeSendDigest(repos: Repos, household: HouseholdRow, now: Date): Promise<DigestRow | null> {
  if (!household.setupCompletedAt || !household.managedParentId) return null;
  const [profile, parent, previous] = await Promise.all([
    repos.profiles.get(household.childId),
    repos.parentProfiles.get(household.managedParentId),
    repos.digests.find({ householdId: household.id }, { orderBy: "sentAt", desc: true, limit: 1 }),
  ]);
  if (!profile || !parent) return null;
  const due = digestDue({
    now,
    digestLocalTime: household.digestLocalTime,
    childTimeZone: profile.timeZone,
    setupCompletedAt: household.setupCompletedAt,
    lastDigestSentAt: previous[0]?.sentAt ?? null,
  });
  if (!due) return null;

  const [metaItems, consents, checkins, responses] = await Promise.all([
    repos.metaItems.find({ householdId: household.id, parentId: parent.id }),
    repos.consents.find({ householdId: household.id }),
    repos.checkins.find({ householdId: household.id }),
    repos.responses.find({ householdId: household.id }),
  ]);
  // Only what the pattern check needs: the period plus the week before it.
  const since = due.periodStart.getTime() - 8 * DAY_MS;
  const recent = <T extends { createdAt?: string; dueAt?: string }>(rows: T[]) =>
    rows.filter((r) => new Date((r.createdAt ?? r.dueAt)!).getTime() > since);

  const { items, flags } = buildDigest({
    periodStart: due.periodStart,
    periodEnd: due.periodEnd,
    metaItems,
    consents,
    checkins: recent(checkins),
    responses: recent(responses),
  });
  // One digest per period, even if two runs reach this at once.
  const digest = await repos.digests.insertUnique(
    {
      householdId: household.id,
      periodStart: iso(due.periodStart),
      periodEnd: iso(due.periodEnd),
      sentAt: iso(due.periodEnd),
      items,
      flags,
    },
    ["householdId", "periodEnd"],
  );
  if (!digest) return null;
  await repos.chatMessages.insert({
    householdId: household.id,
    kind: "digest",
    direction: "in",
    audience: "child",
    refId: digest.id,
    data: {},
    createdAt: digest.sentAt,
    readAt: null,
  });
  const t = translator("bubbles");
  await sendPushToHousehold(repos, household.id, {
    title: translator("push")("digestTitle"),
    body: t("digest", { parentPetName: parent.petName, count: items.length }),
    url: `/digest/${digest.id}`,
    tag: digest.id,
  });
  return digest;
}

/** "Matched what my parent told me" / "Did not match": one answer per digest, can be changed. */
export async function setDigestFeedback(
  repos: Repos,
  householdId: string,
  digestId: string,
  verdict: DigestFeedbackRow["verdict"],
  now: Date,
): Promise<DigestFeedbackRow | null> {
  const digest = await repos.digests.get(digestId);
  if (!digest || digest.householdId !== householdId) return null;
  for (const old of await repos.digestFeedback.find({ householdId, digestId })) await repos.digestFeedback.remove(old.id);
  return repos.digestFeedback.insert({ householdId, digestId, verdict, createdAt: iso(now) });
}
