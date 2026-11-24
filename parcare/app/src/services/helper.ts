// Helper list (5.8): the parent's non-urgent requests. New -> Seen (when the child opens the
// list) -> Done (child marks it). The screen shows no way back from Done.

import { randomUUID } from "node:crypto";
import type { Repos } from "@/data/repo";
import type { HelperRequestRow, HouseholdRow } from "@/data/types";
import { findEmergencyWord } from "@/domain/emergency";
import { AUDIO_TYPES, MAX_AUDIO_BYTES } from "@/domain/reminders";
import { translator } from "@/i18n/translator";
import { parentPetName, raiseAlert } from "./alerts";
import { sendPushToHousehold } from "./push";
import type { VoiceStore } from "./voice";

const iso = (d: Date) => d.toISOString();

export async function markHelperSeen(repos: Repos, householdId: string, now: Date): Promise<number> {
  const fresh = (await repos.helperRequests.find({ householdId, status: "new" })).filter((r) => new Date(r.createdAt) <= now);
  for (const r of fresh) await repos.helperRequests.update(r.id, { status: "seen", updatedAt: iso(now) });
  for (const m of await repos.chatMessages.find({ householdId, kind: "helper", readAt: null })) {
    // The child's chat only: the parent's own "request sent" bubble is hers.
    if (m.audience !== "parent" && new Date(m.createdAt) <= now) await repos.chatMessages.update(m.id, { readAt: iso(now) });
  }
  return fresh.length;
}

export async function setHelperDone(repos: Repos, householdId: string, id: string, done: boolean, now: Date): Promise<boolean> {
  const r = await repos.helperRequests.get(id);
  if (!r || r.householdId !== householdId) return false;
  await repos.helperRequests.update(id, { status: done ? "done" : "seen", updatedAt: iso(now) });
  return true;
}

export const MAX_HELP_TEXT = 500;

export type HelpInput = { text: string; audio: { data: Uint8Array; type: string } | null };
export type HelpResult =
  | { ok: true; request: HelperRequestRow; emergency: boolean }
  | { ok: false; error: "empty" | "tooLong" | "audio" };

/**
 * The parent asks for help in her app (handoff 7.7, PLAN-PARENT P4): her words and/or a short
 * voice note go to the child's Helper list. Not for emergencies: an emergency word in her words
 * raises the child's distinct alarm and her app shows PAUSE (G5). No booking, no vendors.
 */
export async function createParentHelpRequest(repos: Repos, voice: VoiceStore, household: HouseholdRow, input: HelpInput, now: Date): Promise<HelpResult> {
  const text = input.text.trim();
  if (!text && !input.audio) return { ok: false, error: "empty" };
  if (text.length > MAX_HELP_TEXT) return { ok: false, error: "tooLong" };
  const mime = input.audio?.type.split(";")[0] ?? "";
  if (input.audio && (!AUDIO_TYPES[mime] || input.audio.data.byteLength === 0 || input.audio.data.byteLength > MAX_AUDIO_BYTES)) return { ok: false, error: "audio" };

  const id = randomUUID();
  const audioPath = input.audio ? await voice.save(household.id, id, input.audio.data, AUDIO_TYPES[mime], mime) : null;
  const request = await repos.helperRequests.insert({ id, householdId: household.id, text, audioPath, status: "new", createdAt: iso(now), updatedAt: iso(now) });
  await repos.chatMessages.insertMany([
    { householdId: household.id, kind: "helper", direction: "in", audience: "child", refId: request.id, data: {}, createdAt: iso(now), readAt: null },
    { householdId: household.id, kind: "helper", direction: "in", audience: "parent", refId: request.id, data: {}, createdAt: iso(now), readAt: iso(now) },
  ]);

  if (findEmergencyWord(text)) {
    await raiseAlert(repos, household.id, "emergency_word", now, { data: { source: "helper" } });
    return { ok: true, request, emergency: true };
  }
  const petName = await parentPetName(repos, household.id);
  await sendPushToHousehold(repos, household.id, {
    title: translator("push")("noticeTitle"),
    body: translator("bubbles")("helper", { petName }),
    url: "/helper",
    tag: `helper-${request.id}`,
  });
  return { ok: true, request, emergency: false };
}
