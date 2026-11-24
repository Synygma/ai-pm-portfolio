// Reactions (👍 / 👎) and voice replies between the parent and the child (P-030).
// - A reaction is shown on the bubble it was given to (sender's chat) and as a short bubble in the
//   other person's chat ("Maa reacted 👍 to your voice reminder"). Tapping it again takes it back.
// - A voice reply is the sender's own recording: their own bubble ("Your voice reply") plus the
//   other person's bubble with the clip. The sender can delete it for everyone.
// Both go at the end of the family's keeping period like everything else (G15, retention.ts).

import { randomUUID } from "node:crypto";
import type { Repos } from "@/data/repo";
import type { ChatMessageRow, HouseholdRow } from "@/data/types";
import { AUDIO_TYPES, MAX_AUDIO_BYTES } from "@/domain/reminders";
import { isReaction, otherSide, type Reaction, replyAbout, type Side, sideOf } from "@/domain/replies";
import { translator } from "@/i18n/translator";
import { sendPushToHousehold } from "./push";
import type { VoiceStore } from "./voice";

const iso = (d: Date) => d.toISOString();

async function target(repos: Repos, household: HouseholdRow, side: Side, messageId: string) {
  const msg = await repos.chatMessages.get(messageId);
  if (!msg || msg.householdId !== household.id) return null;
  const about = replyAbout(msg, side);
  return about ? { msg, ...about } : null;
}

/** 👍 / 👎 on a bubble in `side`'s chat. The same reaction again takes it back. */
export async function reactToMessage(repos: Repos, household: HouseholdRow, side: Side, messageId: string, reaction: Reaction, now: Date): Promise<boolean> {
  if (!isReaction(reaction)) return false;
  const t = await target(repos, household, side, messageId);
  if (!t) return false;
  const previous = typeof t.msg.data.reactionMsgId === "string" ? t.msg.data.reactionMsgId : null;
  if (previous) await repos.chatMessages.remove(previous).catch(() => undefined);
  if (t.msg.data.reaction === reaction) {
    await repos.chatMessages.update(t.msg.id, { data: { ...t.msg.data, reaction: null, reactionMsgId: null } });
    return true;
  }
  const told = await repos.chatMessages.insert({
    householdId: household.id,
    kind: "reply",
    direction: "in",
    audience: otherSide(side),
    refId: null,
    data: { from: side, reaction, about: t.about, label: t.label },
    createdAt: iso(now),
    readAt: null,
  });
  await repos.chatMessages.update(t.msg.id, { data: { ...t.msg.data, reaction, reactionMsgId: told.id } });
  return true;
}

export type VoiceReplyResult = { ok: true } | { ok: false; error: "notFound" | "audio" };

/** A voice reply to a bubble in `side`'s chat: the sender's own recording, sent to the other side. */
export async function sendVoiceReply(
  repos: Repos,
  voice: VoiceStore,
  household: HouseholdRow,
  side: Side,
  messageId: string,
  audio: { data: Uint8Array; type: string },
  now: Date,
): Promise<VoiceReplyResult> {
  const t = await target(repos, household, side, messageId);
  if (!t) return { ok: false, error: "notFound" };
  const mime = audio.type.split(";")[0] ?? "";
  if (!AUDIO_TYPES[mime] || audio.data.byteLength === 0 || audio.data.byteLength > MAX_AUDIO_BYTES) return { ok: false, error: "audio" };
  const audioPath = await voice.save(household.id, randomUUID(), audio.data, AUDIO_TYPES[mime], mime);
  const data = { from: side, about: t.about, label: t.label, audioPath };
  const theirs = await repos.chatMessages.insert({ householdId: household.id, kind: "reply", direction: "in", audience: otherSide(side), refId: null, data, createdAt: iso(now), readAt: null });
  const mine = await repos.chatMessages.insert({
    householdId: household.id,
    kind: "reply",
    direction: "out",
    audience: side,
    refId: null,
    data: { ...data, pair: theirs.id },
    createdAt: iso(now),
    readAt: iso(now),
  });
  await repos.chatMessages.update(theirs.id, { data: { ...data, pair: mine.id } });
  const tp = translator("replies.push");
  await sendPushToHousehold(
    repos,
    household.id,
    { title: tp(`title.${side}`), body: tp("body"), url: side === "child" ? "/p" : "/chat", tag: `reply-${theirs.id}` },
    otherSide(side),
  );
  return { ok: true };
}

/** "Delete for everyone" on a voice reply this side sent: the clip and both bubbles go. */
export async function deleteVoiceReply(repos: Repos, voice: VoiceStore, msg: ChatMessageRow): Promise<boolean> {
  if (msg.kind !== "reply" || msg.direction !== "out" || typeof msg.data.audioPath !== "string") return false;
  await voice.remove(msg.data.audioPath).catch(() => undefined);
  if (typeof msg.data.pair === "string") await repos.chatMessages.remove(msg.data.pair).catch(() => undefined);
  await repos.chatMessages.remove(msg.id);
  return true;
}

/** Every voice reply `from` one side (both bubbles and the clip): "Delete my recordings". */
export async function deleteVoiceRepliesFrom(repos: Repos, voice: VoiceStore, householdId: string, from: Side): Promise<number> {
  let n = 0;
  for (const m of await repos.chatMessages.find({ householdId, kind: "reply" })) {
    if (m.direction === "out" && m.data.from === from && sideOf(m) === from && (await deleteVoiceReply(repos, voice, m))) n++;
  }
  return n;
}
