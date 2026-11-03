"use client";

// STORY form ("Kahani"). The poem form is separate: app/components/kavita/PoemForm.js
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
const VALUES = [
  "Sharing",
  "Honesty",
  "Courage",
  "Kindness",
  "Being brave at night",
  "Listening to elders",
];

// Shared styles so every box looks the same
const inputStyle =
  "w-full rounded-2xl border border-white/20 bg-night/60 px-4 py-3 text-lg text-starlight placeholder:text-starlight/40 focus:border-moon focus:outline-none focus:ring-2 focus:ring-moon/50";
const labelStyle = "mb-1 block text-lg font-semibold text-starlight";

export default function StoryForm() {
  // "idle" | "waiting" (before the first words) | "writing" (words arriving) | "done"
  const [phase, setPhase] = useState("idle");
  const [story, setStory] = useState(""); // the finished story
  const [language, setLanguage] = useState("English"); // language of the story shown
  const [error, setError] = useState(""); // a friendly message if something fails
  const formRef = useRef(null);

  // "New Story": clear the story, keep the form filled in, and go back up to it
  function startNewStory() {
    setStory("");
    setError("");
    setPhase("idle");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(event) {
    event.preventDefault(); // stop the page from reloading
    const data = Object.fromEntries(new FormData(event.target));

    setPhase("waiting");
    setStory("");
    setError("");
    setLanguage(data.language);

    try {
      // Send the details to our server, which asks the AI for a story
      const response = await fetch("/api/story", {
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
        setStory(textSoFar);
        setPhase("writing");
      });

      if (status === "OK") {
        setPhase("done");
      } else {
        // Failed the word check, or broke halfway: hide the text
        setStory("");
        setPhase("idle");
        setError(
          status === "UNSAFE"
            ? "Sorry, we couldn't create a good story this time. Please try again. 🌙"
            : "Sorry, something went wrong while writing. Please try again."
        );
      }
    } catch {
      setStory("");
      setPhase("idle");
      setError("Please check your internet and try again.");
    }
  }

  // The first line of the story is the title; the rest are paragraphs
  const [title, ...rest] = story.split("\n");
  const paragraphs = rest.join("\n").split(/\n\s*\n/).filter((p) => p.trim());
  const langCode = { English: "en", Hindi: "hi", Marathi: "mr" }[language];

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-3xl border border-white/10 bg-dusk/70 p-5 shadow-xl backdrop-blur"
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
                <span className="block rounded-2xl border border-white/20 bg-night/60 py-3 text-center text-lg peer-checked:border-moon peer-checked:bg-moon peer-checked:font-bold peer-checked:text-night peer-focus-visible:ring-2 peer-focus-visible:ring-moon">
                  {lang}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="family" className={labelStyle}>
            Family members or pet names{" "}
            <span className="font-normal text-starlight/60">(optional)</span>
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
          <label htmlFor="value" className={labelStyle}>
            Value to teach
          </label>
          <select id="value" name="value" defaultValue={VALUES[0]} className={inputStyle}>
            {VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={phase === "waiting" || phase === "writing"}
          className="w-full rounded-full bg-moon py-4 text-2xl font-bold text-night shadow-lg transition hover:brightness-105 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-moon/50 disabled:cursor-wait disabled:opacity-60"
        >
          {phase === "waiting" || phase === "writing" ? "Creating your story..." : "🌙 Create Story"}
        </button>
      </form>

      <div>
        {/* Before the first words arrive */}
        {phase === "waiting" && (
          <p className="mt-6 animate-pulse rounded-3xl bg-dusk/70 p-6 text-center text-2xl text-moon">
            Creating your story... 🌙
          </p>
        )}

        {/* If something went wrong (for example the free limit is reached) */}
        {error && (
          <p role="alert" className="mt-6 rounded-3xl border border-moon/30 bg-dusk/70 p-6 text-center text-xl">
            {error}
          </p>
        )}

        {/* The finished story, in big easy-to-read text */}
        {story && (
          <article
            lang={langCode}
            aria-busy={phase === "writing"}
            className="mt-6 rounded-3xl border border-moon/30 bg-dusk/70 p-6 shadow-xl"
          >
            <h2 className="mb-4 text-center text-3xl font-bold leading-snug text-moon">
              {title}
            </h2>
            <div className="space-y-5 text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="mt-6 text-center text-2xl" aria-hidden="true">
              🌙 ✨ 💤
            </p>

            {/* While words are still arriving: show progress; Listen waits until the end */}
            {phase === "writing" && (
              <>
                <p className="mt-6 animate-pulse text-center text-lg text-moon">✍️ Still writing...</p>
                <button
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-full py-4 text-2xl font-bold opacity-50 bg-moon text-night"
                >
                  ▶️ Listen (when the story is finished)
                </button>
              </>
            )}

            {phase === "done" && (
              <>
                {/* Play the story aloud */}
                <VoicePlayer
                  key={story}
                  text={story}
                  language={language}
                  defaultSpeed="Slow"
                  noun="story"
                />

                {/* Share on WhatsApp / copy the story */}
                <ShareButtons title={title} paragraphs={paragraphs} text={story} noun="story" />

                <button
                  onClick={startNewStory}
                  className="mt-2 w-full rounded-full border-2 border-moon py-4 text-2xl font-bold text-moon transition active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-moon/50"
                >
                  ✨ New Story
                </button>
              </>
            )}
          </article>
        )}
      </div>
    </>
  );
}
