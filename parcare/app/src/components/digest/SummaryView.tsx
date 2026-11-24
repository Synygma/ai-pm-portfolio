import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackIcon } from "@/components/wa/icons";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { safeLabel } from "@/domain/digest";
import { appNow } from "@/domain/clock";
import { buildSummary, SUMMARY_DAYS, type SummaryPeriod } from "@/domain/summary";
import { addMinutes, localDate, localTime } from "@/domain/time";

/** "Mon 2 Nov" for a parent-local date. */
function shortDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

// Weekly / monthly summary in words (P-011 item 4). No totals, percentages or scores (G12).
export async function SummaryView({ period }: { period: SummaryPeriod }) {
  const t = await getTranslations("summary");
  const td = await getTranslations("digest");
  const tt = await getTranslations("checkinTypes");
  const { household, parent } = await requireChild();
  if (!household || !parent) notFound();
  const repos = await getRepos();
  const now = appNow(household);
  const periodStart = addMinutes(now, -SUMMARY_DAYS[period] * 24 * 60);
  const [metaItems, consents, checkins, responses] = await Promise.all([
    repos.metaItems.find({ householdId: household.id, parentId: parent.id }),
    repos.consents.find({ householdId: household.id }),
    repos.checkins.find({ householdId: household.id }),
    repos.responses.find({ householdId: household.id }),
  ]);
  const summary = buildSummary({ periodStart, periodEnd: now, parentTimeZone: parent.timeZone, metaItems, consents, checkins, responses });
  const petName = parent.petName;
  const list = (dates: string[]) => dates.map(shortDate).join(", ");
  const days = household.retentionDays ?? 30;

  return (
    <section className="flex flex-col gap-4 bg-[#f0f2f5] p-4 pb-6">
      <div className="flex items-center gap-2">
        <Link href="/digest" aria-label={t("back")} className="flex h-12 w-12 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5">
          <BackIcon />
        </Link>
        <div>
          <h2 className="text-xl font-semibold">{t(`title.${period}`)}</h2>
          <p className="text-sm text-[#54656f]">
            {t("covers", { from: shortDate(localDate(periodStart, parent.timeZone)), to: shortDate(localDate(now, parent.timeZone)), parentPetName: petName })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm" data-testid="summary-lines">
        <h3 className="mb-2 text-base font-semibold">{t("checkinsTitle", { parentPetName: petName })}</h3>
        {summary.lines.length === 0 && <p className="text-base text-[#54656f]">{t("noItems", { parentPetName: petName })}</p>}
        <ul className="divide-y divide-[#e9edef]">
          {summary.lines.map((l) => {
            const planned = l.asked && l.notDone.length === 0 && l.noAnswer.length === 0 && l.unclear.length === 0;
            return (
              <li key={l.metaItemId} className="py-2" data-testid="summary-line">
                <p className="text-base font-medium">
                  {safeLabel(l.label, tt(l.checkinType))}
                  {l.localTime && <span className="font-normal text-[#54656f]"> · {l.localTime}</span>}
                </p>
                {!l.asked && <p className="text-sm text-[#54656f]">{t("notDue")}</p>}
                {planned && <p className="text-sm text-[#54656f]">{t("asPlanned", { parentPetName: petName })}</p>}
                {l.notDone.length > 0 && <p className="text-sm text-[#111b21]">{t("notDone", { dates: list(l.notDone) })}</p>}
                {l.noAnswer.length > 0 && <p className="text-sm text-[#111b21]">{t("noAnswer", { dates: list(l.noAnswer) })}</p>}
                {l.unclear.length > 0 && <p className="text-sm text-[#54656f]">{t("unclear", { dates: list(l.unclear) })}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm" data-testid="summary-words">
        <h3 className="mb-2 text-base font-semibold">{t("wordsTitle", { parentPetName: petName })}</h3>
        {summary.quotes.length === 0 ? (
          <p className="text-base text-[#54656f]">{t("noWords", { parentPetName: petName })}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {summary.quotes.map((q) => (
              <li key={q.at + q.text} className="rounded-lg bg-[#D9FDD3] px-3 py-2">
                <p className="text-base" data-testid="summary-quote">
                  “{q.text}”
                </p>
                <p className="text-xs text-[#54656f]">
                  {safeLabel(q.label, "")} · {shortDate(localDate(new Date(q.at), parent.timeZone))}, {localTime(new Date(q.at), parent.timeZone)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-[#54656f]">{t("note")}</p>
      <p className="text-sm text-[#54656f]">{td("sharedNote", { parentPetName: petName })}</p>
      {days < SUMMARY_DAYS[period] && <p className="text-sm text-[#54656f]">{t("kept", { days })}</p>}
    </section>
  );
}
