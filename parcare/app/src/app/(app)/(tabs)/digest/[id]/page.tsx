import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DigestFeedback } from "@/components/digest/DigestFeedback";
import { BackIcon } from "@/components/wa/icons";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { timeFormatter } from "@/data/chat-data";
import { dayLabel } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { isFreeOfDiagnosis, safeLabel } from "@/domain/digest";
import { localTime } from "@/domain/time";
import { formatDayLabel } from "@/i18n/format";

// One daily digest (5.7): the parent's own words (quoted exactly), factual pattern notes (never a
// diagnosis), only items she shares, and the Matched / Did not match buttons.
export default function DigestPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-4" />}>
      <Digest params={params} />
    </Suspense>
  );
}

async function Digest({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("digest");
  const tt = await getTranslations("checkinTypes");
  const { household, profile, parent } = await requireChild();
  if (!household || !parent) notFound();
  const repos = await getRepos();
  const digest = await repos.digests.get(id);
  const now = appNow(household);
  if (!digest || digest.householdId !== household.id || new Date(digest.sentAt) > now) notFound();
  const feedback = await repos.digestFeedback.findOne({ householdId: household.id, digestId: digest.id });
  const tz = profile?.timeZone ?? "UTC";
  const petName = parent.petName;
  const day = await formatDayLabel(dayLabel(digest.sentAt, now, tz));

  // Pattern notes are ParCare's own words: built from templates and checked for blocked words.
  const flagLines = digest.flags
    .map((f) => {
      const label = safeLabel(f.label, tt(f.checkinType));
      const values = { label, time: f.usualLocalTime ?? "", parentPetName: petName };
      const key = `${f.kind}${f.usualLocalTime ? "" : "NoTime"}`;
      return t(`flags.${key}`, values);
    })
    .filter(isFreeOfDiagnosis);

  return (
    <div className="flex flex-col gap-4 bg-[#f0f2f5] p-4 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/digest" aria-label={t("back")} className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5">
          <BackIcon />
        </Link>
        <div>
          <h2 className="text-xl font-semibold">{t("title", { day })}</h2>
          <p className="text-sm text-[#54656f]">{t("covers", { time: timeFormatter(tz)(digest.periodEnd) })}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="words-title" data-testid="digest-items">
        <h3 id="words-title" className="text-base font-semibold">
          {t("wordsTitle", { parentPetName: petName })}
        </h3>
        <p className="mb-3 text-sm text-[#54656f]">{t("timesNote", { parentPetName: petName })}</p>
        {digest.items.length === 0 ? (
          <p className="text-base">{t("noItems", { parentPetName: petName })}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {digest.items.map((item) => (
              <li key={item.responseId} className="border-l-4 border-[#00a884] pl-3" data-testid="digest-item">
                <p className="text-sm text-[#54656f]">
                  {localTime(new Date(item.at), parent.timeZone)} · {item.label}
                </p>
                <blockquote className="text-lg leading-snug text-[#111b21]">
                  “<span data-testid="digest-quote">{item.quote}</span>”
                </blockquote>
              </li>
            ))}
          </ol>
        )}
      </section>

      {flagLines.length > 0 && (
        <section className="rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="flags-title" data-testid="digest-flags">
          <h3 id="flags-title" className="text-base font-semibold">
            {t("flagsTitle")}
          </h3>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-base">
            {flagLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-[#54656f]">{t("flagsNote")}</p>
        </section>
      )}

      <p className="text-sm text-[#54656f]">{t("sharedNote", { parentPetName: petName })}</p>
      <DigestFeedback digestId={digest.id} initial={feedback?.verdict ?? null} parentPetName={petName} />
    </div>
  );
}
