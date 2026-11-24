// Parent app P2: the parent's own setup (A–F + terms).
import { describe, expect, it } from "vitest";
import { MockProvider } from "@/ai/mock";
import { TERMS_VERSION } from "@/config/terms";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { CheckinType } from "@/data/types";
import { bubbleLines } from "@/domain/chat";
import { activeConsents } from "@/domain/engine";
import { consentedItems, followUpQuestions, MAX_FOLLOW_UPS, mentions, type ParentItem, type ParentSetupInput, validateParentSetup } from "@/domain/parent-setup";
import { finishParentSetup, getParentDraft, saveParentDraft } from "@/services/parent-setup";

const NOW = new Date("2026-11-07T10:00:00Z");
const item = (label: string, checkinType: CheckinType, localTime: string | null, over: Partial<ParentItem> = {}): ParentItem => ({
  label,
  checkinType,
  localTime,
  included: true,
  consent: true,
  share: true,
  ...over,
});

describe("follow-up questions (A3): only what she did not mention, at most 3 (G4)", () => {
  const child = [
    item("Woken up", "woken_up", "06:00"),
    item("BP medicine (morning)", "medicine", "08:30"),
    item("BP medicine (evening)", "medicine", "20:30"),
    item("Morning walk", "physical_activity", "06:30"),
    item("Evening puja", "puja", "18:30"),
    item("Last check-in of the day", "last_checkin", "21:30"),
  ];

  it("matches by kind of check-in and time (within 90 minutes)", () => {
    expect(mentions([item("Up", "woken_up", "07:15")], child[0])).toBe(true);
    expect(mentions([item("Up", "woken_up", "08:00")], child[0])).toBe(false);
    expect(mentions([item("Tablet", "medicine", "09:00")], child[2])).toBe(false); // morning dose is not the evening one
    expect(mentions([item("Tablet", "medicine", null)], child[2])).toBe(true);
  });

  it("asks about the missing ones, earliest first, never more than 3", async () => {
    const her = await new MockProvider().extractMetaList("I wake up at 6 and take my BP tablet at 8:30. I sleep at 10.");
    const qs = followUpQuestions(her, child);
    expect(qs.map((q) => q.label)).toEqual(["Morning walk", "Evening puja", "BP medicine (evening)"]);
    expect(qs.length).toBeLessThanOrEqual(MAX_FOLLOW_UPS);
    expect(followUpQuestions(child, child)).toEqual([]);
  });
});

