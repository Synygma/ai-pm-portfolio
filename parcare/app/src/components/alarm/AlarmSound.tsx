"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

// Looping alarm sound made with Web Audio (no audio file) + Screen Wake Lock. Browsers only allow
// sound after a tap on the page, so if it cannot start we show a big "turn on sound" button.
// The emergency-word alarm uses a different, faster and higher pattern.
export function AlarmSound({ variant }: { variant: "missed" | "emergency" }) {
  const t = useTranslations("alarm");
  const ctxRef = useRef<AudioContext | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const beep = (at: number, freq: number, length: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + length + 0.05);
    };
    const pattern = () => {
      if (ctx.state !== "running") return;
      const now = ctx.currentTime;
      if (variant === "emergency") [0, 0.18, 0.36, 0.54].forEach((d) => beep(now + d, 1320, 0.12));
      else {
        beep(now, 880, 0.25);
        beep(now + 0.35, 660, 0.25);
      }
    };

    const noSound = setTimeout(() => {
      if (ctx.state !== "running") setBlocked(true);
    }, 1000);
    ctx
      .resume()
      .then(() => {
        setBlocked(ctx.state !== "running");
        pattern();
      })
      // The page can close (alarm switched off, question answered) before the sound has started.
      .catch(() => {});
    const timer = setInterval(pattern, variant === "emergency" ? 1000 : 1500);

    const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((lock) => (wakeLock = lock)).catch(() => {});

    return () => {
      clearTimeout(noSound);
      clearInterval(timer);
      void wakeLock?.release().catch(() => {});
      void ctx.close();
    };
  }, [variant]);

  if (!blocked) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await ctxRef.current?.resume().catch(() => {});
        setBlocked(ctxRef.current?.state !== "running");
      }}
      className="min-h-14 w-full rounded-full bg-white px-6 text-lg font-semibold text-[#111b21] shadow"
    >
      {t("soundOn")}
    </button>
  );
}
