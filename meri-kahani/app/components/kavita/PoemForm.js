"use client";

// POEM form ("Masti Kavita"). The story form is separate: app/components/kahani/StoryForm.js
// This form runs in the browser so it can react when the button is clicked.
import { useRef, useState } from "react";
import VoicePlayer from "../shared/VoicePlayer";
import ShareButtons from "../shared/ShareButtons";
import { readTextStream } from "../shared/readTextStream";

// Same limits as the server checks in lib/safety.js
const NAME_MAX = 30;
const FIELD_MAX = 100;

const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const LANGUAGES = ["English", "Hindi", "Marathi"];
// Must match POEM_TOPICS in lib/poemPrompt.js
const TOPICS = [
  { value: "Animals", label: "🐘 Animals" },
  { value: "Rain", label: "🌧️ Rain" },
  { value: "Train", label: "🚂 Train" },
  { value: "Food", label: "🥭 Food" },
  { value: "Festivals", label: "🪔 Festivals" },
  { value: "Playing outside", label: "⚽ Playing outside" },
  { value: "Surprise me", label: "🎁 Surprise me" },
];

// Bright, playful styles (different from the night-sky story page)
const inputStyle =
  "w-full rounded-2xl border-2 border-orange-300 bg-amber-50 px-4 py-3 text-lg text-ink placeholder:text-amber-900/40 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/40";
const labelStyle = "mb-1 block text-lg font-semibold text-ink";

