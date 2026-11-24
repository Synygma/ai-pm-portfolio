// Parent app P5: personalised last question, photo prompt, her review prompts, "who can see what".
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { HouseholdRow, ParentProfileRow } from "@/data/types";
import { activeConsents } from "@/domain/engine";
import { GENERAL_QUESTIONS, pickLastQuestion, QUESTIONS_BY_TYPE } from "@/domain/last-question";
import { parentMessages } from "@/domain/parent-chat";
import { addMinutes } from "@/domain/time";
import { tickHousehold } from "@/services/checkins";
import { answerCheckin } from "@/services/parent-checkins";
import { deleteMyWords, listMyCheckins, setCheckinOn, setCheckinShared, setCompanion, setGaps } from "@/services/parent-settings";
import { markParentReviewDone, tickReviews } from "@/services/review";
import type { VoiceStore } from "@/services/voice";
import messages from "../../messages/en.json";

const NOW = new Date("2026-11-09T10:00:00Z");
const noVoice: VoiceStore = { save: async () => "", playUrl: async () => null, remove: async () => undefined };

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { snap, repos, household: snap.households[0] as HouseholdRow, parent: snap.parentProfiles[0] as ParentProfileRow };
}

describe("last question of the day (N13, A6)", () => {
  it("prefers questions about her own check-ins and never repeats one from the last 7 days", () => {
    const types = ["physical_activity", "puja"] as const;
    const asked: string[] = [];
    for (let day = 0; day < 7; day++) asked.push(pickLastQuestion([...types], asked.slice(-7), 20000 + day));
    expect(new Set(asked).size).toBe(7);
    const personal = [...QUESTIONS_BY_TYPE.physical_activity!, ...QUESTIONS_BY_TYPE.puja!];
    expect(asked.some((k) => personal.includes(k))).toBe(true);
    // Same inputs, same question (so her chat and her answer card agree).
    expect(pickLastQuestion([...types], [], 20001)).toBe(pickLastQuestion([...types], [], 20001));
  });

  it("every question exists in the texts, addresses her by name, and asks no medical question", () => {
    const all = [...Object.values(QUESTIONS_BY_TYPE).flat(), ...GENERAL_QUESTIONS];
    const texts = messages.parentChat.lastQuestions as Record<string, string>;
    for (const k of all) {
      expect(texts[k], k).toBeTruthy();
      expect(texts[k]).toContain("{firstName}");
      expect(texts[k]).not.toMatch(/medicine|tablet|pain|sick|health/i);
    }
  });

  it("the last check-in is asked a personalised question; prompt 2 asks the same; answering adds the photo prompt", async () => {
    const { repos, household } = setup();
    await tickHousehold(repos, household, NOW);
    const metas = await repos.metaItems.find({ householdId: household.id });
    const lastItem = metas.find((m) => m.checkinType === "last_checkin")!;
    const last = (await repos.checkins.find({ householdId: household.id, metaItemId: lastItem.id }, { orderBy: "dueAt" })).find((c) => c.status === "scheduled")!;
    const at = new Date(last.dueAt);
    await tickHousehold(repos, household, at);
    await tickHousehold(repos, household, addMinutes(at, household.gapAMinutes));
    const asked = (await repos.chatMessages.find({ householdId: household.id, refId: last.id })).map((m) => m.data.question);
    expect(asked).toHaveLength(2);
    expect(typeof asked[0]).toBe("string");
    expect(asked[1]).toBe(asked[0]);

    await answerCheckin(repos, household, last.id, { text: "Watched a nice film.", outcome: "unclear", source: "typed" }, addMinutes(at, 11));
    const photo = parentMessages(await repos.chatMessages.find({ householdId: household.id })).filter((m) => m.data.photoPrompt);
    expect(photo).toHaveLength(1);
  });
});

