// Admin page (P-027): activity bands, gentle notes only, deleting a test user completely.
import { describe, expect, it } from "vitest";
import { DEMO_CHILD_EMAIL } from "@/config/demo";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { CheckinRow, CheckinStatus } from "@/data/types";
import { activityOf, allIsOk, checkGentleNote, NOTE_MAX } from "@/domain/admin";
import { deleteUserCompletely, listAdminUsers, sendGentleNote } from "@/services/admin";
import type { VoiceStore } from "@/services/voice";

const NOW = new Date("2026-11-12T12:00:00Z");
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000).toISOString();
const checkin = (status: CheckinStatus, d: number, escalated = false): CheckinRow => ({
  id: `${status}-${d}-${Math.random()}`,
  householdId: "h",
  metaItemId: "m",
  dueAt: daysAgo(d),
  status,
  prompted1At: null,
  prompted2At: null,
  answeredAt: null,
  escalatedAt: escalated ? daysAgo(d) : null,
  acknowledgedAt: null,
  snoozedUntil: null,
});

describe("activity bands (last 14 days, answered before the child's alarm)", () => {
  it("80% or more = active, 50–79% = partly, under 50% = low, nothing asked = not started", () => {
    const many = (answered: number, missed: number) => [
      ...Array.from({ length: answered }, (_, i) => checkin("answered", 1 + i * 0.1)),
      ...Array.from({ length: missed }, (_, i) => checkin("acknowledged", 1 + i * 0.1, true)),
    ];
    expect(activityOf(many(8, 2), NOW)).toMatchObject({ band: "active", percent: 80, alarms: 2, asked: 10 });
    expect(activityOf(many(5, 5), NOW).band).toBe("partly");
    expect(activityOf(many(4, 6), NOW).band).toBe("low");
    expect(activityOf([], NOW)).toMatchObject({ band: "notStarted", percent: null });
  });

  it("counts only what she was asked in the window (not scheduled, lapsed or older than 14 days)", () => {
    const a = activityOf([checkin("answered", 1), checkin("scheduled", 1), checkin("lapsed", 2), checkin("escalated", 20, true)], NOW);
    expect(a).toMatchObject({ asked: 1, answered: 1, alarms: 0, band: "active" });
  });

  it("an answer that came after the alarm does not count as answered", () => {
    expect(activityOf([checkin("answered", 1, true)], NOW)).toMatchObject({ answered: 0, alarms: 1, band: "low" });
  });
});

describe("gentle notes only: no marketing", () => {
  it("accepts a kind check-in", () => {
    expect(checkGentleNote("Hope you and your mother are keeping well this week.")).toBeNull();
  });
  it("refuses offers, prices, links and health words", () => {
    expect(checkGentleNote("Upgrade to premium today")).toBe("marketing");
    expect(checkGentleNote("50% off this Diwali")).toBe("marketing");
    expect(checkGentleNote("Special offer for you")).toBe("marketing");
    expect(checkGentleNote("See parcare.com for news")).toBe("link");
    expect(checkGentleNote("Visit https://example.org")).toBe("link");
    expect(checkGentleNote("Hope her dementia is better")).toBe("wording");
    expect(checkGentleNote("  ")).toBe("empty");
    expect(checkGentleNote("a".repeat(NOTE_MAX + 1))).toBe("tooLong");
  });
});

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { snap, repos, household: snap.households[0] };
}
const noVoice: VoiceStore = { save: async () => "", playUrl: async () => null, remove: async () => undefined };

describe("deleting a test user", () => {
  it("removes the family, the profile and the login; the sample family is locked", async () => {
    const { snap, repos, household } = setup();
    const priya = { id: household.childId, email: DEMO_CHILD_EMAIL, createdAt: NOW.toISOString() };
    expect(await deleteUserCompletely(repos, noVoice, priya, async () => true)).toEqual({ ok: false, reason: "locked" });

    // Pretend Priya's family belongs to a tester instead.
    const tester = { ...priya, email: "tester@example.com" };
    const removed: string[] = [];
    const r = await deleteUserCompletely(repos, noVoice, tester, async (id) => (removed.push(id), true));
    expect(r).toEqual({ ok: true });
    expect(removed).toEqual([household.childId]);
    expect(await repos.households.find({})).toEqual([]);
    expect(await repos.profiles.get(household.childId)).toBeNull();
    expect(await repos.parentSessions.find({ householdId: household.id })).toEqual([]);
    // The record of agreeing to the terms stays (P-011).
    expect(snap.termsAgreements.length).toBeGreaterThan(0);
    expect(await deleteUserCompletely(repos, noVoice, undefined, async () => true)).toEqual({ ok: false, reason: "notFound" });
  });

  it("lists logins with their family's band and setup state", async () => {
    const { repos, household } = setup();
    const users = await listAdminUsers(repos, [{ id: household.childId, email: DEMO_CHILD_EMAIL, createdAt: NOW.toISOString() }], NOW.getTime());
    expect(users[0]).toMatchObject({ name: "Priya Sharma", setupDone: true, parentName: "Kamla Sharma", locked: true });
    expect(users[0].activity.asked).toBeGreaterThan(0);
  });
});

describe("sending a gentle note", () => {
  it("goes to the child's chat only, where all is OK, and is logged", async () => {
    const { repos, household } = setup();
    for (const a of await repos.alerts.find({})) await repos.alerts.update(a.id, { ackAt: a.ackAt ?? NOW.toISOString() });
    const r = await sendGentleNote(repos, { text: "Hope you are both well.", preset: null, pushTitle: "A note" }, NOW);
    expect(r).toEqual({ ok: true, families: 1, skipped: 0, pushed: 0 });
    const notes = await repos.chatMessages.find({ householdId: household.id, kind: "note" });
    expect(notes.map((n) => [n.audience, n.data.text])).toEqual([["child", "Hope you are both well."]]);
    expect(await repos.adminBroadcasts.find({})).toMatchObject([{ message: "Hope you are both well.", families: 1 }]);
  });

  it("skips a family with an alarm ringing, and refuses marketing", async () => {
    const { repos, household } = setup();
    await repos.alerts.insert({ householdId: household.id, kind: "missed_checkin", checkinId: null, data: {}, createdAt: NOW.toISOString(), ackAt: null });
    expect(allIsOk(await repos.alerts.find({}))).toBe(false);
    expect(await sendGentleNote(repos, { text: "Hello!", preset: null, pushTitle: "A note" }, NOW)).toEqual({ ok: true, families: 0, skipped: 1, pushed: 0 });
    expect(await sendGentleNote(repos, { text: "Buy now", preset: null, pushTitle: "A note" }, NOW)).toEqual({ ok: false, reason: "marketing" });
  });
});
