"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { makeToneWav, nextSpeed, waveformBars } from "@/lib/audio/tone";
import { PauseIcon, PlayIcon } from "./icons";

type Props = {
  /** Audio URL (signed Storage URL). When missing, a generated sample tone is played. */
  src?: string | null;
  /** Length in seconds, shown before playback starts. For a real recording the true length is
   *  read from the file when it loads. */
  durationSec: number;
  /** Seeds the waveform shape so each note looks different but stable. */
  seed: string;
  /** Marks a generated tone instead of a real recording. */
  sample?: boolean;
};

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Voice note: play/pause, waveform that fills as it plays, duration, speed chip 1× / 1.5× / 2×.
// Sits inside a <Bubble>.
export function VoiceNoteBubble({ src, durationSec, seed, sample = false }: Props) {
  const t = useTranslations("voiceNote");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [duration, setDuration] = useState(durationSec);
  const durationRef = useRef(durationSec);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);
  const bars = useMemo(() => waveformBars(seed), [seed]);

  // Real recordings: read the length. Browser recordings (webm) often report Infinity until the
  // end has been read, so seek far ahead once to make the browser work it out.
  useEffect(() => {
    if (!src) return;
    const probe = new Audio();
    probe.preload = "metadata";
    const done = () => {
      if (Number.isFinite(probe.duration) && probe.duration > 0) setDuration(Math.max(1, Math.round(probe.duration)));
    };
    probe.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(probe.duration)) done();
      else probe.currentTime = 1e7;
    });
    probe.addEventListener("durationchange", done);
    probe.src = src;
    return () => {
      probe.removeAttribute("src");
      probe.load();
    };
  }, [src]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      audio?.pause();
      if (audio?.src.startsWith("blob:")) URL.revokeObjectURL(audio.src);
    };
  }, []);

  function getAudio(): HTMLAudioElement {
    if (!audioRef.current) {
      const url = src ?? URL.createObjectURL(new Blob([makeToneWav(durationSec) as BlobPart], { type: "audio/wav" }));
      const audio = new Audio(url);
      audio.addEventListener("timeupdate", () => {
        const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : durationRef.current;
        setProgress(total ? Math.min(1, audio.currentTime / total) : 0);
      });
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }

  async function toggle() {
    const audio = getAudio();
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.playbackRate = speed;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function changeSpeed() {
    const next = nextSpeed(speed);
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  const remaining = playing || progress > 0 ? duration * (1 - progress) : duration;

  return (
    <div className="flex min-w-[220px] items-center gap-2" data-testid="voice-note" data-src={src ?? undefined}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("pause") : t("play")}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#54656f] hover:bg-black/5"
      >
        {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex h-7 items-center gap-[2px]" aria-hidden="true">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-full ${i / bars.length < progress ? "bg-[#00a884]" : "bg-[#8696a0]"}`}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-[#54656f]">
          <span>{formatDuration(remaining)}</span>
          {sample && <span className="rounded bg-amber-100 px-1.5 text-amber-900">{t("sample")}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={changeSpeed}
        aria-label={t("speed", { speed: `${speed}×` })}
        className="flex min-h-12 min-w-12 items-center justify-center"
        data-testid="speed-chip"
      >
        <span className="rounded-full bg-[#54656f] px-2 py-0.5 text-sm font-semibold text-white">{speed}×</span>
      </button>
    </div>
  );
}
