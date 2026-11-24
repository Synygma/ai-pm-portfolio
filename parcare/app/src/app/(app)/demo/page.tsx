import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DemoTools, type DemoView } from "@/components/demo/DemoTools";
import { BackIcon } from "@/components/wa/icons";
import { isDemoMode } from "@/config/env";
import { getDataMode, getRepos, getServiceRepos } from "@/data";
import { requireChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { activeAlarms, activeConsents } from "@/domain/engine";
import { localDate, localTime } from "@/domain/time";
import { formatCalendarDate } from "@/i18n/format";
import { tickHousehold } from "@/services/checkins";

// Demo tools (5.12): demo clock + parent simulator. Only when DEMO_MODE=true.
export default async function DemoPage() {
  const t = await getTranslations("demo");
  const tc = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col bg-[#f0f2f5]">
      <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 bg-[#008069] px-1 pt-[env(safe-area-inset-top)] text-white">
        <Link href="/home" aria-label={t("back")} className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10">
          <BackIcon />
        </Link>
        <h1 className="text-xl font-medium">{t("title")}</h1>
      </header>
      <Suspense fallback={<p className="p-4 text-[#54656f]">{tc("loading")}</p>}>
        <Demo />
      </Suspense>
    </div>
  );
}

async function Demo() {
  if (!isDemoMode()) notFound();
  const t = await getTranslations("demo");
  const { household, profile, parent } = await requireChild();
  if (!household || !parent) return <DemoTools view={null} />;
  const repos = await getRepos();
  const now = appNow(household);
  // Demo mode has no cron: run the engine first so the schedule shown is current.
  await tickHousehold(getServiceRepos(), household, now);
  const childTz = profile?.timeZone ?? "UTC";
  const [checkins, metaItems, consents, alerts, reminders] = await Promise.all([
    repos.checkins.find({ householdId: household.id }, { orderBy: "dueAt" }),
    repos.metaItems.find({ householdId: household.id }),
    repos.consents.find({ householdId: household.id }),
    repos.alerts.find({ householdId: household.id, ackAt: null }),
    repos.childReminders.find({ householdId: household.id, status: "ringing" }, { orderBy: "dueAt" }),
  ]);
  const labels = new Map(metaItems.map((m) => [m.id, m.label]));
  const fmt = (d: Date, tz: string) => `${formatCalendarDate(localDate(d, tz), "en", "short")} ${localTime(d, tz)}`;
  const upcoming = checkins
    .filter((c) => c.status === "prompted1" || c.status === "prompted2" || c.status === "escalated" || (c.status === "scheduled" && new Date(c.dueAt) >= now))
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      label: labels.get(c.metaItemId) ?? "",
      status: c.status,
      parentTime: localTime(new Date(c.dueAt), parent.timeZone),
      childTime: localTime(new Date(c.dueAt), childTz),
    }));

  // The check-in an answer will go to: the earliest prompted one, otherwise the next scheduled one.
  const target =
    checkins.find((c) => c.status === "prompted1" || c.status === "prompted2") ??
    checkins.find((c) => c.status === "scheduled" && new Date(c.dueAt) >= now);

  const view: DemoView = {
    ringingReminder: reminders[0] ? reminders[0].label || t("voiceReminder") : null,
    answerTarget: target ? { label: labels.get(target.metaItemId) ?? "", parentTime: localTime(new Date(target.dueAt), parent.timeZone) } : null,
    childNow: fmt(now, childTz),
    parentNow: fmt(now, parent.timeZone),
    childCity: profile?.city ?? childTz,
    parentCity: parent.city ?? parent.timeZone,
    parentPetName: parent.petName,
    offsetMinutes: Math.round(household.demoClockOffsetMs / 60000),
    gapA: household.gapAMinutes,
    gapB: household.gapBMinutes,
    activeConsents: activeConsents(consents, now).length,
    metaItems: metaItems.length,
    ringing: activeAlarms(alerts, now).length,
    companionId: household.parentAvatarId,
    memoryMode: getDataMode() === "memory",
    upcoming,
  };
  return <DemoTools view={view} />;
}
