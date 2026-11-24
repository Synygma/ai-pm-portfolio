import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { MarkHelperSeen } from "@/components/helper/MarkHelperSeen";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { ListSkeleton } from "@/components/wa/ListSkeleton";
import { VoiceNoteBubble } from "@/components/wa/VoiceNoteBubble";
import { brand, getAvatar } from "@/config/brand";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { timeFormatter } from "@/data/chat-data";
import { dayLabel } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { findEmergencyWord } from "@/domain/emergency";
import { formatDayLabel } from "@/i18n/format";
import { getVoiceStore } from "@/services/voice-store";
import { setHelperDoneAction } from "./actions";

// Helper list (5.8): the parent's non-urgent requests, shown with the helper-badge avatar.
// No marketplace or vendor: the child arranges help themselves (section 2).
export default function HelperPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <HelperList />
    </Suspense>
  );
}

async function HelperList() {
  const t = await getTranslations("helper");
  const ta = await getTranslations("avatar");
  const { household, profile, parent } = await requireChild();
  if (!household) return null;
  const repos = await getRepos();
  const voice = await getVoiceStore();
  const now = appNow(household);
  const tz = profile?.timeZone ?? "UTC";
  const formatTime = timeFormatter(tz);
  const requests = (await repos.helperRequests.find({ householdId: household.id }, { orderBy: "createdAt", desc: true })).filter(
    (r) => new Date(r.createdAt) <= now,
  );
  const avatar = household.parentAvatarId ? getAvatar(household.parentAvatarId) : null;
  const petName = parent?.petName ?? "";
  const newCount = requests.filter((r) => r.status === "new").length;

  return (
    <section>
      <div className="px-4 pb-2 pt-4">
        <h2 className="text-lg font-semibold">{t("title", { parentPetName: petName })}</h2>
        <p className="text-sm text-[#54656f]">{t("intro", { parentPetName: petName })}</p>
      </div>
      {requests.length === 0 ? (
        <p className="p-6 text-center text-base text-[#54656f]">{t("empty", { parentPetName: petName })}</p>
      ) : (
        <ul className="divide-y divide-[#e9edef]" data-testid="helper-list">
          {await Promise.all(
            requests.map(async (r) => {
              const audioUrl = r.audioPath ? await voice.playUrl(r.audioPath) : null;
              const emergency = findEmergencyWord(r.text) !== null;
              return (
                <li key={r.id} className="flex gap-3 px-4 py-3" data-testid="helper-item">
                  <AvatarCircle src={avatar?.image ?? brand.icons.icon192} alt="" size={48} helper helperLabel={ta("helperBadge")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm text-[#54656f]">
                        {await formatDayLabel(dayLabel(r.createdAt, now, tz))}, {formatTime(r.createdAt)}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.status === "new" ? "bg-[#008069] text-white" : r.status === "done" ? "bg-[#e7f5f1] text-[#005c4b]" : "bg-[#f0f2f5] text-[#54656f]"
                        }`}
                        data-testid="helper-status"
                      >
                        {t(`status.${r.status}`)}
                      </span>
                    </div>
                    {audioUrl && (
                      <div className="mt-1 rounded-lg bg-white p-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                        <VoiceNoteBubble src={audioUrl} durationSec={10} seed={r.id} />
                      </div>
                    )}
                    {r.text && (
                      <p className="mt-1 text-base text-[#111b21]">
                        <span className="sr-only">{t("transcript")}: </span>“{r.text}”
                      </p>
                    )}
                    {emergency && <p className="mt-1 text-sm font-semibold text-[#b42318]">{t("emergencyNote")}</p>}
                    {r.status !== "done" && (
                      <form action={setHelperDoneAction.bind(null, r.id, true)} className="mt-2">
                        <button type="submit" className="min-h-12 rounded-full border-2 border-[#008069] px-4 text-base font-semibold text-[#008069]">
                          {t("markDone")}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            }),
          )}
        </ul>
      )}
      <p className="px-4 py-3 text-sm text-[#54656f]">{t("note")}</p>
      <MarkHelperSeen count={newCount} />
    </section>
  );
}
