import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AlarmSound } from "@/components/alarm/AlarmSound";
import { AnswerCard } from "@/components/parent/AnswerCard";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { loadOpenCheckin } from "@/data/parent-checkin-view";
import { requireParent } from "@/data/parent-access";

// Prompt 2 (F2): full screen, looping alarm-like sound, until she answers or snoozes.
export default function ParentRingingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#005c4b]" />}>
      <Ringing />
    </Suspense>
  );
}

async function Ringing() {
  const t = await getTranslations("parentApp.ringing");
  const me = await requireParent();
  const open = await loadOpenCheckin(me);
  if (!open || open.checkin.status !== "prompted2") redirect("/p");
  const title = me.companion ? t("title", { name: me.companion.name }) : t("titleNoCompanion");
  return (
    <div className="flex flex-1 flex-col gap-3 bg-[#005c4b] p-4 text-white" data-testid="parent-ringing">
      <div className="flex items-center gap-3">
        {me.companion && <AvatarCircle src={me.companion.image} alt="" size={64} />}
        <h1 className="text-2xl font-bold leading-tight">{title}</h1>
      </div>
      <p className="text-lg">{t("hint", { childName: me.childName })}</p>
      <AlarmSound variant="missed" />
      <div className="text-[#111b21]">
        <AnswerCard
          checkinId={open.checkin.id}
          question={open.question}
          snoozedUntil={null}
          canSnooze
          childName={me.childName}
          contact={open.contact}
          afterAnswer="/p"
        />
      </div>
    </div>
  );
}
