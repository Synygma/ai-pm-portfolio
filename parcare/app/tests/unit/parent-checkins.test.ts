// Parent app P3: live check-ins (prompts reach her, answers, snooze, emergency stop).
import { describe, expect, it } from "vitest";
import { mockClassify } from "@/ai/mock";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { CheckinRow, HouseholdRow } from "@/data/types";
import { planTick } from "@/domain/engine";
import { parentMessages } from "@/domain/parent-chat";
import { addMinutes } from "@/domain/time";
import { tickHousehold } from "@/services/checkins";
import { answerCheckin, openCheckin, SNOOZE_CHECKIN_MINUTES, snoozeCheckin } from "@/services/parent-checkins";
import data from "../fixtures/answer-eval.json";

const NOW = new Date("2026-11-08T10:00:00Z");

function seeded() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { snap, repos, household: snap.households[0] as HouseholdRow };
}

/** Moves the household's clock to the next check-in's due time and runs the tick (prompt 1). */
async function promptNext(repos: ReturnType<typeof seeded>["repos"], household: HouseholdRow) {
  await tickHousehold(repos, household, NOW);
  const next = (await repos.checkins.find({ householdId: household.id }, { orderBy: "dueAt" })).find((c) => c.status === "scheduled")!;
  const at = new Date(next.dueAt);
  await tickHousehold(repos, household, at);
  return { checkin: (await repos.checkins.get(next.id))!, at };
}

describe("prompts reach the parent", () => {
  it("prompt 1 and prompt 2 appear in her chat (prompt 2 marked as asking again)", async () => {
    const { repos, household } = seeded();
    const { checkin, at } = await promptNext(repos, household);
    expect(checkin.status).toBe("prompted1");
    const mine = () => repos.chatMessages.find({ householdId: household.id, refId: checkin.id });
    expect((await mine()).map((m) => [m.audience, m.kind, m.data.second ?? false])).toEqual([["parent", "checkin", false]]);
    await tickHousehold(repos, household, addMinutes(at, household.gapAMinutes));
    expect((await repos.checkins.get(checkin.id))!.status).toBe("prompted2");
    expect((await mine()).filter((m) => m.data.second)).toHaveLength(1);
    expect((await openCheckin(repos, household.id))?.id).toBe(checkin.id);
  });
});

describe("her answers", () => {
  it("are stored exactly, close the check-in, and the companion thanks her", async () => {
    const { repos, household } = seeded();
    const { checkin, at } = await promptNext(repos, household);
    const words = "Up early today, the birds woke me.";
    expect(await answerCheckin(repos, household, checkin.id, { text: words, outcome: "yes", source: "voice" }, at)).toEqual({ ok: true, emergency: false });
    const c = (await repos.checkins.get(checkin.id))!;
    expect(c.status).toBe("answered");
    const r = (await repos.responses.find({ checkinId: checkin.id }))[0];
    expect(r).toMatchObject({ text: words, outcome: "yes", source: "voice" });
    const chat = parentMessages(await repos.chatMessages.find({ householdId: household.id, createdAt: at.toISOString() }));
    expect(chat.map((m) => m.kind).sort()).toEqual(["answer", "checkin", "checkin"]); // prompt, her words, thanks
    // Answered = no escalation later.
    await tickHousehold(repos, household, addMinutes(at, 120));
    expect((await repos.checkins.get(checkin.id))!.status).toBe("answered");
    // Once only.
    expect(await answerCheckin(repos, household, checkin.id, { text: "again", outcome: null, source: "typed" }, at)).toEqual({ ok: false, reason: "closed" });
  });

  it("an emergency word stops everything: the child's distinct alarm + PAUSE in her chat (G5)", async () => {
    const { repos, household } = seeded();
    const { checkin, at } = await promptNext(repos, household);
    const r = await answerCheckin(repos, household, checkin.id, { text: "Help me, I fell in the bathroom", outcome: "unclear", source: "voice" }, at);
    expect(r).toEqual({ ok: true, emergency: true });
    const alerts = await repos.alerts.find({ householdId: household.id, kind: "emergency_word", ackAt: null });
    expect(alerts).toHaveLength(1);
    const paused = parentMessages(await repos.chatMessages.find({ householdId: household.id })).filter((m) => m.data.paused);
    expect(paused).toHaveLength(1);
  });

  it("refuses another family's check-in and empty words", async () => {
    const { repos, household } = seeded();
    const { checkin, at } = await promptNext(repos, household);
    expect(await answerCheckin(repos, { ...household, id: "other" }, checkin.id, { text: "yes", outcome: "yes", source: "button" }, at)).toEqual({ ok: false, reason: "notFound" });
    expect(await answerCheckin(repos, household, checkin.id, { text: "  ", outcome: null, source: "typed" }, at)).toEqual({ ok: false, reason: "empty" });
  });
});

