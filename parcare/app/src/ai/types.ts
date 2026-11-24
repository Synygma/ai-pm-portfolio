// AI provider interface. Implementations: MockProvider (deterministic, tests and no key) and
// GeminiProvider (Google Gemini free tier). Only fictional data may be sent to Gemini.

import { CHECKIN_TYPES, type CheckinType } from "@/data/types";

/** One suggested must-check item for the parent's day ("meta list", setup step e). */
export type MetaSuggestion = {
  label: string;
  checkinType: CheckinType;
  /** Parent-local "HH:MM", or null when no time was mentioned and none is typical. */
  localTime: string | null;
};

export type MetaListContext = {
  /** What the child calls the parent, e.g. "Maa" (helps the model read the text). */
  parentPetName: string;
};

/** Did the thing happen, going by the parent's own words? (parent app, check-in answers) */
export type AnswerOutcome = "yes" | "no" | "unclear";
export const ANSWER_OUTCOMES: readonly AnswerOutcome[] = ["yes", "no", "unclear"];

export interface AiProvider {
  readonly name: "mock" | "gemini";
  extractMetaList(transcript: string, context: MetaListContext): Promise<MetaSuggestion[]>;
  /** Reads her answer to a check-in question: done, not done, or not clear. */
  classifyAnswer(question: string, answer: string): Promise<AnswerOutcome>;
}

export const MAX_META_ITEMS = 15;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Checks and cleans an AI answer: known check-in types only, valid times, short labels, no
 * duplicates, at most MAX_META_ITEMS, sorted by time. Anything else is dropped.
 */
export function sanitizeMetaList(raw: unknown): MetaSuggestion[] {
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as { items?: unknown })?.items) ? (raw as { items: unknown[] }).items : [];
  const seen = new Set<string>();
  const out: MetaSuggestion[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const label = typeof e.label === "string" ? e.label.trim().replace(/\s+/g, " ").slice(0, 80) : "";
    const checkinType = e.checkinType as CheckinType;
    const time = typeof e.localTime === "string" && TIME_RE.test(e.localTime) ? e.localTime : null;
    if (!label || !(CHECKIN_TYPES as readonly string[]).includes(checkinType)) continue;
    const key = `${checkinType}|${time ?? ""}|${label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, checkinType, localTime: time });
    if (out.length >= MAX_META_ITEMS) break;
  }
  return out.sort((a, b) => (a.localTime ?? "99:99").localeCompare(b.localTime ?? "99:99"));
}
