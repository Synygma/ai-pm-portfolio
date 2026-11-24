"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MicIcon, SendIcon } from "./icons";

type Props = {
  onSend: (text: string) => void;
  /** Mic pressed (push-to-talk is wired up where the input bar is used, e.g. setup step e). */
  onMic?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

// Rounded text field with a round green button on the right: mic when empty, send when there
// is text.
export function InputBar({ onSend, onMic, placeholder, disabled = false }: Props) {
  const t = useTranslations("inputBar");
  const [text, setText] = useState("");
  const hasText = text.trim().length > 0;

  function send() {
    if (!hasText) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <form
      className="flex items-end gap-2 bg-transparent px-2 py-2"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <label className="flex min-h-12 flex-1 items-center rounded-3xl bg-white px-4 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]">
        <span className="sr-only">{placeholder ?? t("placeholder")}</span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder ?? t("placeholder")}
          disabled={disabled}
          className="w-full bg-transparent text-base text-[#111b21] outline-none placeholder:text-[#8696a0]"
        />
      </label>
      {hasText ? (
        <button
          type="submit"
          aria-label={t("send")}
          disabled={disabled}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#008069] text-white"
        >
          <SendIcon size={22} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={t("mic")}
          onClick={onMic}
          disabled={disabled}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#008069] text-white"
        >
          <MicIcon size={22} />
        </button>
      )}
    </form>
  );
}
