"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { VoiceNoteBubble } from "@/components/wa/VoiceNoteBubble";
import { MicIcon } from "@/components/wa/icons";
import { MAX_RECORDING_SECONDS } from "@/domain/reminders";

const PREFERRED_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];

// Short voice note with MediaRecorder (5.9). G3: the mic is on only between "Record" and "Stop",
// with a visible red indicator; it stops by itself after MAX_RECORDING_SECONDS.
export function Recorder({ onChange }: { onChange: (blob: Blob | null) => void }) {
  const t = useTranslations("reminders.recorder");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [preview, setPreview] = useState<{ url: string; seconds: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Feature detection has to run in the browser after mount (the server cannot know).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function start() {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t("blocked"));
      return;
    }
    const mimeType = PREFERRED_TYPES.find((m) => MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 32000 } : undefined);
    const chunks: Blob[] = [];
    const started = Date.now();
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setRecording(false);
      const blob = new Blob(chunks, { type: (recorder.mimeType || "audio/webm").split(";")[0] });
      const secs = Math.max(1, Math.round((Date.now() - started) / 1000));
      setPreview({ url: URL.createObjectURL(blob), seconds: secs });
      onChange(blob);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
    setSeconds(0);
    setPreview(null);
    onChange(null);
    timerRef.current = setInterval(() => {
      const s = Math.round((Date.now() - started) / 1000);
      setSeconds(s);
      if (s >= MAX_RECORDING_SECONDS) recorder.stop();
    }, 250);
  }

  function stop() {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  if (supported === false) return <p className="text-sm text-[#54656f]">{t("unsupported")}</p>;

  return (
    <div className="flex flex-col gap-2" data-testid="recorder">
      {recording ? (
        <div className="flex items-center gap-3">
          <p role="status" className="flex flex-1 items-center gap-2 text-base font-semibold text-red-700" data-testid="recording-on">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
            {t("recording", { seconds, max: MAX_RECORDING_SECONDS })}
          </p>
          <button type="button" onClick={stop} className="min-h-12 rounded-full bg-red-600 px-5 text-base font-semibold text-white">
            {t("stop")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={supported === null}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#008069] px-5 text-base font-semibold text-white disabled:opacity-50"
        >
          <MicIcon size={20} />
          {preview ? t("again") : t("record")}
        </button>
      )}
      {preview && !recording && (
        <div className="rounded-lg bg-[#D9FDD3] p-1 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" data-testid="recording-preview">
          <VoiceNoteBubble src={preview.url} durationSec={preview.seconds} seed={preview.url} />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
      <p className="text-xs text-[#54656f]">{t("note", { max: MAX_RECORDING_SECONDS })}</p>
    </div>
  );
}
