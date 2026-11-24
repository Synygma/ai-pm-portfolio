"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { sendHelpAction } from "@/app/p/(parent)/actions";
import { Recorder } from "@/components/reminders/Recorder";
import { PushToTalk } from "@/components/setup/PushToTalk";
import { buttonStyles } from "@/components/ui/Screen";
import { findEmergencyWord } from "@/domain/emergency";

const extFor = (type: string) => (type.includes("ogg") ? "ogg" : type.includes("mp4") ? "m4a" : "webm");

// "Ask for help" (handoff 7.7): a short voice note and/or her words go to the child's Helper list.
// G5: if what she says (hold-to-talk) contains an emergency word, sending happens at once: the
// recording stops, the child's distinct alarm rings and her app shows PAUSE.
export function HelpForm({ childName }: { childName: string }) {
  const t = useTranslations("parentApp.help");
  const router = useRouter();
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [notice, setNotice] = useState<{ kind: "sent" | "error"; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [pending, start] = useTransition();
  const sending = useRef(false);

  function send(words: string, clip: Blob | null) {
    if (sending.current) return;
    sending.current = true;
    setNotice(null);
    start(async () => {
      const data = new FormData();
      data.set("text", words);
      if (clip) data.set("audio", new File([clip], `help.${extFor(clip.type)}`, { type: clip.type }));
      const r = await sendHelpAction(data);
      sending.current = false;
      if (!r.ok) {
        setNotice({ kind: "error", text: t(`errors.${r.error}`) });
        return;
      }
      if (r.emergency) {
        router.push("/p/pause");
        return;
      }
      setText("");
      setAudio(null);
      setFormKey((k) => k + 1); // a fresh recorder (mic off, preview cleared)
      setNotice({ kind: "sent", text: t("sent", { childName }) });
      router.refresh();
    });
  }

  return (
    <section key={formKey} className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm" data-testid="help-form">
      <div>
        <h2 className="text-lg font-semibold">{t("voiceTitle")}</h2>
        <Recorder onChange={setAudio} />
      </div>
      <label className="flex flex-col gap-1 text-lg font-semibold">
        {t("label")}
        <textarea
          className="w-full rounded-xl border border-neutral-400 p-3 text-lg font-normal"
          rows={3}
          maxLength={500}
          placeholder={t("placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>
      <PushToTalk
        onText={(spoken) => {
          const words = `${text} ${spoken}`.trim();
          setText(words);
          if (findEmergencyWord(words)) {
            send(words, audio);
            return "stop"; // G5: stop listening at once
          }
        }}
      />
      <button type="button" className={`${buttonStyles.primary} min-h-14 text-lg`} disabled={pending} onClick={() => send(text, audio)}>
        {pending ? t("sending") : t("send", { childName })}
      </button>
      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`text-lg ${notice.kind === "error" ? "text-red-800" : "text-[#008069]"}`} data-testid="help-notice">
          {notice.text}
        </p>
      )}
    </section>
  );
}
