// P-030: reactions and voice replies between parent and child; delete like their usual chat app;
// replies go at the end of the family's keeping period (G15).
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { ChatMessageRow, HouseholdRow } from "@/data/types";
import { replyAbout, replyLine } from "@/domain/replies";
import { deleteParentMessage } from "@/services/parent-messages";
import { deleteMyWords } from "@/services/parent-settings";
import { reactToMessage, sendVoiceReply } from "@/services/replies";
import { purgeOldData } from "@/services/retention";
import type { VoiceStore } from "@/services/voice";

const NOW = new Date("2026-11-12T04:00:00Z");
const names = { childName: "Gudiya", parentName: "Maa" };
const clipOf = () => ({ data: new Uint8Array(400), type: "audio/webm" });

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  const removed: string[] = [];
  const voice: VoiceStore = { save: async (h, id) => `${h}/${id}.webm`, playUrl: async (p) => `/api/voice/${p}`, remove: async (p) => void removed.push(p) };
  return { repos, voice, removed, household: snap.households[0] as HouseholdRow };
}

async function add(repos: ReturnType<typeof setup>["repos"], household: HouseholdRow, row: Partial<ChatMessageRow>) {
  return repos.chatMessages.insert({ householdId: household.id, kind: "setup", direction: "in", audience: "child", refId: null, data: {}, createdAt: NOW.toISOString(), readAt: null, ...row });
}

describe("which bubbles can get a reaction or a voice reply", () => {
  it("child: the parent's summary, help request, finished setup, changed time; never alerts or the companion's hello", () => {
    const m = (kind: ChatMessageRow["kind"], data = {}, audience: ChatMessageRow["audience"] = "child") => ({ kind, direction: "in" as const, audience, data });
    expect(replyAbout(m("digest"), "child")?.about).toBe("summary");
    expect(replyAbout(m("helper"), "child")?.about).toBe("help");
    expect(replyAbout(m("setup", { parentSetupDone: true }), "child")?.about).toBe("setup");
    expect(replyAbout(m("setup", { timeChanged: true, label: "Walk" }), "child")).toEqual({ about: "time", label: "Walk" });
    expect(replyAbout(m("setup"), "child")).toBeNull();
    expect(replyAbout(m("alert"), "child")).toBeNull();
    expect(replyAbout(m("note"), "child")).toBeNull();
    // Parent: the child's voice reminders; not the companion's check-in questions (they have answer buttons).
    expect(replyAbout(m("reminder", { label: "Drink water" }, "parent"), "parent")).toEqual({ about: "reminder", label: "Drink water" });
    expect(replyAbout(m("checkin", {}, "parent"), "parent")).toBeNull();
    // Never across chats.
    expect(replyAbout(m("digest"), "parent")).toBeNull();
  });
});

describe("reactions", () => {
  it("shows on the bubble and tells the other side; the same reaction again takes it back; a new one replaces it", async () => {
    const { repos, household } = setup();
    const reminder = await add(repos, household, { kind: "reminder", audience: "parent", data: { label: "Drink water" } });
    expect(await reactToMessage(repos, household, "parent", reminder.id, "up", NOW)).toBe(true);
    const told = () => repos.chatMessages.find({ householdId: household.id, kind: "reply" });
    expect((await told()).map((m) => [m.audience, m.data.reaction])).toEqual([["child", "up"]]);
    expect((await repos.chatMessages.get(reminder.id))!.data.reaction).toBe("up");
    expect(replyLine((await told())[0], names)).toEqual({ key: "reacted.parent.reminder", values: { name: "Maa", other: "Gudiya", label: "Drink water", reaction: "up" } });

    await reactToMessage(repos, household, "parent", reminder.id, "down", NOW);
    expect((await told()).map((m) => m.data.reaction)).toEqual(["down"]);
    await reactToMessage(repos, household, "parent", reminder.id, "down", NOW);
    expect(await told()).toEqual([]);
    expect((await repos.chatMessages.get(reminder.id))!.data.reaction).toBeNull();
  });

  it("refuses bubbles that are not about the other person, and other households", async () => {
    const { repos, household } = setup();
    const alert = await add(repos, household, { kind: "alert" });
    expect(await reactToMessage(repos, household, "child", alert.id, "up", NOW)).toBe(false);
    const digest = await add(repos, household, { kind: "digest" });
    expect(await reactToMessage(repos, { ...household, id: "other" }, "child", digest.id, "up", NOW)).toBe(false);
  });
});

