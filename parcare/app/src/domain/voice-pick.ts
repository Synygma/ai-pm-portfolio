// Reading aloud with a voice that matches the companion's picture (P-028): a male voice for the
// male companions, a female voice for Vidya. Browsers do not say which voices are male or female,
// so we go by the voice's name; if no voice matches, the pitch is nudged instead.

import type { VoiceGender } from "@/config/brand";

export type VoiceLike = { name: string; lang: string };

const HINTS: Record<VoiceGender, string[]> = {
  female: [
    "female", "woman", "heera", "neerja", "swara", "kalpana", "veena", "lekha", "aditi", "raveena", "zira", "samantha", "victoria",
    "karen", "moira", "tessa", "fiona", "susan", "hazel", "libby", "sonia", "aria", "jenny", "emma", "catherine", "serena", "allison", "ava",
  ],
  male: ["male", "man", "ravi", "prabhat", "hemant", "rishi", "madhur", "david", "mark", "george", "james", "daniel", "alex", "fred", "guy", "ryan", "thomas", "rishi", "aaron"],
};

/** Does the voice's name say it is this gender? (Whole words, so "female" never counts as "male".) */
export function voiceIs(v: VoiceLike, gender: VoiceGender): boolean {
  const words = v.name.toLowerCase().split(/[^a-z]+/);
  return HINTS[gender].some((h) => words.includes(h));
}

/** The voice to use and a pitch: Indian English first, then any English. */
export function pickVoice<V extends VoiceLike>(voices: V[], gender: VoiceGender | null): { voice: V | null; pitch: number } {
  const en = voices.filter((v) => v.lang.replace("_", "-").startsWith("en"));
  const india = en.filter((v) => v.lang.replace("_", "-") === "en-IN");
  if (gender) {
    const other: VoiceGender = gender === "male" ? "female" : "male";
    const fits = (v: V) => voiceIs(v, gender) && !voiceIs(v, other);
    const match = india.find(fits) ?? en.find(fits);
    if (match) return { voice: match, pitch: 1 };
    // No named match: avoid a voice of the other gender, and nudge the pitch.
    const neutral = india.find((v) => !voiceIs(v, other)) ?? en.find((v) => !voiceIs(v, other)) ?? india[0] ?? en[0] ?? null;
    return { voice: neutral, pitch: gender === "male" ? 0.8 : 1.15 };
  }
  return { voice: india[0] ?? en[0] ?? null, pitch: 1 };
}
