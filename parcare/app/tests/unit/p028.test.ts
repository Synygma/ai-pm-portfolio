// P-028: one list of check-ins (time drop-down, edit in one place), the companion's voice matches
// the picture, her help request shown in her chat, and delete for me / for everyone.
import { describe, expect, it } from "vitest";
import { avatars, getAvatar } from "@/config/brand";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { CheckinType, HouseholdRow, ParentProfileRow } from "@/data/types";
import { bubbleLines } from "@/domain/chat";
import { activeConsents } from "@/domain/engine";
import { isClockTime, PARENT_SETUP_STEPS, type ParentItem, stepFromOldLayout, timeChoices } from "@/domain/parent-setup";
import { pickVoice, voiceIs } from "@/domain/voice-pick";
import { tickHousehold } from "@/services/checkins";
import { createParentHelpRequest } from "@/services/helper";
import { deleteParentMessage, hiddenForHer, isHers } from "@/services/parent-messages";
import { finishParentSetup } from "@/services/parent-setup";
import { listMyCheckins, setCheckinOn, setCheckinTime } from "@/services/parent-settings";
import type { VoiceStore } from "@/services/voice";

const NOW = new Date("2026-11-12T04:00:00Z"); // 09:30 in Lucknow

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { snap, repos, household: snap.households[0] as HouseholdRow, parent: snap.parentProfiles[0] as ParentProfileRow };
}
function voiceStore() {
  const removed: string[] = [];
  const store: VoiceStore = { save: async (h, id) => `${h}/${id}.webm`, playUrl: async (p) => `/api/voice/${p}`, remove: async (p) => void removed.push(p) };
  return { store, removed };
}

describe("one list of check-ins in her setup", () => {
  it("has one list step instead of separate recap and consent steps; old drafts resume at the right step", () => {
    expect(PARENT_SETUP_STEPS).toEqual(["companion", "day", "followups", "checklist", "thanks", "alarms", "terms"]);
    // Old layout: companion, day, followups, recap, consent, thanks, alarms, terms.
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(stepFromOldLayout)).toEqual([0, 1, 2, 3, 3, 4, 5, 6]);
  });

  it("offers every quarter hour, plus the item's own time when it is off the grid", () => {
    const all = timeChoices();
    expect(all).toHaveLength(96);
    expect(all[0]).toBe("00:00");
    expect(all).toContain("08:45");
    expect(timeChoices("08:50")).toContain("08:50");
    expect(timeChoices("08:50").indexOf("08:50")).toBe(timeChoices("08:50").indexOf("08:45") + 1);
    expect(isClockTime("24:00")).toBe(false);
    expect(isClockTime("07:05")).toBe(true);
  });

  it("finishing removes the child's described list, so the family keeps one set; her unticked items stay off", async () => {
    const { snap, repos, household, parent } = setup();
    snap.parentProfiles[0] = { ...parent, setupCompletedAt: null };
    // A new family: the child's described items, nothing agreed yet.
    for (const c of await repos.consents.find({ householdId: household.id })) await repos.consents.remove(c.id);
    const item =(label: string, checkinType: CheckinType, localTime: string, consent: boolean): ParentItem => ({ label, checkinType, localTime, included: true, consent, share: true });
    const done = await finishParentSetup(
      repos,
      household,
      snap.parentProfiles[0],
      { companionId: "vidya", items: [item("Woken up", "woken_up", "06:15", true), item("Walk", "physical_activity", "07:00", false)], summaryToChild: true, gapAMinutes: 10, gapBMinutes: 15, termsAccepted: true },
      NOW,
      null,
    );
    const metas = await repos.metaItems.find({ householdId: household.id });
    expect(done).toEqual({ ok: true, consented: 1 });
    expect(metas.every((m) => m.source === "parent")).toBe(true);
    expect(metas.map((m) => m.label).sort()).toEqual(["Walk", "Woken up"]);
    // Her Settings shows both: the one she agreed to (on) and the one she did not tick (can be turned on).
    const mine = await listMyCheckins(repos, household, snap.parentProfiles[0], NOW);
    expect(mine.map((m) => [m.label, m.on, m.agreed])).toEqual([
      ["Woken up", true, true],
      ["Walk", false, false],
    ]);
    const walk = mine.find((m) => m.label === "Walk")!;
    expect(await setCheckinOn(repos, household, snap.parentProfiles[0], walk.metaItemId, true, NOW)).toBe(true);
    expect(activeConsents(await repos.consents.find({ householdId: household.id, metaItemId: walk.metaItemId }), NOW)).toHaveLength(1);
  });
});

describe("she changes a check-in time in Settings (parent only, G2)", () => {
  it("moves the check-ins not yet asked to the new time and tells the child", async () => {
    const { repos, household, parent } = setup();
    await tickHousehold(repos, household, NOW);
    const meta = (await repos.metaItems.find({ householdId: household.id })).find((m) => m.localTime === "20:30")!;
    const before = (await repos.checkins.find({ householdId: household.id, metaItemId: meta.id, status: "scheduled" }))[0];
    expect(before).toBeDefined();

    expect(await setCheckinTime(repos, household, parent, meta.id, "21:00", NOW)).toBe(true);
    expect((await repos.metaItems.get(meta.id))!.localTime).toBe("21:00");
    expect(await repos.checkins.get(before.id)).toBeNull();
    await tickHousehold(repos, household, NOW);
    const after = await repos.checkins.find({ householdId: household.id, metaItemId: meta.id, status: "scheduled" });
    expect(after.length).toBeGreaterThan(0);
    expect(after.every((c) => c.dueAt.endsWith("T15:30:00.000Z"))).toBe(true); // 21:00 in Lucknow

    const told = (await repos.chatMessages.find({ householdId: household.id, kind: "setup" })).find((m) => m.data.timeChanged);
    expect(told?.audience).toBe("child");
    expect(bubbleLines(told!, { childPetName: "Gudiya", parentPetName: "Maa", companionName: "Vidya", formatTime: () => "" } as never)).toEqual([
      { key: "parentTimeChanged", values: { parentPetName: "Maa", label: meta.label, time: "21:00" } },
    ]);
  });

  it("refuses a bad time or someone else's item", async () => {
    const { repos, household, parent } = setup();
    const meta = (await repos.metaItems.find({ householdId: household.id }))[0];
    expect(await setCheckinTime(repos, household, parent, meta.id, "25:00", NOW)).toBe(false);
    expect(await setCheckinTime(repos, household, parent, "no-such-item", "09:00", NOW)).toBe(false);
  });
});

