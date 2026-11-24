"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { saveTimeZoneAction, type TimeZoneState } from "@/app/(app)/(tabs)/settings/actions";
import { TimeZoneSelect } from "@/components/places/pickers";
import { buttonStyles } from "@/components/ui/Screen";

// The child's own time zone (5.10), chosen from the full list. A plain form.
export function TimeZoneForm({ initial }: { initial: string }) {
  const t = useTranslations("settings.timeZone");
  const [state, formAction, pending] = useActionState<TimeZoneState, FormData>(saveTimeZoneAction, {});
  return (
    <form action={formAction} className="rounded-xl border border-[#e9edef] p-4" data-testid="settings-timezone">
      <label htmlFor="settings-tz" className="text-base font-semibold">
        {t("title")}
      </label>
      <p className="text-sm text-[#54656f]">{t("hint")}</p>
      <div className="mt-2 flex flex-col gap-2">
        <TimeZoneSelect field={{ id: "settings-tz", "aria-invalid": Boolean(state.error) }} name="timeZone" value={state.saved ?? initial} />
        <button type="submit" className={buttonStyles.primary} disabled={pending}>
          {t("save")}
        </button>
      </div>
      {state.saved && (
        <p role="status" className="mt-2 text-sm text-[#008069]">
          {t("saved", { timeZone: state.saved })}
        </p>
      )}
      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {t("invalid")}
        </p>
      )}
    </form>
  );
}
