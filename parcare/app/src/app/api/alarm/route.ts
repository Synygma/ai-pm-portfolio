import { isDemoMode } from "@/config/env";
import { getRepos, getServiceRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { activeAlarms } from "@/domain/engine";
import { tickHousehold } from "@/services/checkins";
import { getServiceVoiceStore } from "@/services/voice-store";

// Polled by the open app (AlarmWatcher): is an alarm ringing for this child? Returns ids only.
// In demo mode there is no cron, so this also runs the tick for the child's household, which
// lets check-ins escalate in real time during a live demo.
export async function GET() {
  const child = await getCurrentChild();
  if (!child?.household) return Response.json({ active: [] }, { headers: { "Cache-Control": "no-store" } });
  const now = appNow(child.household);
  if (isDemoMode()) await tickHousehold(getServiceRepos(), child.household, now, getServiceVoiceStore());
  const alerts = await (await getRepos()).alerts.find({ householdId: child.household.id, ackAt: null });
  const active = activeAlarms(alerts, now).map((a) => ({ id: a.id, kind: a.kind }));
  return Response.json({ active }, { headers: { "Cache-Control": "no-store" } });
}
