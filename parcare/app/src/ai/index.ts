import "server-only";
import { GeminiProvider } from "./gemini";
import { MockProvider } from "./mock";
import type { AiProvider, AnswerOutcome, MetaListContext, MetaSuggestion } from "./types";

export type { AiProvider, AnswerOutcome, MetaSuggestion } from "./types";

/** Gemini when GEMINI_API_KEY is set, otherwise the deterministic mock. */
export function getAiProvider(): AiProvider {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return new MockProvider();
  return new GeminiProvider(key, process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash");
}

export function aiMode(): AiProvider["name"] {
  return process.env.GEMINI_API_KEY?.trim() ? "gemini" : "mock";
}

/** Her answer read as done / not done / unclear, with the same safe fallback to the mock. */
export async function classifyAnswerSafely(question: string, answer: string): Promise<AnswerOutcome> {
  const provider = getAiProvider();
  try {
    return await provider.classifyAnswer(question, answer);
  } catch (err) {
    console.warn(`AI provider ${provider.name} failed (${err instanceof Error ? err.name : "unknown"}); using mock.`);
    return new MockProvider().classifyAnswer(question, answer);
  }
}

/** Meta list with a safe fallback: if Gemini fails (quota, network, bad JSON) use the mock. */
export async function extractMetaListSafely(
  transcript: string,
  context: MetaListContext,
): Promise<{ items: MetaSuggestion[]; provider: AiProvider["name"]; fellBack: boolean }> {
  const provider = getAiProvider();
  try {
    return { items: await provider.extractMetaList(transcript, context), provider: provider.name, fellBack: false };
  } catch (err) {
    // Log only the error type, never the transcript (G14: no personal/health data in logs).
    console.warn(`AI provider ${provider.name} failed (${err instanceof Error ? err.name : "unknown"}); using mock.`);
    return { items: await new MockProvider().extractMetaList(transcript), provider: "mock", fellBack: true };
  }
}
