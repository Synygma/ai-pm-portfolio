"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { adminLoginAction, sendNoteAction } from "@/app/admin/actions";
import { buttonStyles } from "@/components/ui/Screen";
import { NOTE_MAX, NOTE_PRESETS } from "@/domain/admin";

const inputClass =
  "min-h-12 w-full rounded-lg border border-neutral-400 px-3 text-base outline-none focus:border-[#008069] focus:ring-2 focus:ring-[#008069]/30";

export function AdminLoginForm() {
  const t = useTranslations("admin.login");
  const [state, action, pending] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <p className="text-base text-[#54656f]">{t("intro")}</p>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-base text-red-800">
          {t(state.error)}
        </p>
      )}
      <label className="flex flex-col gap-1 text-base">
        {t("email")}
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-base">
        {t("password")}
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <button type="submit" className={buttonStyles.primary} disabled={pending}>
        {t("submit")}
      </button>
    </form>
  );
}

export function SendNoteForm() {
  const t = useTranslations("admin.note");
  const [state, action, pending] = useActionState(sendNoteAction, {});
  const [choice, setChoice] = useState<string>(NOTE_PRESETS[0]);
  const [custom, setCustom] = useState("");
  return (
    <form action={action} className="flex flex-col gap-3" data-testid="send-note">
      <p className="text-base">{t("intro")}</p>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-base font-medium text-amber-900">{t("rule")}</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-base font-semibold">{t("choose")}</legend>
        {NOTE_PRESETS.map((p) => (
          <label key={p} className="flex items-start gap-3 rounded-xl border border-[#e9edef] p-3 text-base has-[:checked]:border-[#008069] has-[:checked]:bg-[#e7f5f1]">
            <input type="radio" name="choice" value={p} checked={choice === p} onChange={() => setChoice(p)} className="mt-1 h-5 w-5 accent-[#008069]" />
            {t(`presets.${p}`)}
          </label>
        ))}
        <label className="flex items-start gap-3 rounded-xl border border-[#e9edef] p-3 text-base has-[:checked]:border-[#008069] has-[:checked]:bg-[#e7f5f1]">
          <input type="radio" name="choice" value="custom" checked={choice === "custom"} onChange={() => setChoice("custom")} className="mt-1 h-5 w-5 accent-[#008069]" data-testid="note-custom" />
          {t("custom")}
        </label>
      </fieldset>
      {choice === "custom" && (
        <>
          <label className="flex flex-col gap-1 text-base">
            {t("customLabel", { max: NOTE_MAX })}
            <textarea
              name="custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              maxLength={NOTE_MAX}
              rows={3}
              className={`${inputClass} py-2`}
              data-testid="note-text"
            />
            <span className="text-sm text-[#54656f]">
              {custom.length} / {NOTE_MAX}
            </span>
          </label>
          <label className="flex min-h-12 items-center gap-3 text-base font-medium">
            <input type="checkbox" name="gentle" className="h-6 w-6 accent-[#008069]" data-testid="note-gentle" />
            {t("customConfirm")}
          </label>
        </>
      )}
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-base text-red-800" data-testid="note-error">
          {t(`errors.${state.error}`, { max: NOTE_MAX })}
        </p>
      )}
      {state.sent && (
        <p role="status" className="rounded-lg bg-[#e7f5f1] px-3 py-2 text-base text-[#005c4b]" data-testid="note-sent">
          {t("sent", state.sent)}
          {state.sent.skipped > 0 && <> {t("skipped", { count: state.sent.skipped })}</>}
        </p>
      )}
      <button type="submit" className={buttonStyles.primary} disabled={pending}>
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
