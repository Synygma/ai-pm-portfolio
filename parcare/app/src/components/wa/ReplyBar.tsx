"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Recorder } from "@/components/reminders/Recorder";

type Reaction = "up" | "down";

// Under a read bubble from the other person (P-030): 👍 / 👎 (tap again to take it back) or a short
// voice reply in the sender's own voice. G3: the mic is on only while recording, with an indicator.
export function ReplyBar(props: {
  messageId: string;
  reaction: Reaction | null;
  react: (messageId: string, reaction: string) => Promise<{ ok: boolean }>;
  voiceReply: (messageId: string, formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  /** e.g. "Not for emergencies." in her app (a voice reply is not read for emergency words). */
  note?: string;
}) {
  const t = useTranslations("replies");
  const router = useRouter();
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const react = (r: Reaction) =>
    start(async () => {
      setError(null);
      const res = await props.react(props.messageId, r).catch(() => ({ ok: false }));
      if (!res.ok) setError(t("failed"));
      router.refresh();
    });

  const send = () =>
    start(async () => {
      if (!clip) return;
      setError(null);
      const data = new FormData();
      const ext = clip.type.includes("mp4") ? "m4a" : clip.type.includes("ogg") ? "ogg" : "webm";
      data.set("audio", new File([clip], `reply.${ext}`, { type: clip.type }));
      const res = await props.voiceReply(props.messageId, data).catch(() => ({ ok: false, error: "failed" }));
      if (!res.ok) {
        setError(t(res.error === "audio" ? "audio" : "failed"));
        return;
      }
      setRecording(false);
      setClip(null);
      router.refresh();
    });

  const chip = (r: Reaction, emoji: string) => (
    <button
      type="button"
      aria-label={t(r)}
      aria-pressed={props.reaction === r}
      disabled={pending}
      onClick={() => react(r)}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border text-xl ${props.reaction === r ? "border-[#008069] bg-[#d9fdd3]" : "border-[#d1d7db] bg-white"}`}
      data-testid={`react-${r}`}
    >
      {emoji}
    </button>
  );

  return (
    <div className="mt-1 flex flex-col gap-2" data-testid="reply-bar">
      <div className="flex flex-wrap items-center gap-2">
        {chip("up", "👍")}
        {chip("down", "👎")}
        {!recording && (
          <button
            type="button"
            disabled={pending}
            onClick={() => setRecording(true)}
            className="inline-flex min-h-11 items-center rounded-full border border-[#d1d7db] bg-white px-3 text-sm font-medium text-[#008069]"
            data-testid="voice-reply"
          >
            {t("record")}
          </button>
        )}
        {props.reaction && (
          <span className="text-sm text-[#54656f]" data-testid="my-reaction">
            {t("yours", { reaction: props.reaction })}
          </span>
        )}
      </div>
      {recording && (
        <div className="flex flex-col gap-2 rounded-xl bg-white/70 p-2" data-testid="voice-reply-panel">
          {props.note && <p className="text-sm text-[#54656f]">{props.note}</p>}
          <Recorder onChange={setClip} />
          <div className="flex gap-2">
            <button type="button" disabled={pending || !clip} onClick={send} className="min-h-12 flex-1 rounded-full bg-[#008069] px-4 text-base font-semibold text-white disabled:opacity-50">
              {t("send")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setRecording(false);
                setClip(null);
              }}
              className="min-h-12 rounded-full px-4 text-base text-[#54656f]"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
