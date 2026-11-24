"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { type AnswerKind, answerCheckinAction, snoozeCheckinAction } from "@/app/p/(parent)/actions";
import { PushToTalk } from "@/components/setup/PushToTalk";
import { buttonStyles } from "@/components/ui/Screen";
import { ReadAloudButton } from "./ReadAloud";

// A check-in waiting for her answer: big buttons, or her own words (tap to talk or typed). In her
// chat it sits right under the companion's question (which it then does not repeat); on the
// ringing page it shows the question itself.
// An emergency word in her words opens the PAUSE page (G5).
export function AnswerCard(props: {
  checkinId: string;
  question: string;
  snoozedUntil: string | null;
  canSnooze: boolean;
  childName: string;
  contact: { name: string; phone: string } | null;
  afterAnswer?: string;
  /** In her chat the question is the bubble just above. */
  inChat?: boolean;
  /** The child has already been told she did not answer. */
  childTold?: boolean;
  testId?: string;
}) {
  const t = useTranslations("parentApp.answer");
  const router = useRouter();
  const [words, setWords] = useState("");
  const [spoken, setSpoken] = useState(false);
  const [state, setState] = useState<"idle" | "failed">("idle");
  const [pending, start] = useTransition();

  function answer(kind: AnswerKind) {
    start(async () => {
      const r = await answerCheckinAction(props.checkinId, kind, words, spoken);
      if (!r.ok) {
        setState("failed");
        return;
      }
      if (r.emergency) {
        // G5: its own page, so a refresh of the chat cannot hide it.
        router.push("/p/pause");
        return;
      }
      if (props.afterAnswer) router.push(props.afterAnswer);
      else router.refresh();
    });
  }

  const big = `${buttonStyles.primary} min-h-14 text-lg`;
  return (
    <section className="m-3 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-md" data-testid={props.testId ?? "answer-card"}>
      {props.inChat ? (
        <p className="text-lg font-semibold text-[#008069]">{t("answerHere")}</p>
      ) : (
        <div>
          <p className="text-xl font-semibold leading-snug">{props.question}</p>
          <ReadAloudButton text={props.question} />
        </div>
      )}
      {props.childTold && (
        <p className="text-lg text-[#54656f]" data-testid="answer-child-told">
          {t("childTold", { childName: props.childName })}
        </p>
      )}
      {props.snoozedUntil && <p className="text-lg text-[#54656f]">{t("snoozedUntil", { time: props.snoozedUntil })}</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={big} disabled={pending} onClick={() => answer("yes")}>
          {t("yes")}
        </button>
        <button type="button" className={`${buttonStyles.secondary} min-h-14 text-lg`} disabled={pending} onClick={() => answer("no")}>
          {t("no")}
        </button>
        {props.canSnooze && (
          <button
            type="button"
            className={`${buttonStyles.secondary} min-h-14 text-lg`}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await snoozeCheckinAction(props.checkinId);
                if (!r.ok) setState("failed");
                else if (props.afterAnswer) router.push(props.afterAnswer);
                else router.refresh();
              })
            }
          >
            {t("snooze")}
          </button>
        )}
        <button type="button" className={`${buttonStyles.secondary} min-h-14 text-lg ${props.canSnooze ? "" : "col-span-2"}`} disabled={pending} onClick={() => answer("okay")}>
          {t("okay")}
        </button>
      </div>
      <label className="flex flex-col gap-1 text-lg font-medium">
        {t("ownWords")}
        <textarea
          className="w-full rounded-xl border border-neutral-400 p-3 text-lg"
          rows={2}
          value={words}
          onChange={(e) => {
            setWords(e.target.value);
            setSpoken(false);
          }}
        />
      </label>
      <PushToTalk
        onText={(x) => {
          setWords((w) => `${w} ${x}`.trim());
          setSpoken(true);
        }}
      />
      <button type="button" className={big} disabled={pending || !words.trim()} onClick={() => answer("words")}>
        {t("send")}
      </button>
      {state === "failed" && (
        <p role="alert" className="text-lg text-red-800">
          {t("failed")}
        </p>
      )}
    </section>
  );
}
