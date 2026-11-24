// How long a family's words are kept (P-011 item 3, G14/G15). After the period the family chose
// (8 days, 15 days or a month; never longer than a month) the tick deletes:
// - voice clips (the parent's, and the child's own reminder recordings),
// - the parent's words: check-in answers (transcripts) and help requests,
// - daily digests (with their feedback and chat bubbles),
// - reactions and voice replies between parent and child (with their clips).
// Kept until "Delete all our data": details, check-in items and consents, check-in times and
// statuses, alerts, reminders, the emergency contact. Kept always: the terms agreement record.

import { VOICE_RETENTION_DAYS } from "@/config/terms";
import type { Repos } from "@/data/repo";
import type { HouseholdRow } from "@/data/types";
import { purgeOldVoice, type VoiceStore } from "./voice";

export type PurgeResult = { voice: number; words: number; digests: number };

export function retentionCutoff(days: number, now: Date): number {
  return now.getTime() - Math.min(days, VOICE_RETENTION_DAYS) * 24 * 3600000;
}

/**
 * `voice` given = clips can be removed too. Without it, rows that still have a clip are left for
 * the next tick that has the voice store (so a clip is never orphaned in storage).
 */
export async function purgeOldData(repos: Repos, household: Pick<HouseholdRow, "id" | "retentionDays">, now: Date, voice?: VoiceStore): Promise<PurgeResult> {
  const householdId = household.id;
  const days = household.retentionDays ?? VOICE_RETENTION_DAYS;
  const cutoff = retentionCutoff(days, now);
  const old = (iso: string) => new Date(iso).getTime() < cutoff;
  const result: PurgeResult = { voice: 0, words: 0, digests: 0 };
  if (voice) result.voice = await purgeOldVoice(repos, voice, householdId, now, days);

  for (const r of await repos.responses.find({ householdId })) {
    if (!old(r.createdAt) || r.audioPath) continue;
    // Her answer bubble in the parent app's chat goes with it.
    for (const m of await repos.chatMessages.find({ householdId, refId: r.id })) await repos.chatMessages.remove(m.id);
    await repos.responses.remove(r.id);
    result.words++;
  }
  for (const h of await repos.helperRequests.find({ householdId })) {
    if (!old(h.createdAt) || h.audioPath) continue;
    for (const m of await repos.chatMessages.find({ householdId, refId: h.id })) await repos.chatMessages.remove(m.id);
    await repos.helperRequests.remove(h.id);
    result.words++;
  }
  // Reactions and voice replies (P-030): a bubble with a clip waits for a tick with the voice store.
  for (const m of await repos.chatMessages.find({ householdId, kind: "reply" })) {
    if (!old(m.createdAt)) continue;
    const clip = typeof m.data.audioPath === "string" ? m.data.audioPath : null;
    if (clip && !voice) continue;
    if (clip) await voice!.remove(clip).catch(() => undefined);
    await repos.chatMessages.remove(m.id);
    result.words++;
  }
  for (const d of await repos.digests.find({ householdId })) {
    if (!old(d.sentAt)) continue;
    for (const f of await repos.digestFeedback.find({ householdId, digestId: d.id })) await repos.digestFeedback.remove(f.id);
    for (const m of await repos.chatMessages.find({ householdId, refId: d.id })) await repos.chatMessages.remove(m.id);
    await repos.digests.remove(d.id);
    result.digests++;
  }
  return result;
}
