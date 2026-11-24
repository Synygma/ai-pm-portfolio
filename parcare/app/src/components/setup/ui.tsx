"use client";

import { useTranslations } from "next-intl";
import { createContext, useContext, useId } from "react";
import { buttonStyles } from "@/components/ui/Screen";

export const inputClass =
  "min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-3 text-base outline-none focus:border-[#008069] focus:ring-2 focus:ring-[#008069]/30 aria-[invalid=true]:border-red-600";

/** Error text for a field error code ("required", "age", ...). */
export function FieldError({ code, id }: { code?: string; id?: string }) {
  const t = useTranslations("setup.errors");
  if (!code) return null;
  return (
    <p id={id} className="text-sm text-red-800">
      {t(code)}
    </p>
  );
}

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
};

export function Field({ label, hint, error, optional, children }: FieldProps) {
  const t = useTranslations("setup.fields");
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-base font-medium">
        {label}
        {optional && <span className="font-normal text-[#54656f]"> ({t("optional")})</span>}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-[#54656f]">
          {hint}
        </p>
      )}
      <FieldError code={error} id={`${id}-err`} />
    </div>
  );
}

/** Bulleted list from a message object like { p1: "...", p2: "..." }. */
export function Bullets({ ns, list, values }: { ns: string; list: string; values?: Record<string, string> }) {
  const t = useTranslations(ns);
  const keys = Object.keys(t.raw(list) as Record<string, string>);
  return (
    <ul className="flex list-disc flex-col gap-2 pl-6 text-base leading-snug">
      {keys.map((k) => (
        <li key={k}>{t(`${list}.${k}`, values)}</li>
      ))}
    </ul>
  );
}

/** Leaves the wizard for the "setup saved" page (provided by the wizard). */
export const SaveLaterContext = createContext<() => void>(() => {});

export function StepActions({
  onBack,
  onNext,
  nextLabel,
  pending,
  nextDisabled,
  saveLater,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  pending?: boolean;
  nextDisabled?: boolean;
  /** Form steps: save this page first, then leave. Other steps just leave (earlier steps are already saved). */
  saveLater?: () => void;
}) {
  const t = useTranslations("setup");
  const leave = useContext(SaveLaterContext);
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className={`${buttonStyles.secondary} flex-1`} disabled={pending}>
            {t("back")}
          </button>
        )}
        <button type="button" onClick={onNext} className={`${buttonStyles.primary} flex-[2]`} disabled={pending || nextDisabled}>
          {pending ? t("saving") : (nextLabel ?? t("next"))}
        </button>
      </div>
      <button
        type="button"
        onClick={saveLater ?? leave}
        disabled={pending}
        className="min-h-12 w-full rounded-full text-base font-semibold text-[#008069] underline disabled:opacity-60"
      >
        {t("saveLater")}
      </button>
    </div>
  );
}

export function StepTitle({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold text-[#111b21]">{title}</h2>
      {intro && <p className="mt-1 text-base text-[#54656f]">{intro}</p>}
    </div>
  );
}

