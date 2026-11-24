import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AlarmSound } from "@/components/alarm/AlarmSound";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { timeFormatter } from "@/data/chat-data";
import { appNow } from "@/domain/clock";
import { activeAlarms } from "@/domain/engine";
import { SwitchOffButton } from "@/components/alarm/SwitchOffButton";
import { switchOffAlarmAction, switchOffAllMissedAction } from "./actions";

// Full-screen child alarm (5.5 / 5.6). Keeps ringing until the child taps "Switch off".
// Factual wording; the emergency contact only appears if one was confirmed (G7); no calls (G6).
export default function AlarmPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#b42318]" />}>
      <Alarm searchParams={searchParams} />
    </Suspense>
  );
}

async function Alarm({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const afterSwitchOff = (await searchParams).next === "1";
  const t = await getTranslations("alarm");
  const tb = await getTranslations("bubbles");
  const { household, profile, parent } = await requireChild();
  if (!household) return null;
  const repos = await getRepos();
  const now = appNow(household);
  const alarms = activeAlarms(await repos.alerts.find({ householdId: household.id, ackAt: null }), now);
  const formatTime = timeFormatter(profile?.timeZone ?? "UTC");
  const missedCount = alarms.filter((a) => a.kind === "missed_checkin").length;

  if (alarms.length === 0) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center" data-testid="no-alarm">
        <p className="text-lg">{t("none")}</p>
        <Link href="/alerts" className="font-semibold text-[#008069] underline">
          {t("history")}
        </Link>
        <Link href="/home" className="font-semibold text-[#008069] underline">
          {t("backToChats")}
        </Link>
      </main>
    );
  }

  const alarm = alarms[0];
  const emergency = alarm.kind === "emergency_word";
  const petName = parent?.petName ?? String(alarm.data.petName ?? "");
  const contact = await repos.emergencyContacts.findOne({ householdId: household.id });
  const label = typeof alarm.data.label === "string" ? alarm.data.label : null;

  return (
    <main
      role="alertdialog"
      aria-labelledby="alarm-title"
      aria-describedby="alarm-text"
      className={`flex min-h-dvh flex-col gap-5 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-white ${
        emergency ? "bg-[#b42318]" : "bg-[#c4320a]"
      }`}
      data-testid={emergency ? "alarm-emergency" : "alarm-missed"}
    >
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-ping rounded-full bg-white" aria-hidden="true" />
        <h1 id="alarm-title" className="text-2xl font-bold">
          {emergency ? t("titleEmergency") : t("titleMissed")}
        </h1>
      </div>
      {afterSwitchOff && (
        <p role="status" className="rounded-xl bg-white px-4 py-3 text-lg font-semibold text-[#111b21]" data-testid="alarm-next-note">
          {t("switchedNext")}
        </p>
      )}
      <p className="text-sm text-white">{t("time", { time: formatTime(alarm.createdAt) })}</p>

      <p id="alarm-text" className="text-2xl font-semibold leading-snug">
        {emergency ? tb("emergencyWord", { petName }) : tb("missedCheckin", { petName })}
      </p>
      {!emergency && label && <p className="text-lg text-white/90">{t("missedDetail", { label })}</p>}

      {contact && (
        <section className="rounded-2xl bg-white/15 p-4" data-testid="alarm-contact">
          <h2 className="text-base font-semibold">{t("contactTitle")}</h2>
          <p className="mt-1 text-xl font-semibold">{contact.name}</p>
          <p className="text-xl tracking-wide">{contact.phone}</p>
          <p className="mt-2 text-sm text-white">{t("contactNote")}</p>
        </section>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <AlarmSound variant={emergency ? "emergency" : "missed"} />
        {alarms.length > 1 && <p className="text-center text-base">{t("more", { count: alarms.length - 1 })}</p>}
        <form action={switchOffAlarmAction.bind(null, alarm.id)}>
          <SwitchOffButton label={t("switchOff")} busy={t("switching")} className="min-h-16 w-full rounded-full bg-white text-xl font-bold text-[#b42318] shadow-lg disabled:opacity-80" />
        </form>
        {missedCount > 1 && (
          <form action={switchOffAllMissedAction}>
            <SwitchOffButton
              label={t("switchOffAll", { count: missedCount })}
              busy={t("switching")}
              className="min-h-14 w-full rounded-full border-2 border-white text-lg font-semibold text-white disabled:opacity-80"
              testId="switch-off-all"
            />
          </form>
        )}
      </div>
    </main>
  );
}