describe("voice replies", () => {
  it("the child's voice reply reaches the parent's chat; the child can delete it for everyone", async () => {
    const { repos, voice, removed, household } = setup();
    const digest = await add(repos, household, { kind: "digest" });
    expect(await sendVoiceReply(repos, voice, household, "child", digest.id, clipOf(), NOW)).toEqual({ ok: true });
    const replies = await repos.chatMessages.find({ householdId: household.id, kind: "reply" });
    const hers = replies.find((m) => m.audience === "parent")!;
    const mine = replies.find((m) => m.audience === "child")!;
    expect(hers.direction).toBe("in");
    expect(replyLine(hers, names).key).toBe("voice.child.summary");
    expect(replyLine(mine, names)).toMatchObject({ key: "sent.child.summary", values: { other: "Maa" } });
    // She can reply to the child's voice reply in turn.
    expect(replyAbout(hers, "parent")?.about).toBe("reply");

    const { deleteVoiceReply } = await import("@/services/replies");
    expect(await deleteVoiceReply(repos, voice, mine)).toBe(true);
    expect(await repos.chatMessages.find({ householdId: household.id, kind: "reply" })).toEqual([]);
    expect(removed).toEqual([mine.data.audioPath]);
  });

  it("her voice reply: 'Delete for everyone' from her chat; refuses a bad clip", async () => {
    const { repos, voice, household } = setup();
    const reminder = await add(repos, household, { kind: "reminder", audience: "parent", data: { label: "Walk" } });
    expect(await sendVoiceReply(repos, voice, household, "parent", reminder.id, { data: new Uint8Array(0), type: "audio/webm" }, NOW)).toEqual({ ok: false, error: "audio" });
    await sendVoiceReply(repos, voice, household, "parent", reminder.id, clipOf(), NOW);
    const mine = (await repos.chatMessages.find({ householdId: household.id, kind: "reply" })).find((m) => m.audience === "parent")!;
    expect(await deleteParentMessage(repos, voice, household, mine.id, "everyone")).toBe(true);
    expect(await repos.chatMessages.find({ householdId: household.id, kind: "reply" })).toEqual([]);
  });

  it("'Delete my recordings and words' removes her voice replies too", async () => {
    const { repos, voice, household } = setup();
    const reminder = await add(repos, household, { kind: "reminder", audience: "parent", data: { label: "Walk" } });
    await sendVoiceReply(repos, voice, household, "parent", reminder.id, clipOf(), NOW);
    await deleteMyWords(repos, voice, household);
    expect(await repos.chatMessages.find({ householdId: household.id, kind: "reply" })).toEqual([]);
  });

  it("go at the end of the keeping period, with their clip (G15)", async () => {
    const { repos, voice, removed, household } = setup();
    const digest = await add(repos, household, { kind: "digest" });
    await sendVoiceReply(repos, voice, household, "child", digest.id, clipOf(), NOW);
    const later = new Date(NOW.getTime() + 31 * 24 * 3600000);
    await purgeOldData(repos, { id: household.id, retentionDays: 30 }, later); // no voice store: wait
    expect(await repos.chatMessages.find({ householdId: household.id, kind: "reply" })).toHaveLength(2);
    await purgeOldData(repos, { id: household.id, retentionDays: 30 }, later, voice);
    expect(await repos.chatMessages.find({ householdId: household.id, kind: "reply" })).toEqual([]);
    expect(removed.length).toBeGreaterThan(0);
  });
});
