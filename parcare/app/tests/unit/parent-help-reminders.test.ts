// Parent app P4: help requests by voice/words, and the child's voice reminders ringing for her.
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { HouseholdRow } from "@/data/types";
import { parentMessages } from "@/domain/parent-chat";
import { addMinutes } from "@/domain/time";
import { createParentHelpRequest, markHelperSeen, MAX_HELP_TEXT } from "@/services/helper";
import { answerRingingReminder, tickReminders } from "@/services/reminders";
import type { VoiceStore } from "@/services/voice";

const NOW = new Date("2026-11-08T10:00:00Z");

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  const saved: string[] = [];
  const voice: VoiceStore = {
    save: async (h, id, _d, ext) => {
      const p = `${h}/${id}.${ext}`;
      saved.push(p);
      return p;
    },
    playUrl: async () => null,
    remove: async () => undefined,
  };
  return { snap, repos, voice, saved, household: snap.households[0] as HouseholdRow };
}

describe("help requests from the parent app", () => {
  it("words and/or a voice note go to the child's Helper list as New; both chats are told", async () => {
    const { repos, voice, saved, household } = setup();
    const r = await createParentHelpRequest(repos, voice, household, { text: "Please get my BP tablets this week", audio: { data: new Uint8Array(500), type: "audio/webm;codecs=opus" } }, NOW);
    expect(r.ok && r.emergency).toBe(false);
    if (!r.ok) return;
    expect(r.request).toMatchObject({ text: "Please get my BP tablets this week", status: "new" });
    expect(r.request.audioPath).toBe(saved[0]);
    const msgs = await repos.chatMessages.find({ refId: r.request.id });
    expect(msgs.map((m) => m.audience).sort()).toEqual(["child", "parent"]);
    // A voice note alone is fine too.
    const v = await createParentHelpRequest(repos, voice, household, { text: "", audio: { data: new Uint8Array(10), type: "audio/ogg" } }, NOW);
    expect(v.ok).toBe(true);
  });

  it("refuses nothing-to-send, too long text and unusable audio", async () => {
    const { repos, voice, household } = setup();
    expect(await createParentHelpRequest(repos, voice, household, { text: "  ", audio: null }, NOW)).toEqual({ ok: false, error: "empty" });
    expect(await createParentHelpRequest(repos, voice, household, { text: "x".repeat(MAX_HELP_TEXT + 1), audio: null }, NOW)).toEqual({ ok: false, error: "tooLong" });
    expect(await createParentHelpRequest(repos, voice, household, { text: "", audio: { data: new Uint8Array(10), type: "video/mp4" } }, NOW)).toEqual({ ok: false, error: "audio" });
    expect(await createParentHelpRequest(repos, voice, household, { text: "", audio: { data: new Uint8Array(2_000_000), type: "audio/webm" } }, NOW)).toEqual({ ok: false, error: "audio" });
  });

  it("an emergency word raises the child's distinct alarm (G5); bare 'help' does not", async () => {
    const { repos, voice, household } = setup();
    const r = await createParentHelpRequest(repos, voice, household, { text: "Help me, I can't breathe", audio: null }, NOW);
    expect(r.ok && r.emergency).toBe(true);
    expect(await repos.alerts.find({ householdId: household.id, kind: "emergency_word", ackAt: null })).toHaveLength(1);
    const calm = await createParentHelpRequest(repos, voice, household, { text: "I need help with the groceries", audio: null }, NOW);
    expect(calm.ok && calm.emergency).toBe(false);
  });

  it("the child opening the Helper list marks only the child's bubbles read, not the parent's", async () => {
    const { repos, voice, household } = setup();
    const r = await createParentHelpRequest(repos, voice, household, { text: "Groceries please", audio: null }, NOW);
    if (!r.ok) throw new Error("not ok");
    await repos.chatMessages.update((await repos.chatMessages.find({ refId: r.request.id, audience: "parent" }))[0].id, { readAt: null });
    await markHelperSeen(repos, household.id, NOW);
    const msgs = await repos.chatMessages.find({ refId: r.request.id });
    expect(msgs.find((m) => m.audience === "child")!.readAt).not.toBeNull();
    expect(msgs.find((m) => m.audience === "parent")!.readAt).toBeNull();
  });
});

describe("the child's voice reminders on the parent's phone", () => {
  it("when it starts ringing her chat says so (once); OK and snooze answer it", async () => {
    const { repos, household, snap } = setup();
    const reminder = snap.childReminders[0];
    const due = new Date(reminder.dueAt);
    await tickReminders(repos, household.id, "Asia/Kolkata", due);
    await tickReminders(repos, household.id, "Asia/Kolkata", addMinutes(due, 1));
    expect((await repos.childReminders.get(reminder.id))!.status).toBe("ringing");
    const lines = parentMessages(await repos.chatMessages.find({ householdId: household.id, kind: "reminder" }));
    expect(lines).toHaveLength(1);
    expect(lines[0].data.label).toBe(reminder.label);

    const snoozed = await answerRingingReminder(repos, household.id, "snooze", addMinutes(due, 2));
    expect(snoozed?.status).toBe("snoozed");
    // Rings again after the snooze: a second line.
    await tickReminders(repos, household.id, "Asia/Kolkata", addMinutes(due, 13));
    expect(parentMessages(await repos.chatMessages.find({ householdId: household.id, kind: "reminder" }))).toHaveLength(2);
    expect((await answerRingingReminder(repos, household.id, "ok", addMinutes(due, 14)))?.status).not.toBe("ringing");
  });
});
