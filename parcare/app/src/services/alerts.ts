// Creating and switching off alerts. Every child alarm also becomes a chat bubble and a web push.
// Wording is factual (5.5): never "emergency" for a missed check-in.

import type { Repos } from "@/data/repo";
import type { AlertKind, AlertRow } from "@/data/types";
import { translator } from "@/i18n/translator";
import { sendPushToHousehold } from "./push";

const iso = (d: Date) => d.toISOString();

export async function parentPetName(repos: Repos, householdId: string): Promise<string> {
  const household = await repos.households.get(householdId);
  const parent = household?.managedParentId ? await repos.parentProfiles.get(household.managedParentId) : null;
  return parent?.petName ?? "";
}

export async function raiseAlert(
  repos: Repos,
  householdId: string,
  kind: AlertKind,
  now: Date,
  extra: { checkinId?: string | null; data?: Record<string, unknown> } = {},
): Promise<AlertRow> {
  const petName = await parentPetName(repos, householdId);
  const alert = await repos.alerts.insert({
    householdId,
    kind,
    checkinId: extra.checkinId ?? null,
    data: { petName, ...extra.data },
    createdAt: iso(now),
    ackAt: null,
  });
  await repos.chatMessages.insert({
    householdId,
    kind: "alert",
    direction: "in",
    audience: "child",
    refId: alert.id,
    data: { petName },
    createdAt: iso(now),
    readAt: null,
  });
  const t = translator("bubbles");
  const tp = translator("push");
  const body =
    kind === "missed_checkin"
      ? t("missedCheckin", { petName })
      : kind === "emergency_word"
        ? t("emergencyWord", { petName })
        : kind === "all_disabled"
          ? t("allDisabled", { petName })
          : t("review", { petName });
  const isAlarm = kind === "missed_checkin" || kind === "emergency_word";
  await sendPushToHousehold(repos, householdId, {
    title: isAlarm ? tp("alarmTitle") : tp("noticeTitle"),
    body,
    url: isAlarm ? "/alarm" : "/chat",
    tag: alert.id,
    alarm: isAlarm,
  });
  return alert;
}

/** The child taps "Switch off": the alarm stops and the check-in is marked acknowledged. */
export async function acknowledgeAlert(repos: Repos, householdId: string, alertId: string, now: Date): Promise<AlertRow | null> {
  const alert = await repos.alerts.get(alertId);
  if (!alert || alert.householdId !== householdId) return null;
  if (alert.ackAt) return alert;
  const updated = await repos.alerts.update(alertId, { ackAt: iso(now) });
  if (alert.checkinId) {
    const checkin = await repos.checkins.get(alert.checkinId);
    if (checkin?.status === "escalated") await repos.checkins.update(checkin.id, { status: "acknowledged", acknowledgedAt: iso(now) });
  }
  for (const m of await repos.chatMessages.find({ householdId, refId: alertId, readAt: null })) {
    await repos.chatMessages.update(m.id, { readAt: iso(now) });
  }
  return updated;
}
