"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type RetentionState, saveRetentionAction } from "@/app/(app)/(tabs)/settings/actions";
import { buttonStyles } from "@/components/ui/Screen";
import { RETENTION_CHOICES, type RetentionDays } from "@/data/types";

// How long the family's words, voice clips and digests are kept (8 / 15 days / a month). A plain form.
export function RetentionForm({ initial, parentPetName }: { initial: RetentionDays; parentPetName: string }) {
  const t = useTranslations("settings.retention");
  const [state, formAction, pending] = useActionState<RetentionState, FormData>(saveRetentionAction, {});
  const current = state.saved ?? initial;
  return (
    <form action={formAction} className="rounded-xl border border-[#e9edef] p-4" data-testid="settings-retention">
      <h3 className="text-base font-semibold">{t("title")}</h3>
      <p className="mt-1 text-base">{t("what", { parentPetName })}</p>
      <fieldset className="mt-2 flex flex-col gap-1">
        <legend className="sr-only">{t("title")}</legend>
        {RETENTION_CHOICES.map((d) => (
          <label key={`${d}-${current}`} className="flex min-h-12 items-center gap-3 text-base">
            <input type="radio" name="days" value={d} defaultChecked={d === current} className="h-5 w-5 accent-[#008069]" />
            {t(`options.${d}`)}
          </label>
        ))}
      </fieldset>
      <button type="submit" className={`${buttonStyles.primary} mt-2`} disabled={pending}>
        {t("save")}
      </button>
      {state.saved && (
        <p role="status" className="mt-2 text-sm text-[#008069]">
          {t("saved", { days: state.saved })}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {t("invalid")}
        </p>
      )}
      <p className="mt-3 text-sm font-medium text-[#111b21]">{t("max")}</p>
      <p className="mt-1 text-sm text-[#54656f]">{t("kept", { parentPetName })}</p>
      <p className="mt-1 text-sm text-[#54656f]">{t("always")}</p>
    </form>
  );
}
