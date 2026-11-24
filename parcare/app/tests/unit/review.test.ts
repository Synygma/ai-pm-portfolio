import { describe, expect, it } from "vitest";
import { createMemoryRepos, emptySnapshot, MemoryStore } from "@/data/memory";
import type { ReviewPromptRow } from "@/data/types";
import { initialReviewPrompts, nextChildReview, planReviews, REVIEW_EVERY_DAYS } from "@/domain/review";
import { addMinutes } from "@/domain/time";
import { deleteFamilyData } from "@/services/household";
import { markReviewDone, tickReviews } from "@/services/review";
import { saveEmergencyContact } from "@/services/setup";
import type { VoiceStore } from "@/services/voice";

const SETUP = new Date("2026-11-05T10:00:00Z");
const DAY = 24 * 60;
const H = "22222222-2222-4222-8222-222222222222";
const days = (n: number) => addMinutes(SETUP, n * DAY);

function prompts(): ReviewPromptRow[] {
  return initialReviewPrompts(SETUP).map((p, i) => ({ id: `p${i}`, householdId: H, ...p, shownAt: null, doneAt: null }));
}

/** Applies the plan the way the service does, so timing can be followed over many months. */
function run(rows: ReviewPromptRow[], now: Date) {
  const actions = planReviews(rows, now);
  for (const a of actions) {
    if (a.type === "show") rows.find((r) => r.id === a.id)!.shownAt = now.toISOString();
    else rows.push({ id: `p${rows.length}`, householdId: H, audience: a.audience, dueAt: a.dueAt, shownAt: null, doneAt: null });
  }
  return actions;
}

describe("review prompts (5.11, G9): +1 week, then every 3 months", () => {
  it("first prompts: child at setup + 1 week, parent at + 2 weeks", () => {
    expect(initialReviewPrompts(SETUP)).toEqual([
      { audience: "child", dueAt: days(7).toISOString() },
      { audience: "parent", dueAt: days(14).toISOString() },
    ]);
  });

  it("nothing before the due time; at +1 week the child is told and the next one is 3 months later", () => {
    const rows = prompts();
    expect(run(rows, days(6.9))).toEqual([]);
    const actions = run(rows, days(7));
    expect(actions).toEqual([
      { type: "show", id: "p0", audience: "child", notify: true, latest: true },
      { type: "schedule", audience: "child", dueAt: days(7 + REVIEW_EVERY_DAYS).toISOString() },
    ]);
    expect(nextChildReview(rows, days(7))).toBe(days(7 + 91).toISOString());
  });

  it("the parent prompt at +2 weeks goes to her app (not a notification to the child)", () => {
    const rows = prompts();
    run(rows, days(7));
    const actions = run(rows, days(14));
    expect(actions[0]).toEqual({ type: "show", id: "p1", audience: "parent", notify: false, latest: true });
    expect(actions[1]).toEqual({ type: "schedule", audience: "parent", dueAt: days(14 + 91).toISOString() });
  });

  it("keeps going every 3 months, once each time", () => {
    const rows = prompts();
    const shownChild: string[] = [];
    for (let d = 0; d <= 7 + 3 * 91; d++) {
      for (const a of run(rows, days(d))) if (a.type === "show" && a.audience === "child") shownChild.push(rows.find((r) => r.id === a.id)!.dueAt);
    }
    expect(shownChild).toEqual([days(7), days(98), days(189), days(280)].map((d) => d.toISOString()));
  });

  it("a long clock jump tells the child once, not once per missed prompt", () => {
    const rows = prompts();
    run(rows, days(7));
    const actions = run(rows, days(7 + 3 * 91 + 1));
    const childShows = actions.filter((a) => a.type === "show" && a.audience === "child");
    expect(childShows).toHaveLength(1);
    expect(actions.filter((a) => a.type === "schedule" && a.audience === "child")).toEqual([
      { type: "schedule", audience: "child", dueAt: days(7 + 4 * 91).toISOString() },
    ]);
  });

  it("no prompts at all before setup finishes", () => {
    expect(planReviews([], days(100))).toEqual([]);
  });

  it("service: raises one review alert with a bubble; 'Done, we talked' marks prompt and alert", async () => {
    const r = createMemoryRepos(new MemoryStore(emptySnapshot()));
    await r.reviewPrompts.insertMany(initialReviewPrompts(SETUP).map((p) => ({ householdId: H, ...p, shownAt: null, doneAt: null })));
    expect(await tickReviews(r, H, days(1))).toEqual([]);
    const [alert] = await tickReviews(r, H, days(7));
    expect(alert).toMatchObject({ kind: "review", ackAt: null });
    expect(await r.chatMessages.find({ householdId: H, refId: alert.id })).toHaveLength(1);
    expect(await tickReviews(r, H, days(7))).toEqual([]); // shown once

    expect(await markReviewDone(r, "33333333-3333-4333-8333-333333333333", alert.id, days(8))).toBe(false); // other family
    expect(await markReviewDone(r, H, alert.id, days(8))).toBe(true);
    expect((await r.alerts.get(alert.id))!.ackAt).toBe(days(8).toISOString());
    const prompt = await r.reviewPrompts.get(alert.data.reviewPromptId as string);
    expect(prompt!.doneAt).toBe(days(8).toISOString());
  });
});

