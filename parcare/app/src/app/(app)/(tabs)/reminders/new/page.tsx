import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { BackIcon } from "@/components/wa/icons";
import { requireChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { addDays, localDate } from "@/domain/time";

export default async function NewReminderPage() {
  const t = await getTranslations("reminders");
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-3">
        <Link href="/reminders" aria-label={t("back")} className="flex h-12 w-12 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5">
          <BackIcon />
        </Link>
        <h2 className="text-xl font-semibold">{t("newTitle")}</h2>
      </div>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const { household, profile, parent } = await requireChild();
  if (!household || !parent) return null;
  const now = appNow(household);
  return (
    <ReminderForm
      parentPetName={parent.petName}
      parentTimeZone={parent.timeZone}
      childTimeZone={profile?.timeZone ?? "UTC"}
      defaultDate={addDays(localDate(now, parent.timeZone), 1)}
    />
  );
}
