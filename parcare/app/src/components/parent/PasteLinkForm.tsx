"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { openPastedLinkAction } from "@/app/parent/actions";
import { buttonStyles } from "@/components/ui/Screen";

// P-033: an iPhone's home-screen app keeps its own sign-in and has no address bar, so the parent
// can paste the link their child sent right here.
export function PasteLinkForm() {
  const t = useTranslations("parentApp.noSession.paste");
  const [state, action, pending] = useActionState(openPastedLinkAction, { bad: false });
  return (
    <form action={action} className="flex w-full flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm" data-testid="paste-link">
      <label className="flex flex-col gap-1 text-lg font-medium">
        {t("label")}
        <input
          name="link"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
          className="min-h-12 rounded-xl border border-neutral-400 bg-white px-3 text-lg"
        />
      </label>
      <p className="text-base text-[#54656f]">{t("hint")}</p>
      <button type="submit" disabled={pending} className={`${buttonStyles.primary} min-h-14 text-lg`}>
        {t("open")}
      </button>
      {state.bad && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-lg text-red-800">
          {t("bad")}
        </p>
      )}
    </form>
  );
}
