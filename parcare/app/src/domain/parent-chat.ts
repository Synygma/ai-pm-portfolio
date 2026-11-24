// What the parent's companion chat shows (parent app). Pure: a stored chat message -> the
// translated lines (keys under "parentChat" in messages/en.json) or the parent's own words.
// The companion is always an AI and never speaks as the child (G16).

import type { ChatMessageRow, CheckinType } from "@/data/types";

export type ParentBubble =
  | { kind: "lines"; lines: { key: string; values?: Record<string, string | number> }[] }
  /** The parent's own words, shown exactly. */
  | { kind: "quote"; text: string };

export type ParentChatContext = {
  firstName: string;
  childName: string;
  /** Null until she chooses one (parent setup). */
  companionName: string | null;
  checkinTypes: Map<string, CheckinType>;
  responses: Map<string, string>;
  /** Her local "HH:MM" for an instant. */
  formatTime: (iso: string) => string;
};

/** The parent's chat only. */
export function parentMessages<T extends { audience?: string }>(messages: T[]): T[] {
  return messages.filter((m) => m.audience === "parent");
}

export function parentBubble(msg: ChatMessageRow, ctx: ParentChatContext): ParentBubble {
  const v = { firstName: ctx.firstName, childName: ctx.childName };
  switch (msg.kind) {
    case "setup":
      return ctx.companionName
        ? { kind: "lines", lines: [{ key: "hello", values: { ...v, name: ctx.companionName } }, { key: "helloWhy", values: v }] }
        : { kind: "lines", lines: [{ key: "helloNoCompanion", values: v }] };
    case "checkin": {
      // Companion replies about a check-in (no refId): thanks, snoozed, or PAUSE (G5).
      if (msg.data.thanks) return { kind: "lines", lines: [{ key: "thanks", values: v }] };
      if (msg.data.paused) return { kind: "lines", lines: [{ key: "paused", values: v }] };
      if (typeof msg.data.snoozedUntil === "string") return { kind: "lines", lines: [{ key: "snoozed", values: { ...v, time: ctx.formatTime(msg.data.snoozedUntil) } }] };
      if (msg.data.photoPrompt) return { kind: "lines", lines: [{ key: "photoPrompt", values: v }] };
      const type = msg.refId ? ctx.checkinTypes.get(msg.refId) : undefined;
      // The last check-in of the day: a personalised question (N13).
      const question =
        typeof msg.data.question === "string"
          ? { key: `lastQuestions.${msg.data.question}`, values: v }
          : { key: type ? `prompt.${type}` : "promptGeneric", values: v };
      // Prompt 2 (F2): asked again, alarm-like.
      return { kind: "lines", lines: msg.data.second ? [{ key: "again", values: v }, question] : [question] };
    }
    case "answer": {
      const text = msg.refId ? ctx.responses.get(msg.refId) : undefined;
      // Deleted after the family's keeping period (P-011 item 3).
      return text !== undefined ? { kind: "quote", text } : { kind: "lines", lines: [{ key: "answerDeleted" }] };
    }
    case "review":
      return { kind: "lines", lines: [{ key: "review", values: v }] };
    case "reminder":
      return { kind: "lines", lines: [{ key: "reminder", values: { ...v, label: typeof msg.data.label === "string" ? msg.data.label : "" } }] };
    case "helper":
      return { kind: "lines", lines: [{ key: "helperSent", values: v }] };
    case "reply": // a reaction or voice reply (P-030): the chat page shows it with replyLine()
    case "digest":
    case "alert":
    case "note": // team notes go to the child's app only
      return { kind: "lines", lines: [] };
  }
}
