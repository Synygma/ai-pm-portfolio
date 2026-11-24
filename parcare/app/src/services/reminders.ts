// Child's voice reminders (5.9): create, delete, advance in the tick, parent answers.

import { randomUUID } from "node:crypto";
import type { Repos } from "@/data/repo";
import type { ChildReminderRow, HouseholdRow } from "@/data/types";
import { AUDIO_TYPES, answerReminder, planReminders, type ReminderErrors, validateReminder } from "@/domain/reminders";
import { translator } from "@/i18n/translator";
import { sendPushToHousehold } from "./push";
import type { VoiceStore } from "./voice";

const iso = (d: Date) => d.toISOString();

export type NewReminder = {
  label: string;
  date: string;
  time: string;
  repeat: string;
  audio: { data: Uint8Array; type: string } | null;
};

export async function createReminder(
  repos: Repos,
  voice: VoiceStore,
  household: HouseholdRow,
  parentTimeZone: string,
  input: NewReminder,
  now: Date,
): Promise<{ ok: true; reminder: ChildReminderRow } | { ok: false; errors: ReminderErrors }> {
  const { errors, dueAt } = validateReminder(
    { label: input.label, date: input.date, time: input.time, repeat: input.repeat, audio: input.audio ? { type: input.audio.type, size: input.audio.data.byteLength } : null },
    now,
    parentTimeZone,
  );
  if (Object.keys(errors).length > 0 || !dueAt) return { ok: false, errors };

  const id = randomUUID();
  let audioPath: string | null = null;
  if (input.audio) {
    const mime = input.audio.type.split(";")[0];
    audioPath = await voice.save(household.id, id, input.audio.data, AUDIO_TYPES[mime], mime);
  }
  const reminder = await repos.childReminders.insert({
    id,
    householdId: household.id,
    label: input.label.trim(),
    audioPath,
    isSample: false,
    dueAt: iso(dueAt),
    repeat: input.repeat as ChildReminderRow["repeat"],
    status: "scheduled",
    createdAt: iso(now),
  });
  await repos.chatMessages.insert({ householdId: household.id, kind: "reminder", direction: "out", audience: "child", refId: reminder.id, data: {}, createdAt: iso(now), readAt: null });
  return { ok: true, reminder };
}

export async function deleteReminder(repos: Repos, voice: VoiceStore, householdId: string, id: string): Promise<boolean> {
  const r = await repos.childReminders.get(id);
  if (!r || r.householdId !== householdId) return false;
  if (r.audioPath) await voice.remove(r.audioPath);
  await repos.childReminders.remove(id);
  return true;
}

export async function tickReminders(repos: Repos, householdId: string, parentTimeZone: string, now: Date): Promise<number> {
  const reminders = await repos.childReminders.find({ householdId });
  const patches = planReminders(reminders, now, parentTimeZone);
  for (const p of patches) {
    const before = reminders.find((x) => x.id === p.id);
    // Only if it is still as this run saw it (the scheduler can run twice at once).
    const after = before ? await repos.childReminders.updateIf(p.id, { status: before.status, dueAt: before.dueAt }, p.patch) : null;
    if (!after) continue;
    // Starts ringing: a line in the parent's chat and a notification to her phone (her app plays it).
    if (after.status === "ringing" && before?.status !== "ringing") {
      await repos.chatMessages.insert({ householdId, kind: "reminder", direction: "in", audience: "parent", refId: after.id, data: { label: after.label }, createdAt: iso(now), readAt: null });
      const household = await repos.households.get(householdId);
      const child = household ? await repos.profiles.get(household.childId) : null;
      const childName = child?.petName || child?.fullName.trim().split(" ")[0] || "";
      await sendPushToHousehold(
        repos,
        householdId,
        { title: translator("parentApp.reminder")("pushTitle", { childName }), body: after.label, url: "/p/reminder", tag: `reminder-${after.id}` },
        "parent",
      );
    }
  }
  return patches.length;
}

/** The parent answers the earliest ringing reminder: "OK" or "Snooze". */
export async function answerRingingReminder(repos: Repos, householdId: string, answer: "ok" | "snooze", now: Date): Promise<ChildReminderRow | null> {
  const ringing = (await repos.childReminders.find({ householdId, status: "ringing" }, { orderBy: "dueAt" }))[0];
  if (!ringing) return null;
  const patch = answerReminder(ringing, answer, now);
  return patch ? repos.childReminders.update(ringing.id, patch) : null;
}
