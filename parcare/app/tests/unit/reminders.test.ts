import { existsSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { ChildReminderRow } from "@/data/types";
import { answerReminder, nextOccurrence, planReminders, SNOOZE_MINUTES, validateReminder } from "@/domain/reminders";
import { markHelperSeen, setHelperDone } from "@/services/helper";
import { answerRingingReminder, createReminder, deleteReminder, tickReminders } from "@/services/reminders";
import { FileVoiceStore, isSafeVoicePath, purgeOldVoice } from "@/services/voice";

const IST = "Asia/Kolkata";
const LONDON = "Europe/London";
const at = (s: string) => new Date(s);

const reminder = (over: Partial<ChildReminderRow> = {}): ChildReminderRow => ({
  id: "r1", householdId: "h", label: "Drink water", audioPath: null, isSample: false,
  dueAt: "2026-11-06T01:45:00.000Z", // 07:15 IST
  repeat: "none", status: "scheduled", createdAt: "2026-11-05T00:00:00.000Z", ...over,
});

describe("reminder timing (parent's time zone)", () => {
  it("rings at the due time, not before", () => {
    expect(planReminders([reminder()], at("2026-11-06T01:44:59Z"), IST)).toEqual([]);
    expect(planReminders([reminder()], at("2026-11-06T01:45:00Z"), IST)).toEqual([{ id: "r1", patch: { status: "ringing" } }]);
  });

  it("parent says OK; a one-off stays OK, a daily one rings again next day at the same local time", () => {
    expect(answerReminder(reminder({ status: "ringing" }), "ok", at("2026-11-06T01:50:00Z"))).toEqual({ status: "parent_ok" });
    expect(answerReminder(reminder({ status: "scheduled" }), "ok", at("2026-11-06T01:50:00Z"))).toBeNull();
    expect(planReminders([reminder({ status: "parent_ok" })], at("2026-11-08T00:00:00Z"), IST)).toEqual([]);
    const daily = reminder({ status: "parent_ok", repeat: "daily" });
    expect(planReminders([daily], at("2026-11-07T01:44:00Z"), IST)).toEqual([]);
    expect(planReminders([daily], at("2026-11-07T01:45:00Z"), IST)).toEqual([{ id: "r1", patch: { status: "ringing", dueAt: "2026-11-07T01:45:00.000Z" } }]);
  });

  it("snooze rings again after 10 minutes", () => {
    const patch = answerReminder(reminder({ status: "ringing" }), "snooze", at("2026-11-06T01:50:00Z"));
    expect(patch).toEqual({ status: "snoozed", dueAt: new Date(at("2026-11-06T01:50:00Z").getTime() + SNOOZE_MINUTES * 60000).toISOString() });
    expect(planReminders([reminder({ ...patch! })], at("2026-11-06T02:00:00Z"), IST)).toEqual([{ id: "r1", patch: { status: "ringing" } }]);
  });

  it("weekly repeats keep the local time across a DST change, and catch up after a long jump", () => {
    // A London-time reminder at 09:00 on Saturday 24 Oct 2026 (BST) -> next Saturday is GMT.
    expect(nextOccurrence("2026-10-24T08:00:00.000Z", "weekly", LONDON)?.toISOString()).toBe("2026-10-31T09:00:00.000Z");
    const weekly = reminder({ status: "ringing", repeat: "weekly" });
    const [p] = planReminders([weekly], at("2026-11-28T00:00:00Z"), IST);
    expect(p.patch.dueAt).toBe("2026-11-27T01:45:00.000Z");
  });
});

describe("reminder input", () => {
  const now = at("2026-11-05T10:00:00Z");
  const base = { label: "Drink water", date: "2026-11-06", time: "07:15", repeat: "daily", audio: null };

  it("turns the parent's local date and time into UTC", () => {
    expect(validateReminder(base, now, IST)).toEqual({ errors: {}, dueAt: at("2026-11-06T01:45:00.000Z") });
  });

  it("needs a voice note or a note, a future time, a known repeat and a small, supported recording", () => {
    expect(validateReminder({ ...base, label: " " }, now, IST).errors).toEqual({ content: "required" });
    expect(validateReminder({ ...base, label: "", audio: { type: "audio/webm;codecs=opus", size: 5000 } }, now, IST).errors).toEqual({});
    expect(validateReminder({ ...base, date: "2026-11-05", time: "09:00" }, now, IST).errors).toEqual({ time: "past" });
    expect(validateReminder({ ...base, repeat: "hourly" }, now, IST).errors).toEqual({ repeat: "required" });
    expect(validateReminder({ ...base, audio: { type: "video/mp4", size: 10 } }, now, IST).errors).toEqual({ audio: "type" });
    expect(validateReminder({ ...base, audio: { type: "audio/webm", size: 2_000_000 } }, now, IST).errors).toEqual({ audio: "tooBig" });
  });
});

describe("reminder and helper services", () => {
  const now = at("2026-11-05T10:00:00Z");
  function setup() {
    const repos = createMemoryRepos(new MemoryStore(buildSeed({ now })));
    const voice = new FileVoiceStore(mkdtempSync(path.join(os.tmpdir(), "parcare-voice-")));
    return { repos, voice };
  }

  it("stores the recording under the household, rings, and the parent's OK is shown", async () => {
    const { repos, voice } = setup();
    const household = (await repos.households.find({}))[0];
    const r = await createReminder(repos, voice, household, IST, { label: "", date: "2026-11-06", time: "09:00", repeat: "none", audio: { data: new Uint8Array([1, 2, 3]), type: "audio/webm" } }, now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.reminder.audioPath).toBe(`${household.id}/${r.reminder.id}.webm`);
    expect(r.reminder.dueAt).toBe("2026-11-06T03:30:00.000Z");
    expect((voice as FileVoiceStore).read(r.reminder.audioPath!)).toEqual(Buffer.from([1, 2, 3]));
    expect(await voice.playUrl(r.reminder.audioPath!)).toBe(`/api/voice/${r.reminder.audioPath}`);

    await tickReminders(repos, household.id, IST, at("2026-11-06T03:30:00Z"));
    expect((await repos.childReminders.get(r.reminder.id))?.status).toBe("ringing");
    // The seeded sample (07:15 their time) rang earlier, so the first "OK" goes to it.
    const first = await answerRingingReminder(repos, household.id, "ok", at("2026-11-06T03:31:00Z"));
    expect(first?.isSample).toBe(true);
    await answerRingingReminder(repos, household.id, "ok", at("2026-11-06T03:32:00Z"));
    expect((await repos.childReminders.get(r.reminder.id))?.status).toBe("parent_ok");
    expect(await answerRingingReminder(repos, household.id, "ok", at("2026-11-06T03:33:00Z"))).toBeNull();

    expect(await deleteReminder(repos, voice, household.id, r.reminder.id)).toBe(true);
    expect((voice as FileVoiceStore).read(r.reminder.audioPath!)).toBeNull();
  });

  it("refuses unsafe voice paths", () => {
    expect(isSafeVoicePath("5eed0000-0000-4000-8000-000000000002/5eed0000-0000-4000-8000-000000000099.webm")).toBe(true);
    for (const bad of ["../etc/passwd", "a/b/c.webm", "5eed0000-0000-4000-8000-000000000002/../x.webm", "5eed0000-0000-4000-8000-000000000002/x.exe"]) {
      expect(isSafeVoicePath(bad), bad).toBe(false);
    }
  });

  it("deletes voice clips after 30 days but keeps the words (G15)", async () => {
    const { repos, voice } = setup();
    const household = (await repos.households.find({}))[0];
    const r = await createReminder(repos, voice, household, IST, { label: "Water", date: "2026-11-06", time: "09:00", repeat: "daily", audio: { data: new Uint8Array([9]), type: "audio/ogg" } }, now);
    if (!r.ok) throw new Error("not created");
    const file = path.join((voice as unknown as { dir: string }).dir, r.reminder.audioPath!);
    expect(existsSync(file)).toBe(true);
    expect(await purgeOldVoice(repos, voice, household.id, at("2026-12-04T09:59:00Z"))).toBe(0);
    expect(await purgeOldVoice(repos, voice, household.id, at("2026-12-05T10:01:00Z"))).toBe(1);
    expect(existsSync(file)).toBe(false);
    expect(await repos.childReminders.get(r.reminder.id)).toMatchObject({ audioPath: null, label: "Water" });
  });

  it("helper requests: New -> Seen when the list is opened -> Done -> reopened", async () => {
    const { repos } = setup();
    const household = (await repos.households.find({}))[0];
    const fresh = (await repos.helperRequests.find({ householdId: household.id, status: "new" }))[0];
    expect(await markHelperSeen(repos, household.id, now)).toBe(1);
    expect((await repos.helperRequests.get(fresh.id))?.status).toBe("seen");
    await setHelperDone(repos, household.id, fresh.id, true, now);
    expect((await repos.helperRequests.get(fresh.id))?.status).toBe("done");
    await setHelperDone(repos, household.id, fresh.id, false, now);
    expect((await repos.helperRequests.get(fresh.id))?.status).toBe("seen");
    expect(await setHelperDone(repos, "other-household", fresh.id, true, now)).toBe(false);
  });
});
