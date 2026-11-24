import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { BackIcon } from "@/components/wa/icons";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { timeFormatter } from "@/data/chat-data";
import { appNow } from "@/domain/clock";
import { dayLabel } from "@/domain/chat";
import { formatDayLabel } from "@/i18n/format";

// Alert history (5.5) with the time each alarm was switched off.
export default async function AlertsPage() {
  const t = await getTranslations("alerts");
  const tc = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 bg-[#008069] px-1 pt-[env(safe-area-inset-top)] text-white">
        <Link href="/home" aria-label={t("back")} className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10">
          <BackIcon />
        </Link>
        <h1 className="text-xl font-medium">{t("title")}</h1>
      </header>
      <Suspense fallback={<p className="p-4 text-[#54656f]">{tc("loading")}</p>}>
        <AlertList />
      </Suspense>
    </div>
  );
}

async function AlertList() {
  const t = await getTranslations("alerts");
  const tb = await getTranslations("bubbles");
  const { household, profile, parent } = await requireChild();
  if (!household) return null;
  const now = appNow(household);
  const tz = profile?.timeZone ?? "UTC";
  const formatTime = timeFormatter(tz);
  const alerts = (await (await getRepos()).alerts.find({ householdId: household.id }, { orderBy: "createdAt", desc: true })).filter(
    (a) => new Date(a.createdAt) <= now,
  );
  if (alerts.length === 0) return <p className="p-6 text-center text-base text-[#54656f]">{t("empty")}</p>;
  const petName = parent?.petName ?? "";

  const rows = await Promise.all(
    alerts.map(async (a) => {
      const when = `${await formatDayLabel(dayLabel(a.createdAt, now, tz))}, ${formatTime(a.createdAt)}`;
      const text =
        a.kind === "missed_checkin"
          ? tb("missedCheckin", { petName })
          : a.kind === "emergency_word"
            ? tb("emergencyWord", { petName })
            : a.kind === "all_disabled"
              ? tb("allDisabled", { petName })
              : tb("review", { petName });
      const isAlarm = a.kind === "missed_checkin" || a.kind === "emergency_word";
      const ackWhen = a.ackAt ? `${await formatDayLabel(dayLabel(a.ackAt, now, tz))}, ${formatTime(a.ackAt)}` : "";
      const ack = isAlarm
        ? a.ackAt
          ? t("switchedOff", { time: ackWhen })
          : t("stillRinging")
        : a.kind === "review"
          ? a.ackAt
            ? t("reviewDone", { time: ackWhen })
            : t("reviewOpen")
          : null;
      return { a, when, text, ack, isAlarm };
    }),
  );

  return (
    <ul className="divide-y divide-[#e9edef]" data-testid="alert-history">
      {rows.map(({ a, when, text, ack, isAlarm }) => (
        <li key={a.id} className="px-4 py-3" data-testid={`alert-${a.kind}`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-sm font-semibold ${a.kind === "emergency_word" ? "text-[#b42318]" : isAlarm ? "text-[#c4320a]" : "text-[#54656f]"}`}>
              {t(`kinds.${a.kind}`)}
            </span>
            <span className="shrink-0 text-xs text-[#54656f]">{when}</span>
          </div>
          <p className="mt-1 text-base text-[#111b21]">{text}</p>
          {ack && (
            <p className={`mt-1 text-sm ${a.ackAt || !isAlarm ? "text-[#54656f]" : "font-semibold text-[#b42318]"}`}>
              {ack}
              {!a.ackAt && isAlarm && (
                <>
                  {" "}
                  <Link href="/alarm" className="underline">
                    {t("open")}
                  </Link>
                </>
              )}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
