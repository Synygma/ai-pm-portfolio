"use server";

import { revalidatePath } from "next/cache";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { childMessages, visibleMessages } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { isReaction } from "@/domain/replies";
import { hideChildMessage } from "@/services/child-messages";
import { deleteVoiceReply, reactToMessage, sendVoiceReply } from "@/services/replies";
import { getServiceVoiceStore } from "@/services/voice-store";
import { markReviewDone } from "@/services/review";

/** Review prompt (5.11): the child has checked with their parent. A plain form action. */
export async function markReviewDoneAction(alertId: string): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) return;
  await markReviewDone(await getRepos(), child.household.id, alertId, appNow(child.household));
  revalidatePath("/chat");
}

/**
 * "Delete for me" in the child's chat (P-030): nothing is deleted for the parent. "Delete for
 * everyone" only for the child's own voice replies (the clip and both bubbles go).
 */
export async function deleteChildMessageAction(messageId: string, scope: "me" | "everyone"): Promise<{ ok: boolean }> {
  const child = await getCurrentChild();
  if (!child?.household) return { ok: false };
  const repos = await getRepos();
  let ok = false;
  if (scope === "me") ok = await hideChildMessage(repos, child.household.id, messageId).catch(() => false);
  else if (scope === "everyone") {
    const msg = await repos.chatMessages.get(messageId);
    ok = !!msg && msg.householdId === child.household.id && msg.audience !== "parent" && msg.data.from === "child" && (await deleteVoiceReply(repos, getServiceVoiceStore(), msg).catch(() => false));
  }
  revalidatePath("/chat");
  revalidatePath("/home");
  return { ok };
}

/** 👍 / 👎 on one of the parent's bubbles (P-030); the same one again takes it back. */
export async function reactChildAction(messageId: string, reaction: string): Promise<{ ok: boolean }> {
  const child = await getCurrentChild();
  if (!child?.household || !isReaction(reaction)) return { ok: false };
  const ok = await reactToMessage(await getRepos(), child.household, "child", messageId, reaction, appNow(child.household)).catch(() => false);
  revalidatePath("/chat");
  return { ok };
}

async function audioOf(formData: FormData) {
  const file = formData.get("audio");
  return file instanceof File && file.size > 0 ? { data: new Uint8Array(await file.arrayBuffer()), type: file.type || "audio/webm" } : null;
}

/** The child's own voice reply to one of the parent's bubbles (P-030). */
export async function voiceReplyChildAction(messageId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const child = await getCurrentChild();
  const audio = await audioOf(formData);
  if (!child?.household || !audio) return { ok: false, error: "audio" };
  const r = await sendVoiceReply(await getRepos(), getServiceVoiceStore(), child.household, "child", messageId, audio, appNow(child.household)).catch(() => ({ ok: false as const, error: "failed" }));
  revalidatePath("/chat");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/** Marks the companion chat's incoming messages as read (opening the chat). */
export async function markChatReadAction(): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) return;
  const repos = await getRepos();
  const now = appNow(child.household);
  const messages = visibleMessages(childMessages(await repos.chatMessages.find({ householdId: child.household.id, readAt: null })), now);
  await Promise.all(
    messages.filter((m) => m.direction === "in").map((m) => repos.chatMessages.update(m.id, { readAt: now.toISOString() })),
  );
  revalidatePath("/home");
}
