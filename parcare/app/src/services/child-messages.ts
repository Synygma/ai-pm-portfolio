// "Delete for me" in the child's chat (P-030), the way their usual chat app does it for messages
// they received: the bubble is hidden in the CHILD's chat only. The parent's chat, the digest,
// alerts and the Helper list are not touched. (Everything still goes automatically at the end of
// the family's keeping period, G15.)

import type { Repos } from "@/data/repo";
import type { ChatMessageRow } from "@/data/types";

/** Hidden in the child's chat. */
export function hiddenForChild(msg: Pick<ChatMessageRow, "data">): boolean {
  return msg.data.hidden === true;
}

export async function hideChildMessage(repos: Repos, householdId: string, messageId: string): Promise<boolean> {
  const msg = await repos.chatMessages.get(messageId);
  // Only the child's own chat rows (older rows have no audience and are the child's).
  if (!msg || msg.householdId !== householdId || msg.audience === "parent") return false;
  await repos.chatMessages.update(msg.id, { data: { ...msg.data, hidden: true } });
  return true;
}
