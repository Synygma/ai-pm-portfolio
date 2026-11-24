// Reactions (👍 / 👎) and voice replies between the parent and the child (P-030), the way their
// usual chat app does it. Pure: which bubbles can be replied to, and what the reply is "about".
// The companion never speaks as the child (G16): a child's voice reply is the child's own recording.

import type { ChatMessageRow } from "@/data/types";

export type Side = "child" | "parent";
export type Reaction = "up" | "down";
/** What a reply refers to; the receiver's bubble names it (keys under "replies" in en.json). */
export type ReplyAbout = "summary" | "help" | "setup" | "time" | "reminder" | "reply";

export const REACTIONS: readonly Reaction[] = ["up", "down"];

export function isReaction(x: unknown): x is Reaction {
  return x === "up" || x === "down";
}

export const otherSide = (side: Side): Side => (side === "child" ? "parent" : "child");

/** Whose chat a row belongs to (older rows have no audience and are the child's). */
export const sideOf = (msg: Pick<ChatMessageRow, "audience">): Side => (msg.audience === "parent" ? "parent" : "child");

/**
 * The bubbles in `side`'s chat that can get a reaction or a voice reply, and what the reply is
 * about. Only bubbles about the other person: the child replies to the parent's summary, help
 * request, finished setup, a changed time or her reply; the parent replies to the child's voice
 * reminders and the child's replies. (Her check-in questions have their own answer buttons.)
 */
export function replyAbout(msg: Pick<ChatMessageRow, "kind" | "direction" | "audience" | "data">, side: Side): { about: ReplyAbout; label: string } | null {
  if (sideOf(msg) !== side || msg.direction !== "in") return null;
  const label = typeof msg.data.label === "string" ? msg.data.label : "";
  if (msg.kind === "reply") return msg.data.audioPath ? { about: "reply", label: "" } : null;
  if (side === "child") {
    if (msg.kind === "digest") return { about: "summary", label: "" };
    if (msg.kind === "helper") return { about: "help", label: "" };
    if (msg.kind === "setup" && (msg.data.parentSetupDone || msg.data.checkinAdded)) return { about: "setup", label: "" };
    if (msg.kind === "setup" && msg.data.timeChanged) return { about: "time", label };
    return null;
  }
  if (msg.kind === "reminder") return { about: "reminder", label };
  return null;
}

/** The reaction this side gave a bubble (shown on it), if any. */
export function myReaction(msg: Pick<ChatMessageRow, "data">): Reaction | null {
  return isReaction(msg.data.reaction) ? msg.data.reaction : null;
}

/** A voice reply this side sent (its own bubble): can be deleted for everyone. */
export function isMyVoiceReply(msg: Pick<ChatMessageRow, "kind" | "direction" | "data">): boolean {
  return msg.kind === "reply" && msg.direction === "out" && typeof msg.data.audioPath === "string";
}

/** Translation key and values (namespace "replies") for a reply bubble, from the reader's side. */
export function replyLine(msg: Pick<ChatMessageRow, "direction" | "data">, names: { childName: string; parentName: string }): { key: string; values: Record<string, string> } {
  const from = msg.data.from === "parent" ? "parent" : "child";
  const about = String(msg.data.about ?? "reply");
  const label = typeof msg.data.label === "string" ? msg.data.label : "";
  // name = who sent it, other = who it went to.
  const values = { name: from === "parent" ? names.parentName : names.childName, other: from === "parent" ? names.childName : names.parentName, label, reaction: String(msg.data.reaction ?? "") };
  if (msg.direction === "out") return { key: `sent.${from}.${about}`, values };
  return { key: `${isReaction(msg.data.reaction) ? "reacted" : "voice"}.${from}.${about}`, values };
}
