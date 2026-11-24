// Runs the pure engine against the database. Used by /api/tick (every minute in production via
// Supabase pg_cron), by the demo clock and by the parent simulator.

import { DEMO_CHILD_EMAIL } from "@/config/demo";
import type { Repos } from "@/data/repo";
import { getAvatar } from "@/config/brand";
import type { AlertRow, DigestRow, HouseholdRow, ParentProfileRow, ResponseRow } from "@/data/types";
import { appNow } from "@/domain/clock";
import { findEmergencyWord } from "@/domain/emergency";
import { activeConsents, planTick } from "@/domain/engine";
import { dayNumber, NO_REPEAT_DAYS, pickLastQuestion } from "@/domain/last-question";
import { localDate } from "@/domain/time";
import { translator } from "@/i18n/translator";
import { raiseAlert } from "./alerts";
import { sendPushToHousehold } from "./push";
import { maybeSendDigest } from "./digest";
import { tickReminders } from "./reminders";
import { tickReviews } from "./review";
import { purgeOldData } from "./retention";
import type { VoiceStore } from "./voice";

const iso = (d: Date) => d.toISOString();

export type TickResult = {
  created: number;
  prompted: number;
  escalated: number;
  lapsed: number;
  deleted: number;
  alerts: AlertRow[];
  digest?: DigestRow | null;
};

/** The companion asks in the parent's chat and notifies her phone (prompt 1, or the alarm-like prompt 2). */
async function promptParent(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, checkinId: string, metaItemId: string, second: boolean, now: Date) {
  const meta = await repos.metaItems.get(metaItemId);
  // The last check-in of the day asks a personalised question (N13), the same one on prompt 2.
  const question = meta?.checkinType === "last_checkin" ? await lastQuestionFor(repos, household, parent, checkinId, now) : null;
  await repos.chatMessages.insert({
    householdId: household.id,
    kind: "checkin",
    direction: "in",
    audience: "parent",
    refId: checkinId,
    data: { ...(second ? { second: true } : {}), ...(question ? { question } : {}) },
    createdAt: iso(now),
    readAt: null,
  });
  const t = translator("parentChat");
  const firstName = parent.name.trim().split(/\s+/)[0] ?? parent.name;
  const text = question ? t(`lastQuestions.${question}`, { firstName }) : meta ? t(`prompt.${meta.checkinType}`, { firstName }) : t("promptGeneric", { firstName });
  await sendPushToHousehold(
    repos,
    household.id,
    {
      title: household.parentAvatarId ? getAvatar(household.parentAvatarId).name : "ParCare",
      body: second ? t("promptAgain", { firstName, question: text }) : text,
      url: second ? "/p/ringing" : "/p",
      tag: `checkin-${checkinId}`,
      alarm: second,
    },
    "parent",
  );
}

/** The question already asked for this check-in, or a new one not used in the last 7 days. */
async function lastQuestionFor(repos: Repos, household: HouseholdRow, parent: ParentProfileRow, checkinId: string, now: Date): Promise<string> {
  const messages = (await repos.chatMessages.find({ householdId: household.id, kind: "checkin" })).filter((m) => m.audience === "parent");
  const asked = messages.find((m) => m.refId === checkinId && typeof m.data.question === "string");
  if (asked) return asked.data.question as string;
  const since = now.getTime() - NO_REPEAT_DAYS * 24 * 3600000;
  const recent = messages.filter((m) => typeof m.data.question === "string" && new Date(m.createdAt).getTime() > since).map((m) => m.data.question as string);
  const consents = activeConsents(await repos.consents.find({ householdId: household.id }), now);
  const metas = await repos.metaItems.find({ householdId: household.id, parentId: parent.id });
  const types = metas.filter((m) => consents.some((c) => c.metaItemId === m.id)).map((m) => m.checkinType);
  return pickLastQuestion(types, recent, dayNumber(localDate(now, parent.timeZone)));
}

