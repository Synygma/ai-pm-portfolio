"use server";

import { revalidatePath } from "next/cache";
import { classifyAnswerSafely } from "@/ai";
import { getCurrentParent } from "@/data/parent-access";
import { appNow } from "@/domain/clock";
import { isReaction } from "@/domain/replies";
import { translator } from "@/i18n/translator";
import { createParentHelpRequest } from "@/services/helper";
import { answerCheckin, snoozeCheckin } from "@/services/parent-checkins";
import { type DeleteScope, deleteParentMessage } from "@/services/parent-messages";
import { answerRingingReminder } from "@/services/reminders";
import { reactToMessage, sendVoiceReply } from "@/services/replies";
import { getServiceVoiceStore } from "@/services/voice-store";

export type AnswerKind = "yes" | "no" | "okay" | "words";
export type AnswerActionResult = { ok: true; emergency: boolean } | { ok: false };

/**
 * Her answer to a check-in. Buttons store a short sentence as her answer ("Yes, done."); her own
 * words (typed or spoken) are stored exactly and read as done / not done / unclear by the AI
 * (fictional data only to Gemini; the rule-based reader otherwise).
 */
export async function answerCheckinAction(checkinId: string, kind: AnswerKind, words = "", spoken = false): Promise<AnswerActionResult> {
  const me = await getCurrentParent();
  if (!me) return { ok: false };
  const t = translator("parentApp.answer");
  let text: string;
  let outcome: "yes" | "no" | "unclear" | null;
  if (kind === "words") {
    text = words.trim();
    if (!text) return { ok: false };
    const checkin = await me.repos.checkins.get(checkinId);
    const meta = checkin ? await me.repos.metaItems.get(checkin.metaItemId) : null;
    const question = meta ? translator("parentChat")(`prompt.${meta.checkinType}`, { firstName: me.firstName }) : "";
    outcome = await classifyAnswerSafely(question, text);
  } else {
    text = t(`stored.${kind}`);
    outcome = kind === "yes" ? "yes" : kind === "no" ? "no" : "unclear";
  }
  const source = kind === "words" ? (spoken ? "voice" : "typed") : "button";
  const r = await answerCheckin(me.repos, me.household, checkinId, { text, outcome, source }, appNow(me.household));
  revalidatePath("/p");
  return r.ok ? { ok: true, emergency: r.emergency } : { ok: false };
}

export async function snoozeCheckinAction(checkinId: string): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me) return { ok: false };
  const r = await snoozeCheckin(me.repos, me.household, checkinId, appNow(me.household));
  revalidatePath("/p");
  return { ok: r.ok };
}

export type HelpActionResult = { ok: true; emergency: boolean } | { ok: false; error: "empty" | "tooLong" | "audio" | "failed" };

/** "Ask for help": FormData with text and/or a short voice note ("audio"). */
export async function sendHelpAction(formData: FormData): Promise<HelpActionResult> {
  const me = await getCurrentParent();
  if (!me) return { ok: false, error: "failed" };
  const file = formData.get("audio");
  const audio = file instanceof File && file.size > 0 ? { data: new Uint8Array(await file.arrayBuffer()), type: file.type || "audio/webm" } : null;
  const r = await createParentHelpRequest(me.repos, getServiceVoiceStore(), me.household, { text: String(formData.get("text") ?? ""), audio }, appNow(me.household));
  revalidatePath("/p", "layout");
  return r.ok ? { ok: true, emergency: r.emergency } : { ok: false, error: r.error };
}

/** The child's voice reminder is ringing: "OK, thank you" or "Snooze 10 min". */
export async function answerReminderParentAction(answer: "ok" | "snooze"): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me) return { ok: false };
  const r = await answerRingingReminder(me.repos, me.household.id, answer, appNow(me.household));
  revalidatePath("/p", "layout");
  return { ok: r !== null };
}

/** 👍 / 👎 on one of the child's bubbles in her chat (P-030); the same one again takes it back. */
export async function reactParentAction(messageId: string, reaction: string): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me || !isReaction(reaction)) return { ok: false };
  const ok = await reactToMessage(me.repos, me.household, "parent", messageId, reaction, appNow(me.household)).catch(() => false);
  revalidatePath("/p", "layout");
  return { ok };
}

/** Her own voice reply to one of the child's bubbles (P-030). */
export async function voiceReplyParentAction(messageId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const me = await getCurrentParent();
  const file = formData.get("audio");
  const audio = file instanceof File && file.size > 0 ? { data: new Uint8Array(await file.arrayBuffer()), type: file.type || "audio/webm" } : null;
  if (!me || !audio) return { ok: false, error: "audio" };
  const r = await sendVoiceReply(me.repos, getServiceVoiceStore(), me.household, "parent", messageId, audio, appNow(me.household)).catch(() => ({ ok: false as const, error: "failed" }));
  revalidatePath("/p", "layout");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/** Delete a message in her chat: for her only, or (her own messages) for everyone (P-028). */
export async function deleteMessageAction(messageId: string, scope: DeleteScope): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me || (scope !== "me" && scope !== "everyone")) return { ok: false };
  const ok = await deleteParentMessage(me.repos, getServiceVoiceStore(), me.household, messageId, scope).catch(() => false);
  revalidatePath("/p", "layout");
  return { ok };
}
