import { GoogleGenAI } from "@google/genai";
import { CHECKIN_TYPES } from "@/data/types";
import { ANSWER_OUTCOMES, type AiProvider, type AnswerOutcome, MAX_META_ITEMS, type MetaListContext, type MetaSuggestion, sanitizeMetaList } from "./types";

// Google Gemini (free tier) via @google/genai. The free tier may use inputs to improve Google's
// products, so ONLY fictional data may be sent (the setup screen says so when Gemini is on).

const SYSTEM_INSTRUCTION = `You turn an adult child's description of their ageing parent's daily routine into a short checklist of things a friendly companion app could check in about.
Rules:
- Use only these check-in types: ${CHECKIN_TYPES.join(", ")}.
- localTime is the parent's local time as 24-hour "HH:MM". Use the time mentioned; if only a part of day is given (morning, evening, night) pick a typical time; if nothing is said and nothing is typical, use null.
- One item per distinct event. A medicine taken twice a day is two items.
- label: short, plain English, at most 6 words, e.g. "BP medicine (morning)", "Morning walk", "Evening puja".
- Never diagnose, never add medical advice, never invent events that are not in the text.
- At most ${MAX_META_ITEMS} items.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      maxItems: MAX_META_ITEMS,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          checkinType: { type: "string", enum: [...CHECKIN_TYPES] },
          localTime: { type: ["string", "null"], description: 'Parent-local 24-hour "HH:MM", or null' },
        },
        required: ["label", "checkinType", "localTime"],
      },
    },
  },
  required: ["items"],
};

export class GeminiProvider implements AiProvider {
  readonly name = "gemini" as const;
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async extractMetaList(transcript: string, context: MetaListContext): Promise<MetaSuggestion[]> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: `The child calls the parent "${context.parentPetName || "my parent"}".\nDescription of the parent's day:\n"""${transcript.slice(0, 4000)}"""`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        temperature: 0,
      },
    });
    const text = response.text ?? "";
    return sanitizeMetaList(JSON.parse(text));
  }

  async classifyAnswer(question: string, answer: string): Promise<AnswerOutcome> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: `Companion's question: """${question.slice(0, 300)}"""
The older person's answer: """${answer.slice(0, 1000)}"""`,
      config: {
        systemInstruction:
          'A friendly companion app asked an older person about one daily activity. Decide from their answer whether the activity happened. "yes" = it happened or they are doing it; "no" = it did not happen or not yet; "unclear" = the answer does not say. Never diagnose; judge only whether the activity happened.',
        responseMimeType: "application/json",
        responseJsonSchema: { type: "object", properties: { outcome: { type: "string", enum: [...ANSWER_OUTCOMES] } }, required: ["outcome"] },
        temperature: 0,
      },
    });
    const outcome = (JSON.parse(response.text ?? "{}") as { outcome?: string }).outcome;
    return (ANSWER_OUTCOMES as readonly string[]).includes(outcome ?? "") ? (outcome as AnswerOutcome) : "unclear";
  }
}
