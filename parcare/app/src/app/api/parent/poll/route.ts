import { isDemoMode } from "@/config/env";
import { getCurrentParent } from "@/data/parent-access";
import { visibleMessages } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { parentMessages } from "@/domain/parent-chat";
import { tickHousehold } from "@/services/checkins";
import { openCheckin } from "@/services/parent-checkins";
import { getServiceVoiceStore } from "@/services/voice-store";

// Polled by the open parent app (ParentWatcher): is a check-in ringing (prompt 2) or a child's
// voice reminder, and what is the newest message in her chat? Ids only. In demo mode there is no cron, so this also runs the tick
// for her household (like the child's /api/alarm), so prompts arrive in real time.
export async function GET() {
  const me = await getCurrentParent();
  const headers = { "Cache-Control": "no-store" };
  if (!me) return Response.json({ ringing: false, reminder: false, latest: null }, { headers });
  const now = appNow(me.household);
  if (isDemoMode()) await tickHousehold(me.repos, me.household, now, getServiceVoiceStore());
  const open = await openCheckin(me.repos, me.household.id);
  const messages = visibleMessages(parentMessages(await me.repos.chatMessages.find({ householdId: me.household.id })), now);
  const reminder = (await me.repos.childReminders.find({ householdId: me.household.id, status: "ringing" })).length > 0;
  return Response.json({ ringing: open?.status === "prompted2", reminder, latest: messages.at(-1)?.id ?? null }, { headers });
}
