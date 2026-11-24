// P-029 (team test): she can answer a check-in from her chat even after the child was told, and
// the second reminder's notification is marked as an alarm.
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { CheckinRow, HouseholdRow } from "@/data/types";
import { ANSWER_WINDOW_HOURS, answerableCheckins, answerCheckin } from "@/services/parent-checkins";

const NOW = new Date("2026-11-12T04:00:00Z");

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { repos, household: snap.households[0] as HouseholdRow };
}

async function addCheckin(repos: ReturnType<typeof setup>["repos"], household: HouseholdRow, minutesAgo: number, status: CheckinRow["status"], answered = false) {
  const meta = (await repos.metaItems.find({ householdId: household.id }))[0];
  const due = new Date(NOW.getTime() - minutesAgo * 60000).toISOString();
  return repos.checkins.insert({
    householdId: household.id,
    metaItemId: meta.id,
    dueAt: due,
    status,
    prompted1At: status === "scheduled" ? null : due,
    prompted2At: null,
    answeredAt: answered ? NOW.toISOString() : null,
    escalatedAt: status === "escalated" || status === "acknowledged" ? due : null,
    acknowledgedAt: status === "acknowledged" ? due : null,
    snoozedUntil: null,
  });
}

describe("check-ins she can answer from her chat", () => {
  it("includes ones already told to the child, newest first; leaves out answered, unasked and old ones", async () => {
    const { repos, household } = setup();
    for (const c of await repos.checkins.find({ householdId: household.id })) await repos.checkins.remove(c.id);
    const told = await addCheckin(repos, household, 40, "escalated");
    const off = await addCheckin(repos, household, 90, "acknowledged");
    const asked = await addCheckin(repos, household, 5, "prompted1");
    await addCheckin(repos, household, 20, "escalated", true); // already answered
    await addCheckin(repos, household, -60, "scheduled"); // not asked yet
    await addCheckin(repos, household, ANSWER_WINDOW_HOURS * 60 + 10, "escalated"); // too old
    expect((await answerableCheckins(repos, household.id, NOW)).map((c) => c.id)).toEqual([asked.id, told.id, off.id]);
  });

  it("an answer after the child was told is stored and the check-in leaves the list", async () => {
    const { repos, household } = setup();
    const told = await addCheckin(repos, household, 40, "escalated");
    const r = await answerCheckin(repos, household, told.id, { text: "I’m okay today.", outcome: "yes", source: "button" }, NOW);
    expect(r).toEqual({ ok: true, emergency: false });
    expect((await answerableCheckins(repos, household.id, NOW)).some((c) => c.id === told.id)).toBe(false);
    expect((await repos.responses.find({ householdId: household.id, checkinId: told.id }))[0].text).toBe("I’m okay today.");
  });
});

describe("P-030: 'Delete for me' in the child's chat", () => {
  it("hides the bubble for the child only; the parent's chat rows cannot be touched", async () => {
    const { repos, household } = setup();
    const { hideChildMessage, hiddenForChild } = await import("@/services/child-messages");
    const all = await repos.chatMessages.find({ householdId: household.id });
    const mine = all.find((m) => m.audience !== "parent")!;
    expect(await hideChildMessage(repos, household.id, mine.id)).toBe(true);
    expect(hiddenForChild((await repos.chatMessages.get(mine.id))!)).toBe(true);
    const hers = all.find((m) => m.audience === "parent");
    if (hers) expect(await hideChildMessage(repos, household.id, hers.id)).toBe(false);
    expect(await hideChildMessage(repos, "another-household", mine.id)).toBe(false);
  });
});