describe("Settings: emergency contact (G7) and deleting data (G14, G15)", () => {
  it("a 'No' never replaces or adds a contact; a 'Yes' replaces the old one", async () => {
    const r = createMemoryRepos(new MemoryStore(emptySnapshot()));
    await saveEmergencyContact(r, H, { choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: true }, SETUP);
    const no = await saveEmergencyContact(r, H, { choice: "add", name: "Mr. Das", phone: "+91 00000 22222", told: false }, SETUP);
    expect(no.action).toBe("doNotStore");
    expect((await r.emergencyContacts.find({ householdId: H })).map((c) => c.name)).toEqual(["Mrs. Iyer"]);
    await saveEmergencyContact(r, H, { choice: "add", name: "Mr. Das", phone: "+91 00000 22222", told: true }, SETUP);
    expect((await r.emergencyContacts.find({ householdId: H })).map((c) => c.name)).toEqual(["Mr. Das"]);
  });

  it("deletes every voice clip, then every row and the profile", async () => {
    const r = createMemoryRepos(new MemoryStore(emptySnapshot()));
    const userId = "44444444-4444-4444-8444-444444444444";
    const iso = SETUP.toISOString();
    await r.profiles.insert({ id: userId, email: "fictional@example.com", fullName: "Asha Rao", petName: null, country: null, city: null, age: null, timeZone: "Europe/London", createdAt: iso });
    const household = await r.households.insert({
      childId: userId,
      managedParentId: null,
      parentAvatarId: null,
      gapAMinutes: 10,
      gapBMinutes: 20,
      digestLocalTime: "19:00",
      demoClockOffsetMs: 0,
      retentionDays: 30,
      setupCompletedAt: iso,
      createdAt: iso,
    });
    await r.childReminders.insert({ householdId: household.id, label: "x", audioPath: `${household.id}/a.webm`, isSample: false, dueAt: iso, repeat: "none", status: "scheduled", createdAt: iso });
    await r.helperRequests.insert({ householdId: household.id, text: "x", audioPath: `${household.id}/b.webm`, status: "new", createdAt: iso, updatedAt: iso });
    const removed: string[] = [];
    const voice: VoiceStore = { save: async () => "", playUrl: async () => null, remove: async (p) => void removed.push(p) };

    await deleteFamilyData(r, voice, userId);
    expect(removed.sort()).toEqual([`${household.id}/a.webm`, `${household.id}/b.webm`]);
    expect(await r.households.find({})).toEqual([]);
    expect(await r.childReminders.find({})).toEqual([]);
    expect(await r.profiles.get(userId)).toBeNull();
  });
});
