"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { OnOffChoice } from "@/components/ui/OnOffChoice";
import { SpeakerIcon } from "@/components/wa/icons";
import type { VoiceGender } from "@/config/brand";
import { pickVoice } from "@/domain/voice-pick";

// The companion can read its messages aloud with the phone's own free voice (Web Speech
// synthesis; PLAN-PARENT decision 3). It is optional and starts Off: she switches it on with the
// On / Off buttons at the top of her chat (or in Settings). The text always shows too. The choice
// is remembered on this phone.
// Browsers only allow speech after the person has tapped something, so automatic reading starts
// with the first tap if it could not start straight away.

const KEY = "parcare.readAloud";
const LAST = "parcare.readAloud.last";
const VOICE = "parcare.voice";

// The companion's voice (male / female, matching the picture). Set by <CompanionVoice> and by the
// setup wizard when she picks a companion; remembered on this phone.
let companionVoice: VoiceGender | null = null;
export function setCompanionVoice(v: VoiceGender | null) {
  companionVoice = v;
  if (v) write(VOICE, v);
}
function currentVoice(): VoiceGender | null {
  if (companionVoice) return companionVoice;
  const saved = typeof window !== "undefined" ? read(VOICE) : null;
  return saved === "male" || saved === "female" ? saved : null;
}

/** Tells reading aloud which voice the chosen companion has. Renders nothing. */
export function CompanionVoice({ voice }: { voice: VoiceGender }) {
  useEffect(() => setCompanionVoice(voice), [voice]);
  return null;
}
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: just not remembered */
  }
}

export function useReadAloudOn(): [boolean, (on: boolean) => void] {
  const on = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => read(KEY) === "on",
    () => false,
  );
  return [
    on,
    (value: boolean) => {
      write(KEY, value ? "on" : "off");
      if (!value) window.speechSynthesis?.cancel();
      listeners.forEach((l) => l());
    },
  ];
}

export function speak(text: string): boolean {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") return false;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const { voice, pitch } = pickVoice(synth.getVoices(), currentVoice());
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? "en-IN";
  u.pitch = pitch;
  u.rate = 0.9;
  synth.speak(u);
  return true;
}

/** Speaker button on a companion bubble. In the chat it shows only while reading aloud is On. */
export function ReadAloudButton({ text, onlyWhenOn = false }: { text: string; onlyWhenOn?: boolean }) {
  const t = useTranslations("parentApp");
  const [on] = useReadAloudOn();
  if (onlyWhenOn && !on) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      className="-ml-1 mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-[#01699a] hover:bg-black/5"
      aria-label={`${t("readAloud")}: ${text}`}
      data-testid="read-aloud"
    >
      <SpeakerIcon size={20} />
      {t("readAloud")}
    </button>
  );
}

/** Reads the newest companion message once per message, if reading aloud is on. */
export function AutoRead({ id, text }: { id: string; text: string }) {
  const [on] = useReadAloudOn();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!on || done || read(LAST) === id) return;
    const go = () => {
      if (speak(text)) {
        write(LAST, id);
        setDone(true);
      }
    };
    // Try now (works after a tap that opened this page), and again on the first tap if needed.
    if (navigator.userActivation?.hasBeenActive) go();
    window.addEventListener("pointerdown", go, { once: true });
    return () => window.removeEventListener("pointerdown", go);
  }, [on, done, id, text]);
  return null;
}

/** On / Off at the top of her chat. */
export function ReadAloudBar() {
  const t = useTranslations("parentApp.settings");
  const [on, setOn] = useReadAloudOn();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#d1d7db] bg-white px-4 py-2" data-testid="read-aloud-bar">
      <span className="text-base font-semibold">{t("readAloudTitle")}</span>
      <div className="w-40 shrink-0">
        <OnOffChoice label={t("readAloudTitle")} on={on} onChange={setOn} testId="read-aloud-chat" />
      </div>
    </div>
  );
}

/** On / Off in the parent's Settings. */
export function ReadAloudToggle() {
  const t = useTranslations("parentApp.settings");
  const [on, setOn] = useReadAloudOn();
  return (
    <div className="rounded-xl border border-[#e9edef] p-4">
      <p className="text-lg font-semibold">{t("readAloudTitle")}</p>
      <div className="mt-2">
        <OnOffChoice label={t("readAloudTitle")} on={on} onChange={setOn} testId="read-aloud-toggle" />
      </div>
      <p className="mt-2 text-base text-[#54656f]" data-testid="read-aloud-status">
        {on ? t("readAloudOn") : t("readAloudOff")}
      </p>
      <p className="mt-1 text-sm text-[#54656f]">{t("voiceNote")}</p>
    </div>
  );
}
