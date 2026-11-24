import "server-only";
import { getAvatar } from "@/config/brand";
import { childMessages, visibleMessages } from "@/domain/chat";
import { hiddenForChild } from "@/services/child-messages";
import { appNow } from "@/domain/clock";
import { localTime } from "@/domain/time";
import type { CurrentChild } from "./access";
import { getRepos } from "./index";
import type { AlertRow, ChatMessageRow, DigestRow } from "./types";

export type CompanionChat = {
  now: Date;
  timeZone: string;
  /** Null until the parent picks a companion (parent app). */
  companion: { id: string; name: string; image: string } | null;
  parentPetName: string;
  childPetName: string;
  messages: ChatMessageRow[];
  digests: Map<string, DigestRow>;
  alerts: Map<string, AlertRow>;
};

/** Everything the chat list and the companion chat need, scoped to the child's household. */
export async function loadCompanionChat(child: CurrentChild): Promise<CompanionChat | null> {
  const { household, profile, parent } = child;
  if (!household) return null;
  const repos = await getRepos();
  const [messages, digests, alerts] = await Promise.all([
    repos.chatMessages.find({ householdId: household.id }),
    repos.digests.find({ householdId: household.id }),
    repos.alerts.find({ householdId: household.id }),
  ]);
  const now = appNow(household);
  const avatar = household.parentAvatarId ? getAvatar(household.parentAvatarId) : null;
  return {
    now,
    timeZone: profile?.timeZone ?? "UTC",
    companion: avatar ? { id: avatar.id, name: avatar.name, image: avatar.image } : null,
    parentPetName: parent?.petName ?? "",
    childPetName: profile?.petName || profile?.fullName || "",
    // "Delete for me" hides a bubble in the child's chat only (P-030).
    messages: visibleMessages(childMessages(messages), now).filter((m) => !hiddenForChild(m)),
    digests: new Map(digests.map((d) => [d.id, d])),
    alerts: new Map(alerts.map((a) => [a.id, a])),
  };
}

export function timeFormatter(timeZone: string) {
  return (iso: string) => localTime(new Date(iso), timeZone);
}