/** `voice` given = voice clips can be cleaned up too (done by /api/tick and the demo poll). */
export async function tickHousehold(repos: Repos, household: HouseholdRow, now: Date, voice?: VoiceStore): Promise<TickResult> {
  const result: TickResult = { created: 0, prompted: 0, escalated: 0, lapsed: 0, deleted: 0, alerts: [] };
  const parent = household.managedParentId ? await repos.parentProfiles.get(household.managedParentId) : null;
  if (!parent || !household.setupCompletedAt) return result;

  const [metaItems, consents, checkins, alerts] = await Promise.all([
    repos.metaItems.find({ householdId: household.id, parentId: parent.id }),
    repos.consents.find({ householdId: household.id }),
    repos.checkins.find({ householdId: household.id }),
    repos.alerts.find({ householdId: household.id }),
  ]);
  // Only open check-ins matter to the engine (keeps the work small as history grows).
  const open = checkins.filter((c) => c.status === "scheduled" || c.status === "prompted1" || c.status === "prompted2" || c.status === "snoozed");
  const recentOrOpen = checkins.filter((c) => open.includes(c) || new Date(c.dueAt).getTime() > now.getTime() - 48 * 3600000);

  const seen = (id: string) => recentOrOpen.find((c) => c.id === id)?.status;
  const actions = planTick({ now, household, parentTimeZone: parent.timeZone, metaItems, consents, checkins: recentOrOpen, alerts });
  for (const a of actions) {
    switch (a.type) {
      case "createCheckin": {
        // Unique per item and due time: if another run created it first, it is theirs to prompt.
        const created = await repos.checkins.insertUnique({
          householdId: household.id,
          metaItemId: a.metaItemId,
          dueAt: a.dueAt,
          status: a.promptAt ? "prompted1" : "scheduled",
          prompted1At: a.promptAt,
          prompted2At: null,
          answeredAt: null,
          escalatedAt: null,
          acknowledgedAt: null,
          snoozedUntil: null,
        }, ["householdId", "metaItemId", "dueAt"]);
        if (!created) break;
        result.created++;
        if (a.promptAt) {
          result.prompted++;
          await promptParent(repos, household, parent, created.id, a.metaItemId, false, now);
        }
        break;
      }
      case "deleteCheckin":
        await repos.checkins.remove(a.id);
        result.deleted++;
        break;
      case "prompt1": {
        // Delivered to the parent app: a question in her chat + a notification to her phone.
        // Each step only if the check-in is still as this run saw it (another run may have won).
        const c = await repos.checkins.updateIf(a.id, { status: seen(a.id) }, { status: "prompted1", prompted1At: a.at, snoozedUntil: null });
        if (!c) break;
        result.prompted++;
        await promptParent(repos, household, parent, c.id, c.metaItemId, false, now);
        break;
      }
      case "prompt2": {
        // The second, alarm-like reminder (F2): her app opens its ringing page.
        const c = await repos.checkins.updateIf(a.id, { status: "prompted1" }, { status: "prompted2", prompted2At: a.at });
        if (!c) break;
        result.prompted++;
        await promptParent(repos, household, parent, c.id, c.metaItemId, true, now);
        break;
      }
      case "lapse":
        if (await repos.checkins.updateIf(a.id, { status: seen(a.id) }, { status: "lapsed" })) result.lapsed++;
        break;
      case "escalate": {
        // Only the run that moves it to "escalated" raises the child's alarm (never twice).
        const checkin = await repos.checkins.updateIf(a.id, { status: "prompted2" }, { status: "escalated", escalatedAt: a.at });
        if (!checkin) break;
        const meta = metaItems.find((m) => m.id === checkin.metaItemId);
        result.alerts.push(
          await raiseAlert(repos, household.id, "missed_checkin", now, {
            checkinId: checkin.id,
            data: { checkinType: meta?.checkinType ?? null, label: meta?.label ?? null },
          }),
        );
        result.escalated++;
        break;
      }
      case "allDisabled":
        result.alerts.push(await raiseAlert(repos, household.id, "all_disabled", now));
        break;
    }
  }
  // Review prompts (5.11, G9): +1 week, then every 3 months.
  result.alerts.push(...(await tickReviews(repos, household.id, now)));
  // Child's voice reminders (5.9).
  await tickReminders(repos, household.id, parent.timeZone, now);
  // The family's chosen keeping period (8 / 15 / 30 days): old words, clips and digests go.
  await purgeOldData(repos, household, now, voice);
  // Daily digest at the child’s chosen time (5.7).
  result.digest = await maybeSendDigest(repos, household, now);
  return result;
}

