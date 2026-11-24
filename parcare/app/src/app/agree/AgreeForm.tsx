"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { buttonStyles } from "@/components/ui/Screen";
import { agreeAction, type AgreeState } from "./actions";

export function AgreeForm() {
  const t = useTranslations("agree");
  const [state, formAction, pending] = useActionState<AgreeState, FormData>(agreeAction, {});
  return (
    <form action={formAction} className="mt-2 flex w-full flex-col gap-3">
      <label className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-[#008069] p-3 text-base font-medium">
        <input type="checkbox" name="accept" className="h-6 w-6 shrink-0 accent-[#008069]" />
        {t("accept")}
      </label>
      <p className="text-sm text-[#54656f]">{t("record")}</p>
      {state.error && (
        <p role="alert" className="text-sm text-red-800">
          {t("required")}
        </p>
      )}
      <button type="submit" className={buttonStyles.primary} disabled={pending}>
        {t("continue")}
      </button>
    </form>
  );
}
