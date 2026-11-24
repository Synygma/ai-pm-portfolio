import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { bubbleLines, dayLabel, unreadCount, visibleMessages } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { localTime } from "@/domain/time";
import { buildSeed } from "@/data/seed";
import type { ChatMessageRow } from "@/data/types";
import { makeToneWav, nextSpeed, waveformBars } from "@/lib/audio/tone";
import messages from "../../messages/en.json";

const NOW = new Date("2026-11-04T12:00:00Z");
const seed = buildSeed({ now: NOW });
const t = createTranslator({ locale: "en", messages, namespace: "bubbles" }) as unknown as (
  key: string,
  values?: Record<string, string | number>,
) => string;
const ctx = {
  companionName: "Vidya",
  parentPetName: "Maa",
  childPetName: "Gudiya",
  digests: new Map(seed.digests.map((d) => [d.id, d])),
  alerts: new Map(seed.alerts.map((a) => [a.id, a])),
  formatTime: (iso: string) => localTime(new Date(iso), "Europe/London"),
};
const render = (msg: ChatMessageRow) => bubbleLines(msg, ctx).map((l) => t(l.key, l.values));

describe("companion chat bubbles", () => {
  it("introduces the companion honestly as an AI, never as the child", () => {
    const text = render(seed.chatMessages.find((m) => m.kind === "setup")!).join(" ");
    expect(text).toContain("Hi Gudiya! I am Vidya, Maa’s ParCare AI companion.");
    expect(text).toContain("I am an AI voice, not a person.");
  });

  it("before the parent picks a companion, says so and still says it is an AI", () => {
    const msg = seed.chatMessages.find((m) => m.kind === "setup")!;
    const text = bubbleLines(msg, { ...ctx, companionName: null }).map((l) => t(l.key, l.values)).join(" ");
    expect(text).toBe("Hi Gudiya! Setup is done. Maa will choose their ParCare AI companion in their app. The companion is an AI voice, not a person.");
  });

  it("words a missed check-in factually, without the word 'emergency', and shows when it was switched off", () => {
    const lines = render(seed.chatMessages.find((m) => m.kind === "alert")!);
    expect(lines[0]).toBe("I checked in with Maa twice and did not hear back.");
    expect(lines[1]).toMatch(/^You switched off the alarm at \d\d:\d\d\.$/);
    expect(lines.join(" ").toLowerCase()).not.toContain("emergency");
  });

  it("summarises a digest with its count and pattern flags", () => {
    const flagged = seed.digests.find((d) => d.flags.length > 0)!;
    const msg = seed.chatMessages.find((m) => m.refId === flagged.id)!;
    expect(render(msg)).toEqual([
      `Daily digest for Maa: ${flagged.items.length} updates in their own words.`,
      "1 change from the usual pattern.",
    ]);
  });

  it("uses distinct wording for the emergency-word alarm", () => {
    const alert = { ...seed.alerts[0], id: "a2", kind: "emergency_word" as const, ackAt: null };
    const lines = bubbleLines(
      { ...seed.chatMessages[0], kind: "alert", refId: "a2" },
      { ...ctx, alerts: new Map([["a2", alert]]) },
    ).map((l) => t(l.key, l.values));
    expect(lines).toEqual(["Maa used an emergency word. The app asked them to contact local help.", "The alarm is still ringing."]);
  });
});

describe("chat list helpers", () => {
  it("labels days as Today / Yesterday / date in the child's time zone", () => {
    expect(dayLabel("2026-11-04T08:00:00Z", NOW, "Europe/London")).toEqual({ kind: "today", date: "2026-11-04" });
    expect(dayLabel("2026-11-03T23:30:00Z", NOW, "Europe/London")).toEqual({ kind: "yesterday", date: "2026-11-03" });
    expect(dayLabel("2026-11-01T10:00:00Z", NOW, "Europe/London").kind).toBe("date");
    // 23:30 UTC on the 3rd is already the 4th in India.
    expect(dayLabel("2026-11-03T23:30:00Z", NOW, "Asia/Kolkata").kind).toBe("today");
  });

  it("counts unread incoming messages (seed: the latest digest)", () => {
    expect(unreadCount(seed.chatMessages, NOW)).toBe(1);
  });

  it("hides messages from the demo-clock future", () => {
    const future = { ...seed.chatMessages[0], id: "f", createdAt: "2026-11-10T00:00:00Z", readAt: null };
    expect(visibleMessages([...seed.chatMessages, future], NOW).some((m) => m.id === "f")).toBe(false);
    expect(visibleMessages([future], new Date("2026-11-11T00:00:00Z"))).toHaveLength(1);
  });

  it("applies the demo clock offset", () => {
    expect(appNow({ demoClockOffsetMs: 3600000 }, NOW.getTime()).toISOString()).toBe("2026-11-04T13:00:00.000Z");
    expect(appNow(null, NOW.getTime()).toISOString()).toBe(NOW.toISOString());
  });
});

describe("voice note helpers", () => {
  it("builds a valid WAV for the sample tone", () => {
    const wav = makeToneWav(1, 8000);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe("WAVE");
    expect(wav.length).toBe(44 + 8000 * 2);
  });

  it("cycles playback speed 1× → 1.5× → 2× → 1×", () => {
    expect([nextSpeed(1), nextSpeed(1.5), nextSpeed(2)]).toEqual([1.5, 2, 1]);
  });

  it("draws a stable waveform per note", () => {
    expect(waveformBars("a")).toEqual(waveformBars("a"));
    expect(waveformBars("a")).not.toEqual(waveformBars("b"));
    for (const h of waveformBars("x")) expect(h >= 0.2 && h <= 1).toBe(true);
  });
});
