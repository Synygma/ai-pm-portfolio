// ============================================================
//  THE ONLY FILE THAT TALKS TO THE AI
//  To switch to another AI (for example Claude), change only this file.
//  It must keep exporting:
//    streamAI(systemPrompt, userPrompt, { maxTokens }) -> pieces of text, one by one
//  and throw an error with code "RATE_LIMIT" when the AI is busy or the free limit is reached
//  (only before the first piece of text arrives).
// ============================================================

import "server-only"; // safety: this file can never be sent to the browser
import { GoogleGenAI } from "@google/genai";

// Fastest first. Measured 2026-11-03: gemini-3.5-flash-lite with minimal thinking showed the
// first words in ~1 second and a full story in ~4 seconds. gemini-3.6-flash is the backup
// (its free tier allows only 20 requests per day).
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];

const REQUEST_OPTIONS = {
  maxRetries: 0, // don't keep retrying a busy model (that used to waste 40+ seconds); try the backup instead
  timeout: 30_000, // give up on a model after 30 seconds
};

export async function* streamAI(systemPrompt, userPrompt, { maxTokens = 4096 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY; // read from .env.local
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to .env.local and restart.");
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError;

  for (const model of MODELS) {
    let sentText = false;
    try {
      const stream = await ai.interactions.create(
        {
          model,
          system_instruction: systemPrompt,
          input: userPrompt,
          stream: true, // send text piece by piece, as it is written
          store: false, // privacy: ask Google not to keep the child's details
          generation_config: {
            thinking_level: "minimal", // no long "thinking" before writing = much faster
            max_output_tokens: maxTokens, // safety cap on length
          },
        },
        REQUEST_OPTIONS
      );

      for await (const event of stream) {
        if (event.event_type === "step.delta" && event.delta?.type === "text" && event.delta.text) {
          sentText = true;
          yield event.delta.text;
        }
        if (event.event_type === "error") {
          throw new Error(event.error?.message || "The AI stopped with an error.");
        }
      }

      if (!sentText) throw new Error("The AI returned an empty reply.");
      return; // finished
    } catch (error) {
      // If text was already sent, we can't switch models halfway through.
      if (sentText) throw error;
      lastError = error;
      if (!isBusyOrLimit(error)) throw error; // a real error: stop here
      // busy or limit reached: try the next model
    }
  }

  // Every model was busy or out of free limit
  const limitError = new Error(String(lastError?.message || "AI busy"));
  limitError.code = "RATE_LIMIT";
  throw limitError;
}

// 429 / RESOURCE_EXHAUSTED = free limit used up.
// 503 / UNAVAILABLE / "high demand" = Google's servers are busy for a while.
// Timeouts are treated the same way (try the backup model).
function isBusyOrLimit(error) {
  const status = error?.status ?? error?.statusCode;
  const message = String(error?.message || "");
  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    /\b(429|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|quota|rate limit|high demand|overloaded|timed? ?out|timeout/i.test(message)
  );
}
