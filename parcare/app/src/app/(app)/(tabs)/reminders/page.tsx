import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { buttonStyles } from "@/components/ui/Screen";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { ListSkeleton } from "@/components/wa/ListSkeleton";
import { VoiceNoteBubble } from "@/components/wa/VoiceNoteBubble";
import { getAvatar, MY_CHILD_AVATAR_ID } from "@/config/brand";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { dayLabel } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { localTime } from "@/domain/time";
import { formatDayLabel } from "@/i18n/format";
import { getVoiceStore } from "@/services/voice-store";
import { deleteReminderAction } from "./actions";

// Reminders for the parent (5.9, N14): the child's own recorded voice, shown with the "My Child"
// picture (never an AI voice: G16). Times are set in the parent's time zone.
export default function RemindersPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <ReminderList />
    </Suspense>
  );
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-[#f0f2f5] text-[#54656f]",
  ringing: "bg-[#b42318] text-white",
  parent_ok: "bg-[#e7f5f1] text-[#005c4b]",
  snoozed: "bg-amber-100 text-amber-900",
};

async function ReminderList() {
  const t = await getTranslations("reminders");
  const { household, profile, parent } = await requireChild();
  if (!household || !parent) return null;
  const repos = await getRepos();
  const voice = await getVoiceStore();
  const now = appNow(household);
  const childTz = profile?.timeZone ?? "UTC";
  const myChild = getAvatar(MY_CHILD_AVATAR_ID);
  const reminders = await repos.childReminders.find({ householdId: household.id }, { orderBy: "dueAt" });
  const petName = parent.petName;

  return (
    <section>
      <div className="px-4 pb-2 pt-4">
        <h2 className="text-lg font-semibold">{t("title", { parentPetName: petName })}</h2>
        <p className="text-sm text-[#54656f]">{t("intro", { parentPetName: petName })}</p>
        <Link href="/reminders/new" className={`${buttonStyles.primary} mt-3`} data-testid="new-reminder">
          {t("new")}
        </Link>
      </div>
      {reminders.length === 0 ? (
        <p className="p-6 text-center text-base text-[#54656f]">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-[#e9edef]" data-testid="reminder-list">
          {await Promise.all(
            reminders.map(async (r) => {
              const due = new Date(r.dueAt);
              const audioUrl = r.audioPath ? await voice.playUrl(r.audioPath) : null;
              const parentDay = await formatDayLabel(dayLabel(r.dueAt, now, parent.timeZone));
              const childDay = await formatDayLabel(dayLabel(r.dueAt, now, childTz));
              return (
                <li key={r.id} className="flex gap-3 px-4 py-3" data-testid="reminder-item">
                  <AvatarCircle src={myChild.image} alt={myChild.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-medium text-[#111b21]">{r.label || t("voiceOnly")}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`} data-testid="reminder-status">
                        {t(`status.${r.status}`)}
                      </span>
                    </div>
                    {(audioUrl || r.isSample) && (
                      <div className="mt-1 rounded-lg bg-[#D9FDD3] p-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
                        <VoiceNoteBubble src={audioUrl} durationSec={3} seed={r.id} sample={r.isSample} />
                      </div>
                    )}
                    <p className="mt-1 text-sm text-[#54656f]" data-testid="reminder-when">
                      {t("when", { parentDay, parentTime: localTime(due, parent.timeZone), parentPetName: petName })}
                      <br />
                      {t("whenChild", { childDay, childTime: localTime(due, childTz) })}
                    </p>
                    <p className="text-sm text-[#54656f]">{t(`repeat.${r.repeat}`)}</p>
                    <form action={deleteReminderAction.bind(null, r.id)} className="mt-1">
                      <button type="submit" className="min-h-12 text-base font-medium text-[#b42318] underline">
                        {t("delete")}
                      </button>
                    </form>
                  </div>
                </li>
              );
            }),
          )}
        </ul>
      )}
    </section>
  );
}
