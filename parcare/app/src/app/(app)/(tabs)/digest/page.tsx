import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/wa/ListSkeleton";
import { DigestIcon } from "@/components/wa/icons";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { timeFormatter } from "@/data/chat-data";
import { dayLabel } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { formatDayLabel } from "@/i18n/format";

// Digest tab (5.7): every daily digest, newest first.
export default function DigestListPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <DigestList />
    </Suspense>
  );
}

async function DigestList() {
  const t = await getTranslations("digest");
  const ts = await getTranslations("summary");
  const { household, profile, parent } = await requireChild();
  if (!household) return null;
  const repos = await getRepos();
  const now = appNow(household);
  const tz = profile?.timeZone ?? "UTC";
  const formatTime = timeFormatter(tz);
  const [digests, feedback] = await Promise.all([
    repos.digests.find({ householdId: household.id }, { orderBy: "sentAt", desc: true }),
    repos.digestFeedback.find({ householdId: household.id }),
  ]);
  const verdicts = new Map(feedback.map((f) => [f.digestId, f.verdict]));
  const visible = digests.filter((d) => new Date(d.sentAt) <= now);

  return (
    <section>
      <div className="px-4 pb-2 pt-4">
        <h2 className="text-lg font-semibold">{t("listTitle", { parentPetName: parent?.petName ?? "" })}</h2>
        <p className="text-sm text-[#54656f]">{t("listIntro", { time: household.digestLocalTime })}</p>
        <div className="mt-3 flex gap-2" data-testid="summary-links">
          {(["week", "month"] as const).map((p) => (
            <Link
              key={p}
              href={`/digest/${p}`}
              className="flex min-h-12 flex-1 items-center justify-center rounded-full border-2 border-[#008069] px-3 text-base font-semibold text-[#008069]"
            >
              {ts(`open.${p}`)}
            </Link>
          ))}
        </div>
        <p className="mt-1 text-sm text-[#54656f]">{ts("openHint")}</p>
      </div>
      {visible.length === 0 ? (
        <p className="p-6 text-center text-base text-[#54656f]" data-testid="digest-empty">
          {t("empty", { time: household.digestLocalTime })}
        </p>
      ) : (
        <ul className="divide-y divide-[#e9edef]" data-testid="digest-list">
          {await Promise.all(
            visible.map(async (d) => {
              const verdict = verdicts.get(d.id);
              return (
                <li key={d.id}>
                  <Link href={`/digest/${d.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6]" data-testid="digest-row">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7f5f1] text-[#008069]">
                      <DigestIcon size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[17px] font-medium">{await formatDayLabel(dayLabel(d.sentAt, now, tz))}</span>
                        <span className="shrink-0 text-xs text-[#54656f]">{formatTime(d.sentAt)}</span>
                      </span>
                      <span className="block text-[15px] text-[#54656f]">
                        {t("rowSummary", { count: d.items.length })}
                        {d.flags.length > 0 && ` · ${t("rowFlags", { count: d.flags.length })}`}
                      </span>
                      {verdict && <span className="mt-0.5 block text-xs font-semibold text-[#008069]">{t(`feedback.${verdict}Short`)}</span>}
                    </span>
                  </Link>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </section>
  );
}
