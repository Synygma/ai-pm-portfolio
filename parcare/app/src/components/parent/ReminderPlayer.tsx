"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { answerReminderParentAction } from "@/app/p/(parent)/actions";
import { PlayIcon } from "@/components/wa/icons";
import { makeToneWav } from "@/lib/audio/tone";

// The child's voice reminder (N14) on the parent's phone: the child's own recording plays in a
// loop until she taps "OK, thank you" or "Snooze 10 min". Browsers need one tap before playing
// sound, so if it cannot start by itself a big "Tap to hear" button shows.
export function ReminderPlayer({ src, sample, childName }: { src: string | null; sample: boolean; childName: string }) {
  const t = useTranslations("parentApp.reminder");
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(src);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  // The sample reminder has no recording: a generated tone stands in (labelled "sample").
  useEffect(() => {
    if (src || !sample) return;
    const blobUrl = URL.createObjectURL(new Blob([makeToneWav(3) as BlobPart], { type: "audio/wav" }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(blobUrl);
    return () => URL.revokeObjectURL(blobUrl);
  }, [src, sample]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !url) return;
    a.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
    return () => a.pause();
  }, [url]);

  function answer(kind: "ok" | "snooze") {
    audioRef.current?.pause();
    start(async () => {
      const r = await answerReminderParentAction(kind);
      if (!r.ok) {
        setFailed(true);
        return;
      }
      router.push("/p");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {url && <audio ref={audioRef} src={url} loop onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} data-testid="reminder-audio" />}
      {url &&
        (playing ? (
          <p role="status" className="text-lg">
            {t("playing", { childName })}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void audioRef.current?.play().catch(() => {})}
            className="flex min-h-16 w-full items-center justify-center gap-2 rounded-full bg-white text-xl font-semibold text-[#005c4b] shadow"
          >
            <PlayIcon size={28} />
            {t("play", { childName })}
          </button>
        ))}
      <button type="button" className="flex min-h-16 w-full items-center justify-center rounded-full bg-white px-6 text-xl font-semibold text-[#005c4b] shadow transition-colors hover:bg-white/90 disabled:opacity-60" disabled={pending} onClick={() => answer("ok")}>
        {t("ok")}
      </button>
      <button type="button" className="min-h-14 rounded-full border-2 border-white text-lg font-semibold text-white" disabled={pending} onClick={() => answer("snooze")}>
        {t("snooze")}
      </button>
      {failed && (
        <p role="alert" className="text-lg">
          {t("failed")}
        </p>
      )}
    </div>
  );
}
