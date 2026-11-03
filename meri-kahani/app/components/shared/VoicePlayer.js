"use client";

// Reads a story or poem aloud using the browser's built-in voice (Web Speech API). Free, no key needed.
import { useEffect, useMemo, useRef, useState } from "react";

const LANG_CODES = { English: "en-IN", Hindi: "hi-IN", Marathi: "mr-IN" };
const SPEEDS = { Slow: 0.8, Normal: 1 };
const MAX_CHUNK = 180; // characters per piece; short pieces stop mobile Chrome from cutting off

// Split the story into small pieces. The title and each paragraph are read
// separately (so there is a natural pause between them), and long paragraphs
// are cut at sentence ends (. ! ? and the Hindi/Marathi "।").
function splitIntoChunks(text) {
  return text
    .split(/\n+/)
    .filter((line) => line.trim())
    .flatMap(splitParagraph);
}

function splitParagraph(text) {
  const sentences = text.replace(/\s+/g, " ").match(/[^.!?।]+[.!?।]*\s*/g) || [];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHUNK && current) {
      chunks.push(current.trim());
      current = "";
    }
    // A very long sentence: cut it at commas or spaces
    if (sentence.length > MAX_CHUNK) {
      for (const part of sentence.match(new RegExp(`.{1,${MAX_CHUNK}}(\\s|,|$)`, "g")) || []) {
        if (part.trim()) chunks.push(part.trim());
      }
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Some phones write "hi_IN" instead of "hi-IN", so we tidy it up before comparing.
const norm = (lang) => String(lang || "").replace("_", "-").toLowerCase();

// Find the best voice: exact match (e.g. hi-IN), else same language (e.g. any "hi").
function findVoice(voices, code) {
  const target = norm(code);
  const base = target.split("-")[0];
  return (
    voices.find((v) => norm(v.lang) === target) ||
    voices.find((v) => norm(v.lang).split("-")[0] === base) ||
    null
  );
}


// Used by both the Kahani and Kavita pages.
//   defaultSpeed: "Slow" for bedtime stories, "Normal" for poems
//   noun: "story" or "poem" (shown while playing)
// The form gives this player a new "key" for every story/poem, so each one starts fresh.
export default function VoicePlayer({ text, language, defaultSpeed = "Slow", noun = "story" }) {
  // This player only appears after a story/poem is made in the browser, so "window" exists here.
  const [supported] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window
  );
  const [voices, setVoices] = useState([]);
  const [status, setStatus] = useState("stopped"); // "playing" | "paused" | "stopped"
  const [speed, setSpeed] = useState(defaultSpeed);

  const chunks = useMemo(() => splitIntoChunks(text), [text]);
  const indexRef = useRef(0); // which piece we are on (so Pause can continue from here)
  const runRef = useRef(0); // changes on every Stop/Pause, so old pieces don't keep going
  const utteranceRef = useRef(null); // keep a reference so Chrome doesn't forget it mid-speech
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Load the list of voices on this device (Chrome loads them a moment after the page)
  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    const firstLoad = setTimeout(load, 0);
    synth.addEventListener("voiceschanged", load);
    return () => {
      clearTimeout(firstLoad);
      synth.removeEventListener("voiceschanged", load);
      // Stop talking if the story disappears or a new story replaces it.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- runRef is a counter, not a page element
      runRef.current++;
      synth.cancel();
    };
  }, [supported]);

  // Choose the voice for the story language
  const wantedCode = LANG_CODES[language] || "en-IN";
  let voice = findVoice(voices, wantedCode);
  let usingHindiForMarathi = false;
  if (!voice && language === "Marathi") {
    voice = findVoice(voices, "hi-IN");
    usingHindiForMarathi = true;
  }
  const voiceLang = voice ? voice.lang.replace("_", "-") : wantedCode;
  const noVoiceAtAll = voices.length > 0 && !voice;

  function speakFrom(index, run) {
    const synth = window.speechSynthesis;
    if (run !== runRef.current) return; // Stop or Pause was pressed
    if (index >= chunks.length) {
      indexRef.current = 0;
      setStatus("stopped"); // finished the whole story
      return;
    }
    indexRef.current = index;

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = voiceLang;
    if (voice) utterance.voice = voice;
    utterance.rate = SPEEDS[speedRef.current]; // speed change applies from the next piece
    utterance.onend = () => speakFrom(index + 1, run);
    utterance.onerror = (event) => {
      if (event.error === "interrupted" || event.error === "canceled") return;
      speakFrom(index + 1, run); // skip a piece that failed, keep going
    };
    utteranceRef.current = utterance;
    synth.speak(utterance);
  }

  function play() {
    const synth = window.speechSynthesis;
    synth.cancel();
    const run = ++runRef.current;
    setStatus("playing");
    // A tiny wait helps Chrome after cancel(), otherwise the first piece is sometimes skipped
    setTimeout(() => speakFrom(indexRef.current, run), 100);
  }

  // Pause = stop now but remember where we were. (Chrome on Android
  // does not support real pause, so this works the same everywhere.)
  function pause() {
    runRef.current++;
    window.speechSynthesis.cancel();
    setStatus("paused");
  }

  function stop() {
    runRef.current++;
    window.speechSynthesis.cancel();
    indexRef.current = 0;
    setStatus("stopped");
  }


  if (!supported) {
    return (
      <p className="mt-6 text-center text-ink/70">
        Sorry, this browser cannot read aloud. Please try Google Chrome.
      </p>
    );
  }

  const bigButton =
    "rounded-full py-4 text-2xl font-bold shadow-lg transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50";
  const smallButton =
    "flex-1 rounded-full border border-line bg-field/60 py-3 text-xl font-semibold text-ink disabled:opacity-40";

  return (
    <div className="mt-6 space-y-3 border-t border-line pt-6">
      {status !== "playing" ? (
        <button onClick={play} className={`${bigButton} w-full bg-accent text-on-accent`}>
          ▶️ {status === "paused" ? "Continue Listening" : "Listen"}
        </button>
      ) : (
        <p className={`${bigButton} w-full animate-pulse border border-accent bg-field/60 text-center text-ink`}>
          🔊 Playing your {noun}...
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={pause} disabled={status !== "playing"} className={smallButton}>
          ⏸️ Pause
        </button>
        <button onClick={stop} disabled={status === "stopped"} className={smallButton}>
          ⏹️ Stop
        </button>
      </div>

      <fieldset className="flex items-center justify-center gap-2">
        <legend className="sr-only">Speed</legend>
        <span className="text-lg text-ink/70">Speed:</span>
        {Object.keys(SPEEDS).map((name) => (
          <label key={name} className="cursor-pointer">
            <input
              type="radio"
              name="speed"
              value={name}
              checked={speed === name}
              onChange={() => setSpeed(name)}
              className="peer sr-only"
            />
            <span className="block rounded-full border border-line px-5 py-2 text-lg text-ink peer-checked:border-accent peer-checked:bg-accent peer-checked:font-bold peer-checked:text-on-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
              {name}
            </span>
          </label>
        ))}
      </fieldset>

      {usingHindiForMarathi && voice && (
        <p className="text-center text-sm text-ink/70">
          This device has no Marathi voice, so we are using the Hindi voice.
        </p>
      )}
      {noVoiceAtAll && (
        <p className="text-center text-sm text-ink/70">
          No {language} voice was found on this device. You can download one in your
          phone&apos;s Settings, under &quot;Text-to-speech&quot;.
        </p>
      )}
    </div>
  );
}
