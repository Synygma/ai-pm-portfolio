// The scheduler can run twice at the same moment (the every-minute timer plus open apps in demo
// mode). Found on the live site: two runs both sent Maa the second reminder. Each step must be
// done by exactly one run.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { HouseholdRow } from "@/data/types";
import { parentMessages } from "@/domain/parent-chat";
import { addMinutes } from "@/domain/time";
import { tickHousehold } from "@/services/checkins";
import { answerCheckin } from "@/services/parent-checkins";

const NOW = new Date("2026-11-10T10:00:00Z");

function setup() {
  const snap = buildSeed({ now: NOW });
  return { repos: createMemoryRepos(new MemoryStore(snap)), household: snap.households[0] as HouseholdRow };
}

describe("two scheduler runs at the same moment", () => {
  it("create each check-in once and prompt it once, at every step", async () => {
    const { repos, household } = setup();
    await Promise.all([tickHousehold(repos, household, NOW), tickHousehold(repos, household, NOW)]);
    const all = await repos.checkins.find({ householdId: household.id });
    const keys = all.map((c) => `${c.metaItemId}|${c.dueAt}`);
    expect(new Set(keys).size).toBe(keys.length);

    const next = all.filter((c) => c.status === "scheduled").sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
    const at = new Date(next.dueAt);
    for (const t of [at, addMinutes(at, household.gapAMinutes), addMinutes(at, household.gapAMinutes + household.gapBMinutes)]) {
      await Promise.all([tickHousehold(repos, household, t), tickHousehold(repos, household, t)]);
    }
    const prompts = parentMessages(await repos.chatMessages.find({ householdId: household.id, refId: next.id }));
    expect(prompts.filter((m) => !m.data.second)).toHaveLength(1);
    expect(prompts.filter((m) => m.data.second)).toHaveLength(1);
    expect(await repos.alerts.find({ householdId: household.id, checkinId: next.id, kind: "missed_checkin" })).toHaveLength(1);
  });

  it("send one digest per period", async () => {
    const { repos, household } = setup();
    const before = (await repos.digests.find({})).length;
    const later = addMinutes(NOW, 24 * 60);
    await Promise.all([tickHousehold(repos, household, later), tickHousehold(repos, household, later)]);
    const periods = (await repos.digests.find({})).map((d) => d.periodEnd);
    expect(new Set(periods).size).toBe(periods.length);
    expect(periods.length).toBe(before + 1);
  });

  it("a double tap on an answer stores it once", async () => {
    const { repos, household } = setup();
    await tickHousehold(repos, household, NOW);
    const next = (await repos.checkins.find({ householdId: household.id, status: "scheduled" }, { orderBy: "dueAt" }))[0];
    const at = new Date(next.dueAt);
    await tickHousehold(repos, household, at);
    const input = { text: "Yes, done.", outcome: "yes" as const, source: "button" as const };
    const results = await Promise.all([answerCheckin(repos, household, next.id, input, at), answerCheckin(repos, household, next.id, input, at)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await repos.responses.find({ checkinId: next.id })).toHaveLength(1);
  });

  it("the database backs it up with unique indexes (migration 0005)", () => {
    const sql = readFileSync("supabase/migrations/0005_one_run_wins.sql", "utf8");
    expect(sql).toContain("on public.checkins (household_id, meta_item_id, due_at)");
    expect(sql).toContain("on public.digests (household_id, period_end)");
    expect(sql).toContain("on public.review_prompts (household_id, audience, due_at)");
  });
});