describe("snooze (F3)", () => {
  it("counts as a reply; she is asked again at the snooze time and the chain starts afresh", async () => {
    const { repos, household } = seeded();
    const { checkin, at } = await promptNext(repos, household);
    const s = await snoozeCheckin(repos, household, checkin.id, at);
    expect(s).toEqual({ ok: true, until: addMinutes(at, SNOOZE_CHECKIN_MINUTES).toISOString() });
    // No prompt 2 or alarm during the snooze, even after gap A + gap B.
    await tickHousehold(repos, household, addMinutes(at, SNOOZE_CHECKIN_MINUTES - 1));
    expect((await repos.checkins.get(checkin.id))!.status).toBe("snoozed");
    // At the snooze time: prompt 1 again, then the usual chain.
    const back = addMinutes(at, SNOOZE_CHECKIN_MINUTES);
    await tickHousehold(repos, household, back);
    const c = (await repos.checkins.get(checkin.id))!;
    expect(c).toMatchObject({ status: "prompted1", prompted1At: back.toISOString(), snoozedUntil: null });
    await tickHousehold(repos, household, addMinutes(back, household.gapAMinutes));
    await tickHousehold(repos, household, addMinutes(back, household.gapAMinutes + household.gapBMinutes));
    expect((await repos.checkins.get(checkin.id))!.status).toBe("escalated");
  });

  it("a snooze that ended while the app was not running lapses (no false 'asked twice')", () => {
    const c: CheckinRow = {
      id: "k", householdId: "h", metaItemId: "m", dueAt: NOW.toISOString(), status: "snoozed", prompted1At: NOW.toISOString(), prompted2At: null,
      answeredAt: null, escalatedAt: null, acknowledgedAt: null, snoozedUntil: addMinutes(NOW, 30).toISOString(),
    };
    const consent = { id: "c", householdId: "h", metaItemId: "m", grantedAt: "2026-01-01T00:00:00Z", revokedAt: null, shareInDigest: true };
    const meta = { id: "m", householdId: "h", parentId: "p", label: "x", checkinType: "medicine" as const, localTime: null, onDate: null, source: "parent" as const, createdAt: "2026-01-01T00:00:00Z" };
    const plan = (at: Date) => planTick({ now: at, household: { gapAMinutes: 10, gapBMinutes: 20, setupCompletedAt: "2026-01-01T00:00:00Z" }, parentTimeZone: "Asia/Kolkata", metaItems: [meta], consents: [consent], checkins: [c], alerts: [] });
    expect(plan(addMinutes(NOW, 35))).toEqual([{ type: "prompt1", id: "k", at: addMinutes(NOW, 35).toISOString() }]);
    expect(plan(addMinutes(NOW, 45))).toEqual([{ type: "lapse", id: "k" }]);
  });
});

describe("reading her words (mock answer reader)", () => {
  it.each(data.cases)("$answer → $expected", ({ answer, expected }) => {
    expect(mockClassify(answer)).toBe(expected);
  });
});
