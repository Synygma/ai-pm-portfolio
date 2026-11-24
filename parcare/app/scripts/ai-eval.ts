// Runs the meta-list evaluation set (tests/fixtures/ai-eval.json, fictional only) through the
// configured AI provider and prints precision / recall.   npm run ai:eval
// With GEMINI_API_KEY in .env.local it uses Gemini (6 small requests, free tier); otherwise the mock.

import { existsSync } from "node:fs";
import { type Expected, scoreCase, totals } from "../src/ai/eval";
import { GeminiProvider } from "../src/ai/gemini";
import { MockProvider } from "../src/ai/mock";
import type { AiProvider } from "../src/ai/types";
import data from "../tests/fixtures/ai-eval.json";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const key = process.env.GEMINI_API_KEY?.trim();
const provider: AiProvider = key ? new GeminiProvider(key, process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash") : new MockProvider();

async function main() {
  console.log(`Provider: ${provider.name}${key ? ` (${process.env.GEMINI_MODEL || "gemini-2.5-flash"})` : ""}\n`);
  const scores = [];
  for (const c of data.cases) {
    const started = Date.now();
    const items = await provider.extractMetaList(c.transcript, { parentPetName: c.parentPetName });
    const score = scoreCase(items, c.expected as Expected[]);
    scores.push(score);
    console.log(`${c.id}: TP ${score.truePositives}  FP ${score.falsePositives}  FN ${score.falseNegatives}  (${Date.now() - started} ms)`);
    for (const i of items) console.log(`    ${i.localTime ?? "--:--"}  ${i.checkinType.padEnd(18)} ${i.label}`);
  }
  const t = totals(scores);
  console.log(`\nPrecision ${(t.precision * 100).toFixed(0)}%   Recall ${(t.recall * 100).toFixed(0)}%   (TP ${t.tp}, FP ${t.fp}, FN ${t.fn})`);
}

main().catch((err) => {
  console.error("Evaluation failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
