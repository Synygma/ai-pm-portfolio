// Pure helpers for the companion chat: which translated lines a stored chat message shows, and
// how bubbles are grouped by day. Text itself lives in messages/en.json under "bubbles".
//
// Wording rules: missed check-ins are factual and never use the word "emergency" (5.5);
// the companion is always an AI and never speaks as the child (G16).

import type { AlertRow, ChatMessageRow, DigestRow } from "@/data/types";
import { addDays, localDate } from "./time";

export type BubbleLine = { key: string; values?: Record<string, string | number> };

export type BubbleContext = {
  /** Null until the parent chooses a companion in their app. */
  companionName: string | null;
  parentPetName: string;
  childPetName: string;
  digests: Map<string, DigestRow>;
  alerts: Map<string, AlertRow>;
  /** Formats an instant as the child's local "HH:MM". */
  formatTime: (iso: string) => string;
};

export function bubbleLines(msg: ChatMessageRow, ctx: BubbleContext): BubbleLine[] {
  const p = ctx.parentPetName;
  switch (msg.kind) {
    case "setup":
      // The parent changed the time of one of her check-ins (P-028).
      if (msg.data.timeChanged) {
        const time = typeof msg.data.time === "string" ? msg.data.time : "none";
        return [{ key: "parentTimeChanged", values: { parentPetName: p, label: String(msg.data.label ?? ""), time } }];
      }
      // The parent added a check-in herself in her Settings (P-040).
      if (msg.data.checkinAdded) {
        const time = typeof msg.data.time === "string" ? msg.data.time : "none";
        return [{ key: "parentCheckinAdded", values: { parentPetName: p, label: String(msg.data.label ?? ""), time } }];
      }
      // The parent finished her own setup in the parent app.
      if (msg.data.parentSetupDone) {
        return [{ key: "parentSetupDone", values: { parentPetName: p, count: Number(msg.data.count ?? 0) } }];
      }
      if (!ctx.companionName) {
        return [{ key: "setupHelloNoCompanion", values: { childPetName: ctx.childPetName, parentPetName: p } }];
      }
      return [
        { key: "setupHello", values: { childPetName: ctx.childPetName, name: ctx.companionName, parentPetName: p } },
        { key: "setupWhat", values: { parentPetName: p } },
      ];
    case "digest": {
      const d = msg.refId ? ctx.digests.get(msg.refId) : undefined;
      if (!d) return [{ key: "digestMissing" }];
      const lines: BubbleLine[] = [{ key: "digest", values: { parentPetName: p, count: d.items.length } }];
      if (d.flags.length > 0) lines.push({ key: "digestFlags", values: { count: d.flags.length } });
      return lines;
    }
    case "alert": {
      const a = msg.refId ? ctx.alerts.get(msg.refId) : undefined;
      if (!a) return [{ key: "alertMissing" }];
      const lines: BubbleLine[] = [];
      if (a.kind === "missed_checkin") lines.push({ key: "missedCheckin", values: { petName: p } });
      if (a.kind === "emergency_word") lines.push({ key: "emergencyWord", values: { petName: p } });
      if (a.kind === "all_disabled") lines.push({ key: "allDisabled", values: { petName: p } });
      if (a.kind === "review") lines.push({ key: "review", values: { petName: p } });
      if (a.kind === "review" && a.ackAt) lines.push({ key: "reviewDone", values: { time: ctx.formatTime(a.ackAt) } });
      if (a.kind === "missed_checkin" || a.kind === "emergency_word") {
        lines.push(a.ackAt ? { key: "alarmOff", values: { time: ctx.formatTime(a.ackAt) } } : { key: "alarmOn" });
      }
      return lines;
    }
    case "review":
      return [{ key: "review", values: { petName: p } }];
    case "helper":
      return [{ key: "helper", values: { petName: p } }];
    case "reminder":
      return [{ key: "reminder", values: { petName: p } }];
    case "note":
      // A gentle check-in from the ParCare team (admin page), clearly labelled as from the team.
      return [{ key: "teamNote", values: { text: String(msg.data.text ?? "") } }];
    case "reply":
      // A reaction or voice reply (P-030): the chat page shows it with replyLine().
      return [];
    case "checkin":
    case "answer":
      // Only in the parent's chat, never in the child's.
      return [];
  }
}

export type DayLabel = { kind: "today" | "yesterday" | "date"; date: string };

/** Day separator label for a bubble, in the child's time zone. */
export function dayLabel(instant: string, now: Date, timeZone: string): DayLabel {
  const date = localDate(new Date(instant), timeZone);
  const today = localDate(now, timeZone);
  if (date === today) return { kind: "today", date };
  if (date === addDays(today, -1)) return { kind: "yesterday", date };
  return { kind: "date", date };
}

/** The child's companion chat only (older rows have no audience and are the child's). */
export function childMessages<T extends { audience?: string }>(messages: T[]): T[] {
  return messages.filter((m) => m.audience !== "parent");
}

/** Messages shown so far: nothing from the (demo-clock) future. Oldest first. */
export function visibleMessages(messages: ChatMessageRow[], now: Date): ChatMessageRow[] {
  return messages
    .filter((m) => new Date(m.createdAt) <= now)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function unreadCount(messages: ChatMessageRow[], now: Date): number {
  return visibleMessages(messages, now).filter((m) => m.direction === "in" && m.readAt === null).length;
}