describe("finishing her setup", () => {
  function setup() {
    const snap = buildSeed({ now: NOW });
    const repos = createMemoryRepos(new MemoryStore(snap));
    const household = snap.households[0];
    // A parent who has not done her setup yet, with no consents (like a new family).
    snap.parentProfiles[0] = { ...snap.parentProfiles[0], setupCompletedAt: null };
    snap.consents.length = 0;
    return { repos, household, parent: snap.parentProfiles[0] };
  }
  const input = (over: Partial<ParentSetupInput> = {}): ParentSetupInput => ({
    companionId: "guruji",
    items: [
      item("Woken up", "woken_up", "06:00"),
      item("BP medicine", "medicine", "08:30", { share: false }),
      item("Evening walk", "physical_activity", "17:30", { consent: false }),
      item("Wrong item", "social", "12:00", { included: false }),
    ],
    summaryToChild: true,
    gapAMinutes: 5,
    gapBMinutes: 15,
    termsAccepted: true,
    ...over,
  });

  it("is checked: companion must be an AI companion, gaps from the list, terms ticked", () => {
    expect(validateParentSetup(input())).toEqual({});
    expect(validateParentSetup(input({ companionId: "my-child" })).companion).toBe("required");
    expect(validateParentSetup(input({ gapAMinutes: 7 })).gaps).toBe("type");
    expect(validateParentSetup(input({ termsAccepted: false })).terms).toBe("required");
    expect(validateParentSetup(input({ items: [] })).items).toBeUndefined(); // P-040: she may agree to nothing
  });

  it("stores consents only for what she said Yes to, with her sharing choice (G1, G2)", async () => {
    const { repos, household, parent } = setup();
    const r = await finishParentSetup(repos, household, parent, input(), NOW, "203.0.113.9");
    expect(r).toEqual({ ok: true, consented: 2 });
    const consents = activeConsents(await repos.consents.find({ householdId: household.id }), NOW);
    const metas = await repos.metaItems.find({ householdId: household.id, source: "parent" });
    expect(metas.map((m) => m.label).sort()).toEqual(["BP medicine", "Evening walk", "Woken up"]); // unticked item not kept
    const byLabel = new Map(consents.map((c) => [metas.find((m) => m.id === c.metaItemId)?.label, c]));
    expect([...byLabel.keys()].sort()).toEqual(["BP medicine", "Woken up"]);
    expect(byLabel.get("BP medicine")!.shareInDigest).toBe(false);
    expect(byLabel.get("Woken up")!.shareInDigest).toBe(true);

    const h = (await repos.households.get(household.id))!;
    expect([h.parentAvatarId, h.gapAMinutes, h.gapBMinutes]).toEqual(["guruji", 5, 15]);
    expect((await repos.parentProfiles.get(parent.id))!.setupCompletedAt).toBe(NOW.toISOString());
    expect(await repos.termsAcceptances.find({ householdId: household.id, role: "parent" })).toMatchObject([{ termsVersion: TERMS_VERSION }]);
    const agreement = (await repos.termsAgreements.find({ userId: parent.id }))[0];
    expect(agreement.ipHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("no summary to the child = nothing shared; nothing chosen = nothing checked", async () => {
    const a = setup();
    await finishParentSetup(a.repos, a.household, a.parent, input({ summaryToChild: false }), NOW, null);
    expect((await a.repos.consents.find({})).every((c) => !c.shareInDigest)).toBe(true);
    const b = setup();
    const none = input({ items: input().items.map((i) => ({ ...i, consent: false })) });
    expect(await finishParentSetup(b.repos, b.household, b.parent, none, NOW, null)).toEqual({ ok: true, consented: 0 });
    expect(await b.repos.consents.find({})).toEqual([]);
  });

  it("tells both chats; the child's bubble says how many check-ins she agreed to", async () => {
    const { repos, household, parent } = setup();
    await finishParentSetup(repos, household, parent, input(), NOW, null);
    const msgs = await repos.chatMessages.find({ householdId: household.id, createdAt: NOW.toISOString() });
    expect(msgs.map((m) => m.audience).sort()).toEqual(["child", "parent"]);
    const childMsg = msgs.find((m) => m.audience === "child")!;
    const lines = bubbleLines(childMsg, { companionName: "Guruji", parentPetName: "Maa", childPetName: "Gudiya", digests: new Map(), alerts: new Map(), formatTime: () => "" });
    expect(lines).toEqual([{ key: "parentSetupDone", values: { parentPetName: "Maa", count: 2 } }]);
  });

  it("refuses an invalid setup and stores nothing", async () => {
    const { repos, household, parent } = setup();
    const r = await finishParentSetup(repos, household, parent, input({ termsAccepted: false }), NOW, null);
    expect(r.ok).toBe(false);
    expect(await repos.consents.find({})).toEqual([]);
    expect((await repos.parentProfiles.get(parent.id))!.setupCompletedAt).toBeNull();
  });

  it("saves and resumes her progress, separately from the child's draft", async () => {
    const { repos, household } = setup();
    await saveParentDraft(repos, household.id, 2, { companionId: "vidya" }, NOW);
    await saveParentDraft(repos, household.id, 3, { transcript: "I wake at 6" }, NOW);
    const d = await getParentDraft(repos, household.id);
    expect(d).toMatchObject({ audience: "parent", step: 3, data: { companionId: "vidya", transcript: "I wake at 6", startedAt: NOW.toISOString() } });
  });

  it("her draft is saved next to the child's draft (found live: the database allowed only one)", async () => {
    const { repos, household } = setup();
    for (const d of await repos.setupDrafts.find({ householdId: household.id })) await repos.setupDrafts.remove(d.id);
    await repos.setupDrafts.insert({ householdId: household.id, audience: "child", step: 9, data: {}, updatedAt: NOW.toISOString() });
    await saveParentDraft(repos, household.id, 2, { companionId: "vidya" }, NOW);
    const drafts = await repos.setupDrafts.find({ householdId: household.id });
    expect(drafts.map((d) => d.audience).sort()).toEqual(["child", "parent"]);
    // A second child draft for the same household is still refused, as in the database.
    await expect(repos.setupDrafts.insert({ householdId: household.id, audience: "child", step: 1, data: {}, updatedAt: NOW.toISOString() })).rejects.toThrow(/unique/);
  });

  it("consentedItems lists what will be checked, by time", () => {
    expect(consentedItems(input().items).map((i) => i.label)).toEqual(["Woken up", "BP medicine"]);
  });
});
