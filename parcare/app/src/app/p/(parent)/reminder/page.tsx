import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ReminderPlayer } from "@/components/parent/ReminderPlayer";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { getAvatar, MY_CHILD_AVATAR_ID } from "@/config/brand";
import { requireParent } from "@/data/parent-access";
import { getServiceVoiceStore } from "@/services/voice-store";

// The child's voice reminder ringing on the parent's phone (N14). Shown with the "My Child"
// picture: it is the child's own voice, never the AI companion (G16).
export default function ParentReminderPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#005c4b]" />}>
      <Ringing />
    </Suspense>
  );
}

async function Ringing() {
  const t = await getTranslations("parentApp.reminder");
  const ta = await getTranslations("avatar");
  const me = await requireParent();
  const reminder = (await me.repos.childReminders.find({ householdId: me.household.id, status: "ringing" }, { orderBy: "dueAt" }))[0];
  if (!reminder) redirect("/p");
  const src = reminder.audioPath ? await getServiceVoiceStore().playUrl(reminder.audioPath) : null;
  const myChild = getAvatar(MY_CHILD_AVATAR_ID);
  return (
    <div className="flex flex-1 flex-col gap-4 bg-[#005c4b] p-5 text-white" data-testid="parent-reminder">
      <div className="flex items-center gap-3">
        <AvatarCircle src={myChild.image} alt={ta("photoOf", { name: myChild.name })} size={72} />
        <h1 className="text-2xl font-bold leading-tight">{t("title", { childName: me.childName })}</h1>
      </div>
      <div className="rounded-2xl bg-white p-4 text-[#111b21]">
        {!reminder.audioPath && <p className="text-base text-[#54656f]">{t("noVoice", { childName: me.childName })}</p>}
        <p className="text-2xl font-semibold leading-snug" data-testid="reminder-label">
          {reminder.label}
        </p>
        {reminder.isSample && <p className="text-sm text-[#54656f]">{t("sample")}</p>}
      </div>
      <ReminderPlayer src={src} sample={reminder.isSample} childName={me.childName} />
    </div>
  );
}
