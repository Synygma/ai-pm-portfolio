"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MicIcon } from "@/components/wa/icons";
import { getSpeechProvider, type SpeechProvider } from "@/lib/speech";

type Props = {
  /** Called with each newly recognised piece of text, as soon as it is heard. Return "stop" to switch the mic off. */
  onText: (text: string) => void | "stop";
  lang?: string;
};

/** The mic switches itself off after this long (G3: never left on by mistake). */
export const MAX_LISTEN_MS = 60_000;
/** If the browser has not started listening by then, it is stuck: reset and say so. */
const START_TIMEOUT_MS = 8_000;
/** After "stop", the browser should finish within this time; otherwise force it. */
const STOP_TIMEOUT_MS = 3_000;

type Phase = "idle" | "starting" | "listening";

// Tap to talk, tap again to stop (G3: the mic is on only after a tap, with a visible "Mic on"
// indicator, and switches off by itself after a minute). Not hold-to-talk: on a phone the first
// press opens the browser's "allow the microphone" question, so a held button is let go at once.
// Hidden when the browser has no speech recognition; typing always works.
export function PushToTalk({ onText, lang = "en-IN" }: Props) {
  const t = useTranslations("setup.day");
  const providerRef = useRef<SpeechProvider | null>(null);
  const onTextRef = useRef(onText);
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Per run (one tap to the next) and per browser session within it.
  const run = useRef({ want: false, heard: false, failed: false, startedAt: 0, sent: 0, gotStart: false, retried: false });
  /** The microphone permission was already confirmed on this page (see askMic). */
  const micReady = useRef(false);
  const timers = useRef<{ start?: ReturnType<typeof setTimeout>; stop?: ReturnType<typeof setTimeout>; max?: ReturnType<typeof setTimeout> }>({});

  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => {
    providerRef.current = getSpeechProvider();
    // Feature detection has to run in the browser after mount.
    setSupported(providerRef.current.isSupported());
    const timerBox = timers.current;
    return () => {
      run.current.want = false;
      for (const id of Object.values(timerBox)) clearTimeout(id);
      providerRef.current?.abort();
    };
  }, []);

  function clearTimers() {
    for (const id of Object.values(timers.current)) clearTimeout(id);
    timers.current = {};
  }

  function done() {
    run.current.want = false;
    clearTimers();
    setPhase("idle");
    setInterim("");
    if (!run.current.heard && !run.current.failed) setError(t("micNothing"));
  }

  function fail(message: string) {
    run.current.failed = true;
    run.current.want = false;
    setError(message);
  }

  function session() {
    const provider = providerRef.current;
    if (!provider) return;
    run.current.sent = 0;
    run.current.gotStart = false;
    timers.current.start = setTimeout(() => {
      if (run.current.gotStart) return;
      provider.abort();
      fail(t("micNoStart"));
      done();
    }, START_TIMEOUT_MS);
    provider.start(lang, {
      onStart: () => {
        run.current.gotStart = true;
        clearTimeout(timers.current.start);
        setPhase("listening");
      },
      onText: (finalText, interimText) => {
        const piece = finalText.slice(run.current.sent).trim();
        if (piece) {
          run.current.sent = finalText.length;
          run.current.heard = true;
          if (onTextRef.current(piece) === "stop") finish();
        }
        setInterim(interimText);
      },
      onError: (code) => {
        if (code === "no-speech") return; // silence: handled when the run ends
        fail(t(code === "not-allowed" ? "micBlocked" : code === "network" ? "micNetwork" : code === "unavailable" ? "micUnavailable" : "micError"));
      },
      onEnd: () => {
        clearTimeout(timers.current.start);
        setInterim("");
        const r = run.current;
        // Phones end after each phrase: keep listening until the user taps stop (or a minute passes).
        // A session that never really started is not retried (avoids a restart loop).
        if (r.want && r.gotStart && Date.now() - r.startedAt < MAX_LISTEN_MS) return session();
        // Android Chrome sometimes ends the very first session at once (just after the permission
        // question): try once more by itself before saying it did not start.
        if (r.want && !r.gotStart && !r.failed && !r.retried) {
          r.retried = true;
          return session();
        }
        if (r.want && !r.gotStart && !r.failed) fail(t("micNoStart"));
        done();
      },
    });
  }

  function listen() {
    run.current.startedAt = Date.now();
    timers.current.max = setTimeout(finish, MAX_LISTEN_MS);
    session();
  }

  function begin() {
    if (!providerRef.current) return;
    setError(null);
    run.current = { want: true, heard: false, failed: false, startedAt: Date.now(), sent: 0, gotStart: false, retried: false };
    setPhase("starting");
    // A phone cannot read aloud and listen at the same time.
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    const getUserMedia = typeof navigator !== "undefined" ? navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices) : undefined;
    if (micReady.current || !getUserMedia) return listen();
    // Team test (P-032): on Android Chrome the first tap opened the permission question and speech
    // recognition ended without listening. Ask for the microphone first, release it, then listen.
    getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        micReady.current = true;
        if (!run.current.want) return done();
        setTimeout(() => (run.current.want ? listen() : done()), 250); // let the phone free the mic
      })
      .catch((e: unknown) => {
        const name = e instanceof Error ? e.name : "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          fail(t("micBlocked"));
          done();
        } else if (run.current.want) listen(); // e.g. no separate mic access: let speech try itself
      });
  }

  function finish() {
    const provider = providerRef.current;
    run.current.want = false;
    clearTimeout(timers.current.max);
    provider?.stop();
    // Some browsers never report the end after a stop: do not leave the mic looking on.
    timers.current.stop = setTimeout(() => {
      provider?.abort();
      done();
    }, STOP_TIMEOUT_MS);
  }

  if (!supported) return <p className="text-sm text-[#54656f]">{t("micUnsupported")}</p>;

  const on = phase !== "idle";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        aria-pressed={on}
        aria-label={on ? t("tapToStop") : t("tapToTalk")}
        onClick={() => (on ? finish() : begin())}
        className={`flex h-20 w-20 select-none items-center justify-center rounded-full text-white shadow-md transition-transform ${
          on ? "scale-110 bg-red-600" : "bg-[#008069]"
        }`}
      >
        <MicIcon size={36} />
      </button>
      {phase === "listening" && (
        <p role="status" className="flex items-center gap-2 text-base font-semibold text-red-700" data-testid="mic-on">
          <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" aria-hidden="true" />
          {t("micOn")}
        </p>
      )}
      {phase === "starting" && (
        <p role="status" className="rounded-xl bg-red-50 px-3 py-2 text-center text-lg font-semibold text-red-700" data-testid="mic-starting">
          {t("micStarting")}
        </p>
      )}
      {phase === "idle" && <p className="text-sm text-[#54656f]">{t("tapToTalk")}</p>}
      {interim && <p className="text-sm italic text-[#54656f]">{interim}</p>}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-center text-lg text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