export default function PoemForm() {
  // "idle" | "waiting" (before the first words) | "writing" (words arriving) | "done"
  const [phase, setPhase] = useState("idle");
  const [poem, setPoem] = useState(""); // the finished poem
  const [language, setLanguage] = useState("English"); // language of the poem shown
  const [error, setError] = useState(""); // a friendly message if something fails
  const formRef = useRef(null);

  // "New Poem": clear the poem, keep the form filled in, and go back up to it
  function startNewPoem() {
    setPoem("");
    setError("");
    setPhase("idle");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the page from reloading
    const data = Object.fromEntries(new FormData(event.target));

    setPhase("waiting");
    setPoem("");
    setError("");
    setLanguage(data.language);

    try {
      // Send the details to our server, which asks the AI for a poem
      const response = await fetch("/api/kavita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Problems before writing starts (bad words, limit reached, AI busy) come as a message
        const result = await response.json().catch(() => ({}));
        setError(result.error || "Please try again in a little while.");
        setPhase("idle");
        return;
      }

      // Show the words on screen as they arrive
      const { status } = await readTextStream(response, (textSoFar) => {
        setPoem(textSoFar);
        setPhase("writing");
      });

      if (status === "OK") {
        setPhase("done");
      } else {
        // Failed the word check, or broke halfway: hide the text
        setPoem("");
        setPhase("idle");
        setError(
          status === "UNSAFE"
            ? "Sorry, we couldn't create a good poem this time. Please try again. 🎉"
            : "Sorry, something went wrong while writing. Please try again."
        );
      }
    } catch {
      setPoem("");
      setPhase("idle");
      setError("Please check your internet and try again.");
    }
  }

  // The first line is the title; the rest are verses (separated by blank lines)
  const [title, ...rest] = poem.split("\n");
  const verses = rest.join("\n").split(/\n\s*\n/).map((v) => v.trim()).filter(Boolean);
  const langCode = { English: "en", Hindi: "hi", Marathi: "mr" }[language];

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border-2 border-orange-300 bg-white/80 p-5 shadow-xl"
      >
        <div>
          <label htmlFor="childName" className={labelStyle}>
            Child&apos;s name
          </label>
          <input
            id="childName"
            name="childName"
            type="text"
            required
            maxLength={NAME_MAX}
            pattern="[\p{L}\p{M}]+( [\p{L}\p{M}]+)*"
            title="Letters only (no numbers or symbols)"
            placeholder="e.g. Aarav"
            className={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="age" className={labelStyle}>
            Age
          </label>
          <select id="age" name="age" defaultValue="5" className={inputStyle}>
            {AGES.map((age) => (
              <option key={age} value={age}>
                {age} years
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className={labelStyle}>Language</legend>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="cursor-pointer">
                <input
                  type="radio"
                  name="language"
                  value={lang}
                  defaultChecked={lang === "English"}
                  className="peer sr-only"
                />
                <span className="block rounded-2xl border-2 border-orange-300 bg-amber-50 py-3 text-center text-lg peer-checked:border-green-700 peer-checked:bg-green-700 peer-checked:font-bold peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-green-600">
                  {lang}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="family" className={labelStyle}>
            Family members or pet names{" "}
            <span className="font-normal text-ink/60">(optional)</span>
          </label>
          <input
            id="family"
            name="family"
            type="text"
            maxLength={FIELD_MAX}
            placeholder="e.g. Dadi, little sister Meera, dog Bruno"
            className={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="favourites" className={labelStyle}>
            Favourite things
          </label>
          <input
            id="favourites"
            name="favourites"
            type="text"
            maxLength={FIELD_MAX}
            placeholder="e.g. cricket, elephants, mango"
            className={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="topic" className={labelStyle}>
            What should the poem be about?
          </label>
          <select id="topic" name="topic" defaultValue="Animals" className={inputStyle}>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={phase === "waiting" || phase === "writing"}
          className="w-full rounded-full bg-orange-600 py-4 text-2xl font-bold text-white shadow-lg transition hover:bg-orange-700 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400 disabled:cursor-wait disabled:opacity-60"
        >
          {phase === "waiting" || phase === "writing" ? "Creating your poem..." : "🎉 Create Poem"}
        </button>
      </form>

      <div>
        {/* Before the first words arrive */}
        {phase === "waiting" && (
          <p className="mt-6 animate-pulse rounded-3xl bg-white/80 p-6 text-center text-2xl font-semibold text-orange-700">
            Creating your poem... 🎶
          </p>
        )}

        {/* If something went wrong (for example the free limit is reached) */}
        {error && (
          <p role="alert" className="mt-6 rounded-3xl border-2 border-orange-300 bg-white/80 p-6 text-center text-xl">
            {error}
          </p>
        )}

        {/* The finished poem, in big easy-to-read text, line by line */}
        {poem && (
          <article
            lang={langCode}
            aria-busy={phase === "writing"}
            className="mt-6 rounded-3xl border-2 border-orange-300 bg-white/85 p-6 shadow-xl"
          >
            <h2 className="mb-4 text-center text-3xl font-bold leading-snug text-orange-700">
              {title}
            </h2>
            <div className="space-y-6 text-center text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">
              {verses.map((verse, i) => (
                <p key={i} className="whitespace-pre-line">
                  {verse}
                </p>
              ))}
            </div>
            <p className="mt-6 text-center text-2xl" aria-hidden="true">
              🎈 🌈 🎶
            </p>

            {/* While words are still arriving: show progress; Listen waits until the end */}
            {phase === "writing" && (
              <>
                <p className="mt-6 animate-pulse text-center text-lg text-orange-700">✍️ Still writing...</p>
                <button
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-full py-4 text-2xl font-bold opacity-50 bg-green-700 text-white"
                >
                  ▶️ Listen (when the poem is finished)
                </button>
              </>
            )}

            {phase === "done" && (
              <>
                {/* Play the poem aloud (Normal speed) */}
                <VoicePlayer
                  key={poem}
                  text={poem}
                  language={language}
                  defaultSpeed="Normal"
                  noun="poem"
                />

                {/* Share on WhatsApp / copy the poem */}
                <ShareButtons title={title} paragraphs={verses} text={poem} noun="poem" />

                <button
                  onClick={startNewPoem}
                  className="mt-2 w-full rounded-full border-2 border-orange-600 py-4 text-2xl font-bold text-orange-700 transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400"
                >
                  ✨ New Poem
                </button>
              </>
            )}
          </article>
        )}
      </div>
    </>
  );
}