/** Every set-up household, each at its own (demo-clock) time. */
export async function tickAllHouseholds(
  repos: Repos,
  realNow = Date.now(),
  voice?: VoiceStore,
): Promise<{ households: number; escalated: number; alerts: number }> {
  // The shared sample family (every teammate's Demo login) has no real parent to answer, so the
  // every-minute scheduler would pile up alarms for it all day (P-036). It runs only while someone
  // has the demo open: in demo mode the open apps' polls run the tick for their own household.
  const sampleChildIds = new Set((await repos.profiles.find({ email: DEMO_CHILD_EMAIL })).map((p) => p.id));
  const households = (await repos.households.find({})).filter((h) => h.setupCompletedAt && !sampleChildIds.has(h.childId));
  let escalated = 0;
  let alerts = 0;
  for (const h of households) {
    const r = await tickHousehold(repos, h, appNow(h, realNow), voice);
    escalated += r.escalated;
    alerts += r.alerts.length;
  }
  return { households: households.length, escalated, alerts };
}

// --- Parent side (parent app later; the demo parent simulator for now) ------------------------

async function checkEmergencyWord(repos: Repos, householdId: string, text: string, source: "response" | "helper", now: Date) {
  const phrase = findEmergencyWord(text);
  if (!phrase) return null;
  return raiseAlert(repos, householdId, "emergency_word", now, { data: { source } });
}

/**
 * The parent answers: the earliest prompted check-in, otherwise the next scheduled one. The words
 * are stored exactly (the digest quotes them). An emergency word raises the distinct alarm (G5).
 */
export async function answerNextCheckin(
  repos: Repos,
  householdId: string,
  text: string,
  outcome: ResponseRow["outcome"],
  now: Date,
): Promise<{ response: ResponseRow; checkinId: string | null; emergency: AlertRow | null }> {
  const checkins = await repos.checkins.find({ householdId }, { orderBy: "dueAt" });
  const target =
    checkins.find((c) => c.status === "prompted1" || c.status === "prompted2") ??
    checkins.find((c) => c.status === "scheduled" && new Date(c.dueAt).getTime() >= now.getTime());
  const response = await repos.responses.insert({ householdId, checkinId: target?.id ?? null, text, outcome, audioPath: null, source: null, createdAt: iso(now) });
  if (target) await repos.checkins.update(target.id, { status: "answered", answeredAt: iso(now) });
  const emergency = await checkEmergencyWord(repos, householdId, text, "response", now);
  return { response, checkinId: target?.id ?? null, emergency };
}

export async function createHelperRequest(repos: Repos, householdId: string, text: string, now: Date) {
  const request = await repos.helperRequests.insert({ householdId, text, audioPath: null, status: "new", createdAt: iso(now), updatedAt: iso(now) });
  await repos.chatMessages.insert({ householdId, kind: "helper", direction: "in", audience: "child", refId: request.id, data: {}, createdAt: iso(now), readAt: null });
  const emergency = await checkEmergencyWord(repos, householdId, text, "helper", now);
  return { request, emergency };
}

/** Parent switches every check-in off (revoke) or back on (new consent per item). */
export async function setAllConsents(repos: Repos, household: HouseholdRow, on: boolean, now: Date): Promise<number> {
  const consents = await repos.consents.find({ householdId: household.id });
  if (!on) {
    const active = activeConsents(consents, now);
    for (const c of active) await repos.consents.update(c.id, { revokedAt: iso(now) });
    return active.length;
  }
  const activeItems = new Set(activeConsents(consents, now).map((c) => c.metaItemId));
  const items = await repos.metaItems.find({ householdId: household.id, parentId: household.managedParentId ?? "" });
  const toGrant = items.filter((m) => !activeItems.has(m.id));
  await repos.consents.insertMany(toGrant.map((m) => ({ householdId: household.id, metaItemId: m.id, grantedAt: iso(now), revokedAt: null, shareInDigest: true })));
  return toGrant.length;
}