describe("the companion's voice matches the picture", () => {
  it("Vidya is female, the other companions are male", () => {
    expect(getAvatar("vidya").voice).toBe("female");
    expect(avatars.filter((a) => a.selectable && a.id !== "vidya").every((a) => a.voice === "male")).toBe(true);
  });

  it("picks a voice by name, Indian English first, and never mistakes 'female' for 'male'", () => {
    const voices = [
      { name: "Google US English", lang: "en-US" },
      { name: "Microsoft Heera - English (India)", lang: "en-IN" },
      { name: "Microsoft Ravi - English (India)", lang: "en-IN" },
      { name: "Google UK English Female", lang: "en-GB" },
      { name: "Google UK English Male", lang: "en-GB" },
    ];
    expect(voiceIs(voices[3], "male")).toBe(false);
    expect(pickVoice(voices, "male")).toEqual({ voice: voices[2], pitch: 1 });
    expect(pickVoice(voices, "female")).toEqual({ voice: voices[1], pitch: 1 });
    // No named voice: avoid the other gender and nudge the pitch.
    const plain = [{ name: "Google UK English Female", lang: "en-GB" }, { name: "Default", lang: "en-US" }];
    expect(pickVoice(plain, "male")).toEqual({ voice: plain[1], pitch: 0.8 });
    expect(pickVoice([], "female")).toEqual({ voice: null, pitch: 1.15 });
  });
});

describe("delete in her chat: for me, or for everyone (her own messages only)", () => {
  it("'Delete for everyone' on a help request removes it from both chats, the Helper list and the voice store", async () => {
    const { repos, household } = setup();
    const { store, removed } = voiceStore();
    const r = await createParentHelpRequest(repos, store, household, { text: "Please send the plumber", audio: { data: new Uint8Array(300), type: "audio/webm" } }, NOW);
    if (!r.ok) throw new Error("not sent");
    const mine = (await repos.chatMessages.find({ householdId: household.id, refId: r.request.id })).find((m) => m.audience === "parent")!;
    expect(isHers(mine)).toBe(true);
    expect(await deleteParentMessage(repos, store, household, mine.id, "everyone")).toBe(true);
    expect(await repos.helperRequests.get(r.request.id)).toBeNull();
    expect(await repos.chatMessages.find({ householdId: household.id, refId: r.request.id })).toEqual([]);
    expect(removed).toEqual([r.request.audioPath]);
  });

  it("'Delete for me' only hides the bubble in her chat; the child still has the request", async () => {
    const { repos, household } = setup();
    const { store } = voiceStore();
    const r = await createParentHelpRequest(repos, store, household, { text: "Bring vegetables", audio: null }, NOW);
    if (!r.ok) throw new Error("not sent");
    const msgs = await repos.chatMessages.find({ householdId: household.id, refId: r.request.id });
    const mine = msgs.find((m) => m.audience === "parent")!;
    expect(await deleteParentMessage(repos, store, household, mine.id, "me")).toBe(true);
    expect(hiddenForHer((await repos.chatMessages.get(mine.id))!)).toBe(true);
    expect(hiddenForHer(msgs.find((m) => m.audience === "child")!)).toBe(false);
    expect(await repos.helperRequests.get(r.request.id)).not.toBeNull();
  });

  it("companion messages and the child's chat cannot be deleted for everyone from her app", async () => {
    const { repos, household } = setup();
    const { store } = voiceStore();
    const companion = (await repos.chatMessages.find({ householdId: household.id })).find((m) => m.audience === "parent" && m.kind !== "answer" && m.kind !== "helper");
    const childMsg = (await repos.chatMessages.find({ householdId: household.id })).find((m) => m.audience === "child")!;
    if (companion) expect(await deleteParentMessage(repos, store, household, companion.id, "everyone")).toBe(false);
    expect(await deleteParentMessage(repos, store, household, childMsg.id, "me")).toBe(false);
  });

  it("'Delete for everyone' on her check-in answer also takes her words out of the evening summary", async () => {
    const { repos, household } = setup();
    const { store } = voiceStore();
    // A seed digest quoting one of her answers.
    const digest = (await repos.digests.find({ householdId: household.id })).find((d) => d.items.length > 0)!;
    const responseId = digest.items[0].responseId;
    const bubble = (await repos.chatMessages.find({ householdId: household.id, refId: responseId }))[0]
      ?? (await repos.chatMessages.insert({ householdId: household.id, kind: "answer", direction: "out", audience: "parent", refId: responseId, data: {}, createdAt: NOW.toISOString(), readAt: NOW.toISOString() }));
    expect(await deleteParentMessage(repos, store, household, bubble.id, "everyone")).toBe(true);
    expect(await repos.responses.get(responseId)).toBeNull();
    expect((await repos.digests.get(digest.id))!.items.some((i) => i.responseId === responseId)).toBe(false);
  });
});
