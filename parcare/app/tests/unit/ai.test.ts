import { describe, expect, it } from "vitest";
import { type Expected, scoreCase, totals } from "@/ai/eval";
import { findTimes, MockProvider, mockExtract } from "@/ai/mock";
import { sanitizeMetaList } from "@/ai/types";
import data from "../fixtures/ai-eval.json";

describe("meta-list parsing with the Mock AI provider", () => {
  it("scores 100% on the evaluation set (docs/AI_EVAL.md)", async () => {
    const provider = new MockProvider();
    const scores = [];
    for (const c of data.cases) {
      const items = await provider.extractMetaList(c.transcript);
      const score = scoreCase(items, c.expected as Expected[]);
      expect(score, c.id).toEqual({ truePositives: c.expected.length, falsePositives: 0, falseNegatives: 0 });
      scores.push(score);
    }
    expect(totals(scores)).toMatchObject({ precision: 1, recall: 1 });
  });

  it("splits a twice-daily medicine into two items with readable labels", () => {
    const items = mockExtract("She takes her BP tablet at 8:30 and 8:30 pm.");
    expect(items).toEqual([
      { label: "BP medicine (morning)", checkinType: "medicine", localTime: "08:30" },
      { label: "BP medicine (evening)", checkinType: "medicine", localTime: "20:30" },
    ]);
  });

  it("is deterministic", () => {
    const text = data.cases[0].transcript;
    expect(mockExtract(text)).toEqual(mockExtract(text));
  });

  it("does not read ages or counts as times", () => {
    expect(findTimes("she is 78 and walks 2 rounds")).toEqual([]);
    expect(findTimes("at 7")).toEqual(["07:00"]);
    expect(findTimes("around 7 in the evening")).toEqual(["19:00"]);
    expect(findTimes("by 12 am")).toEqual(["00:00"]);
  });
});

describe("AI output is checked before use", () => {
  it("drops unknown types, bad times, empty labels and duplicates; caps the list", () => {
    const raw = {
      items: [
        { label: "Morning walk", checkinType: "physical_activity", localTime: "06:30" },
        { label: "Morning walk", checkinType: "physical_activity", localTime: "06:30" },
        { label: "Diagnose mood", checkinType: "mood_score", localTime: "10:00" },
        { label: "Tea", checkinType: "social", localTime: "25:99" },
        { label: "   ", checkinType: "puja", localTime: "18:30" },
        { label: "x".repeat(200), checkinType: "puja", localTime: null },
      ],
    };
    const out = sanitizeMetaList(raw);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual({ label: "Morning walk", checkinType: "physical_activity", localTime: "06:30" });
    expect(out.find((i) => i.label === "Tea")?.localTime).toBeNull();
    expect(out.every((i) => i.label.length <= 80)).toBe(true);
    expect(sanitizeMetaList(Array.from({ length: 30 }, (_, n) => ({ label: `Item ${n}`, checkinType: "social", localTime: null })))).toHaveLength(15);
    expect(sanitizeMetaList("not json")).toEqual([]);
  });
});
