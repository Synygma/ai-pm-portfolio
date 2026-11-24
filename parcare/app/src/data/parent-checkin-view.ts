import "server-only";
import type { CheckinRow } from "@/data/types";
import { localTime } from "@/domain/time";
import { translator } from "@/i18n/translator";
import { appNow } from "@/domain/clock";
import { answerableCheckins, openCheckin } from "@/services/parent-checkins";
import type { CurrentParent } from "./parent-access";

export type OpenCheckinView = {
  checkin: CheckinRow;
  question: string;
  snoozedUntil: string | null;
  contact: { name: string; phone: string } | null;
};

/** What the answer card needs: the waiting check-in, its question, and the emergency contact. */
export async function loadOpenCheckin(me: CurrentParent): Promise<OpenCheckinView | null> {
  const checkin = await openCheckin(me.repos, me.household.id);
  return checkin ? viewOf(me, checkin) : null;
}

/** Every check-in she can still answer from her chat (P-029), newest first. */
export async function loadAnswerable(me: CurrentParent): Promise<OpenCheckinView[]> {
  const list = await answerableCheckins(me.repos, me.household.id, appNow(me.household));
  return Promise.all(list.map((c) => viewOf(me, c)));
}

async function viewOf(me: CurrentParent, checkin: CheckinRow): Promise<OpenCheckinView> {
  const meta = await me.repos.metaItems.get(checkin.metaItemId);
  const t = translator("parentChat");
  // The personalised last question, if this check-in was asked one (stored with its chat message).
  const asked = (await me.repos.chatMessages.find({ householdId: me.household.id, refId: checkin.id })).find((m) => typeof m.data.question === "string");
  const question = asked
    ? t(`lastQuestions.${asked.data.question as string}`, { firstName: me.firstName })
    : meta
      ? t(`prompt.${meta.checkinType}`, { firstName: me.firstName })
      : t("promptGeneric", { firstName: me.firstName });
  const contact = (await me.repos.emergencyContacts.find({ householdId: me.household.id }))[0] ?? null;
  return {
    checkin,
    question,
    snoozedUntil: checkin.status === "snoozed" && checkin.snoozedUntil ? localTime(new Date(checkin.snoozedUntil), me.parent.timeZone) : null,
    contact: contact ? { name: contact.name, phone: contact.phone } : null,
  };
}
