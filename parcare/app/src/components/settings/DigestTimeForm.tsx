"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type DigestTimeState, saveDigestTimeAction } from "@/app/(app)/(tabs)/settings/actions";
import { buttonStyles } from "@/components/ui/Screen";

// Daily digest time, in the child's own time zone (5.10). A plain form, so it works even before
// the page's JavaScript has loaded.
export function DigestTimeForm({ initial, timeZone }: { initial: string; timeZone: string }) {
  const t = useTranslations("settings.digest");
  const [state, formAction, pending] = useActionState<DigestTimeState, FormData>(saveDigestTimeAction, {});
  return (
    <form action={formAction} className="rounded-xl border border-[#e9edef] p-4" data-testid="digest-time">
      <label htmlFor="digest-time" className="text-base font-semibold">
        {t("title")}
      </label>
      <p className="text-sm text-[#54656f]">{t("hint", { timeZone })}</p>
      <div className="mt-2 flex gap-2">
        <input
          id="digest-time"
          name="time"
          type="time"
          required
          defaultValue={state.saved ?? initial}
          className="min-h-12 flex-1 rounded-lg border border-neutral-400 px-3 text-base"
        />
        <button type="submit" className={`${buttonStyles.primary} w-auto px-6`} disabled={pending}>
          {t("save")}
        </button>
      </div>
      {state.saved && (
        <p role="status" className="mt-2 text-sm text-[#008069]">
          {t("saved", { time: state.saved })}
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