describe("her review prompts (G9)", () => {
  it("at +2 weeks the companion asks in her chat; 'All is fine' marks it done", async () => {
    const { repos, household, snap } = setup();
    const p = snap.reviewPrompts.find((r) => r.audience === "parent")!;
    await tickReviews(repos, household.id, new Date(p.dueAt));
    const q = parentMessages(await repos.chatMessages.find({ householdId: household.id, kind: "review" }));
    expect(q).toHaveLength(1);
    expect(q[0].refId).toBe(p.id);
    expect(await markParentReviewDone(repos, household.id, p.id, new Date(p.dueAt))).toBe(true);
    expect((await repos.reviewPrompts.get(p.id))!.doneAt).toBe(p.dueAt);
    // Not the child's prompt, and not another family's.
    const childPrompt = snap.reviewPrompts.find((r) => r.audience === "child")!;
    expect(await markParentReviewDone(repos, household.id, childPrompt.id, NOW)).toBe(false);
    expect(await markParentReviewDone(repos, "other", p.id, NOW)).toBe(false);
  });
});

describe("who can see what (G2)", () => {
  it("pause revokes her consent (future check-ins go); resume records a new one with her sharing choice", async () => {
    const { repos, household, parent } = setup();
    await tickHousehold(repos, household, NOW);
    const [walk] = (await listMyCheckins(repos, household, parent, NOW)).filter((i) => i.label === "Morning walk");
    expect(walk).toMatchObject({ on: true, shared: true });
    await setCheckinShared(repos, household, parent, walk.metaItemId, false, NOW);
    await setCheckinOn(repos, household, parent, walk.metaItemId, false, NOW);
    expect((await listMyCheckins(repos, household, parent, NOW)).find((i) => i.metaItemId === walk.metaItemId)).toMatchObject({ on: false });
    await tickHousehold(repos, household, addMinutes(NOW, 1));
    const future = (await repos.checkins.find({ householdId: household.id, metaItemId: walk.metaItemId })).filter((c) => c.status === "scheduled");
    expect(future).toEqual([]);
    const later = addMinutes(NOW, 5);
    await setCheckinOn(repos, household, parent, walk.metaItemId, true, later);
    const active = activeConsents(await repos.consents.find({ householdId: household.id, metaItemId: walk.metaItemId }), later);
    expect(active).toHaveLength(1);
    expect(active[0]).toMatchObject({ shareInDigest: false, grantedAt: later.toISOString() });
  });

  it("refuses other families' items, 'My Child' as companion, and gaps outside the list", async () => {
    const { repos, household, parent } = setup();
    expect(await setCheckinOn(repos, household, { ...parent, id: "someone-else" }, (await repos.metaItems.find({}))[0].id, false, NOW)).toBe(false);
    expect(await setCompanion(repos, household, "my-child")).toBe(false);
    expect(await setCompanion(repos, household, "guruji")).toBe(true);
    expect(await setGaps(repos, household, 7, 20)).toBe(false);
    expect(await setGaps(repos, household, 5, 30)).toBe(true);
    expect(await repos.households.get(household.id)).toMatchObject({ parentAvatarId: "guruji", gapAMinutes: 5, gapBMinutes: 30 });
  });

  it("'Delete my recordings and words' removes her answers, the digests and clips; help requests stay as text", async () => {
    const { repos, household } = setup();
    const help = (await repos.helperRequests.find({}))[0];
    await repos.helperRequests.update(help.id, { audioPath: `${household.id}/x.webm` });
    const removed: string[] = [];
    const r = await deleteMyWords(repos, { ...noVoice, remove: async (p) => void removed.push(p) }, household);
    expect(r.answers).toBeGreaterThan(0);
    expect(r.digests).toBeGreaterThan(0);
    expect(await repos.responses.find({})).toEqual([]);
    expect(await repos.digests.find({})).toEqual([]);
    expect(removed).toEqual([`${household.id}/x.webm`]);
    expect((await repos.helperRequests.get(help.id))!).toMatchObject({ audioPath: null, text: help.text });
    expect(parentMessages(await repos.chatMessages.find({ kind: "answer" }))).toEqual([]);
  });
});
