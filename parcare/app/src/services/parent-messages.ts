// Deleting a message in the parent's chat, the way her usual chat app does it (P-028):
// - "Delete for me": the bubble is hidden in HER chat only; nothing else changes.
// - "Delete for everyone": only for what SHE sent (a help request, a check-in answer). Her words and
//   voice clip are removed everywhere: her chat, the child's chat, the child's Helper list and any
//   evening summary that quoted them (G14 / G15: her data, deleted on request).
// Companion messages can only be deleted for her.

import type { Repos } from "@/data/repo";
import type { ChatMessageRow, HouseholdRow } from "@/data/types";
import { isMyVoiceReply } from "@/domain/replies";
import { deleteVoiceReply } from "./replies";
import type { VoiceStore } from "./voice";

export type DeleteScope = "me" | "everyone";

/** Messages that are hers: she can delete these for everyone. */
export function isHers(msg: Pick<ChatMessageRow, "kind" | "refId" | "direction" | "data">): boolean {
  if (msg.kind === "reply") return isMyVoiceReply(msg);
  return (msg.kind === "helper" || msg.kind === "answer") && msg.refId !== null;
}

/** Hidden in her chat ("Delete for me"). */
export function hiddenForHer(msg: Pick<ChatMessageRow, "data">): boolean {
  return msg.data.hidden === true;
}

export async function deleteParentMessage(repos: Repos, voice: VoiceStore, household: HouseholdRow, messageId: string, scope: DeleteScope): Promise<boolean> {
  const msg = await repos.chatMessages.get(messageId);
  if (!msg || msg.householdId !== household.id || msg.audience !== "parent") return false;

  if (scope === "me") {
    await repos.chatMessages.update(msg.id, { data: { ...msg.data, hidden: true } });
    return true;
  }
  if (!isHers(msg)) return false;
  if (msg.kind === "reply") return deleteVoiceReply(repos, voice, msg);
  if (!msg.refId) return false;
  const householdId = household.id;

  if (msg.kind === "helper") {
    const request = await repos.helperRequests.get(msg.refId);
    if (request && request.householdId === householdId) {
      if (request.audioPath) await voice.remove(request.audioPath).catch(() => undefined);
      await repos.helperRequests.remove(request.id);
    }
  } else {
    const response = await repos.responses.get(msg.refId);
    if (response && response.householdId === householdId) {
      if (response.audioPath) await voice.remove(response.audioPath).catch(() => undefined);
      // Evening summaries that quoted these words no longer do.
      for (const d of await repos.digests.find({ householdId })) {
        if (d.items.some((i) => i.responseId === response.id)) await repos.digests.update(d.id, { items: d.items.filter((i) => i.responseId !== response.id) });
      }
      await repos.responses.remove(response.id);
    }
  }
  // Every bubble about it, in both chats.
  for (const m of await repos.chatMessages.find({ householdId, refId: msg.refId })) await repos.chatMessages.remove(m.id);
  return true;
}
