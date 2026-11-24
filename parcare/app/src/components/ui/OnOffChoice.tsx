"use client";

import { useTranslations } from "next-intl";

// Two buttons side by side, "On" and "Off", so both choices are always visible; the chosen one is
// filled. Used for reading aloud and for notifications.
export function OnOffChoice({
  label,
  on,
  onChange,
  disabled = false,
  onDisabled = false,
  testId,
}: {
  label: string;
  on: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
  onDisabled?: boolean;
  testId: string;
}) {
  const t = useTranslations("onOff");
  const btn = (value: boolean) => {
    const chosen = on === value;
    return (
      <button
        type="button"
        aria-pressed={chosen}
        disabled={disabled || (value && onDisabled)}
        onClick={() => !chosen && onChange(value)}
        data-testid={`${testId}-${value ? "on" : "off"}`}
        className={`min-h-12 min-w-20 flex-1 px-4 text-base font-semibold disabled:opacity-50 ${
          chosen ? "bg-[#008069] text-white" : "bg-white text-[#008069] hover:bg-[#e7f5f1]"
        }`}
      >
        {value ? t("on") : t("off")}
      </button>
    );
  };
  return (
    <div role="group" aria-label={label} className="flex overflow-hidden rounded-full border-2 border-[#008069]" data-testid={testId}>
      {btn(true)}
      {btn(false)}
    </div>
  );
}
