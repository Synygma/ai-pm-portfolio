"use server";

import { redirect } from "next/navigation";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { activeAlarms } from "@/domain/engine";
import { acknowledgeAlert } from "@/services/alerts";

/** "Switch off": stops this alarm; shows the next one if another is ringing, else the history. */
export async function switchOffAlarmAction(alertId: string): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) redirect("/login");
  const repos = await getRepos();
  const now = appNow(child.household);
  await acknowledgeAlert(repos, child.household.id, alertId, now);
  const remaining = activeAlarms(await repos.alerts.find({ householdId: child.household.id, ackAt: null }), now);
  redirect(remaining.length > 0 ? "/alarm?next=1" : "/alerts");
}

/**
 * "Switch off all": every ringing missed check-in alarm at once (P-036). An emergency-word alarm is
 * never switched off this way; it still needs its own tap.
 */
export async function switchOffAllMissedAction(): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) redirect("/login");
  const repos = await getRepos();
  const now = appNow(child.household);
  const ringing = activeAlarms(await repos.alerts.find({ householdId: child.household.id, ackAt: null }), now);
  for (const a of ringing.filter((x) => x.kind === "missed_checkin")) await acknowledgeAlert(repos, child.household.id, a.id, now);
  const remaining = activeAlarms(await repos.alerts.find({ householdId: child.household.id, ackAt: null }), now);
  redirect(remaining.length > 0 ? "/alarm?next=1" : "/alerts");
}
