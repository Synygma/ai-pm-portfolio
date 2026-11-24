// Child's voice reminders for the parent (5.9, N14). Pure rules:
// scheduled -> ringing at the due time (the parent app plays it, next phase) -> "Parent said OK"
// or "Snoozed" (rings again after SNOOZE_MINUTES). Repeating reminders move to the next
// occurrence at the same local time in the PARENT's time zone (DST-safe).

import type { ChildReminderRow } from "@/data/types";
import { addDays, localDate, localTime, zonedTimeToUtc } from "./time";

export const SNOOZE_MINUTES = 10;
export const MAX_RECORDING_SECONDS = 60;
export const MAX_AUDIO_BYTES = 1_000_000;
export const AUDIO_TYPES: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a" };

const ms = (s: string) => new Date(s).getTime();

/** The occurrence after `dueAt` for a repeating reminder, same wall-clock time in `timeZone`. */
export function nextOccurrence(dueAt: string, repeat: ChildReminderRow["repeat"], timeZone: string): Date | null {
  if (repeat === "none") return null;
  const due = new Date(dueAt);
  const step = repeat === "daily" ? 1 : 7;
  return zonedTimeToUtc(addDays(localDate(due, timeZone), step), localTime(due, timeZone), timeZone);
}

/** The latest occurrence at or before `now` (for when the clock has moved on by several days). */
function latestOccurrence(dueAt: string, repeat: ChildReminderRow["repeat"], timeZone: string, now: Date): string {
  let current = dueAt;
  for (let i = 0; i < 800; i++) {
    const next = nextOccurrence(current, repeat, timeZone);
    if (!next || next.getTime() > now.getTime()) break;
    current = next.toISOString();
  }
  return current;
}

export type ReminderPatch = { id: string; patch: Pick<Partial<ChildReminderRow>, "status" | "dueAt"> };

export function planReminders(reminders: ChildReminderRow[], now: Date, parentTimeZone: string): ReminderPatch[] {
  const t = now.getTime();
  const out: ReminderPatch[] = [];
  for (const r of reminders) {
    if ((r.status === "scheduled" || r.status === "snoozed") && ms(r.dueAt) <= t) {
      out.push({ id: r.id, patch: { status: "ringing" } });
    } else if (r.repeat !== "none" && (r.status === "parent_ok" || r.status === "ringing")) {
      const latest = latestOccurrence(r.dueAt, r.repeat, parentTimeZone, now);
      if (latest !== r.dueAt) out.push({ id: r.id, patch: { status: "ringing", dueAt: latest } });
    }
  }
  return out;
}

/** The parent answers a ringing reminder (parent app; the demo simulator for now). */
export function answerReminder(reminder: ChildReminderRow, answer: "ok" | "snooze", now: Date): ReminderPatch["patch"] | null {
  if (reminder.status !== "ringing") return null;
  if (answer === "ok") return { status: "parent_ok" };
  return { status: "snoozed", dueAt: new Date(now.getTime() + SNOOZE_MINUTES * 60000).toISOString() };
}

export type ReminderInput = {
  label: string;
  date: string; // parent-local "YYYY-MM-DD"
  time: string; // parent-local "HH:MM"
  repeat: string;
  audio: { type: string; size: number } | null;
};

export type ReminderErrors = Partial<Record<"label" | "date" | "time" | "repeat" | "audio" | "content", string>>;

/** Validates a new reminder. Times are the parent's local time. Returns errors and the UTC due time. */
export function validateReminder(input: ReminderInput, now: Date, parentTimeZone: string): { errors: ReminderErrors; dueAt: Date | null } {
  const errors: ReminderErrors = {};
  if (input.label.trim().length > 80) errors.label = "tooLong";
  if (!input.label.trim() && !input.audio) errors.content = "required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "required";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) errors.time = "required";
  if (!["none", "daily", "weekly"].includes(input.repeat)) errors.repeat = "required";
  if (input.audio) {
    if (!AUDIO_TYPES[input.audio.type.split(";")[0]]) errors.audio = "type";
    else if (input.audio.size > MAX_AUDIO_BYTES) errors.audio = "tooBig";
    else if (input.audio.size === 0) errors.audio = "empty";
  }
  let dueAt: Date | null = null;
  if (!errors.date && !errors.time) {
    dueAt = zonedTimeToUtc(input.date, input.time, parentTimeZone);
    if (dueAt.getTime() <= now.getTime()) errors.time = "past";
  }
  return { errors, dueAt };
}
