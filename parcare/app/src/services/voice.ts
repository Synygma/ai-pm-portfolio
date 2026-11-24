// Short voice clips (reminders now; parent answers and helper requests in the parent app).
// Supabase: private "voice" bucket, files at "<household_id>/<id>.<ext>", short-lived signed
// URLs (RLS on storage.objects). Memory mode: files under .data/voice, served by /api/voice only
// to the signed-in child of that household. Retention: 30 days (G15), see purgeOldVoice().

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VOICE_RETENTION_DAYS } from "@/config/terms";
import type { Repos } from "@/data/repo";

export interface VoiceStore {
  save(householdId: string, id: string, data: Uint8Array, ext: string, contentType: string): Promise<string>;
  /** A URL the browser can play for a short time. */
  playUrl(storagePath: string): Promise<string | null>;
  remove(storagePath: string): Promise<void>;
}

const SAFE_SEGMENT = /^[0-9a-f-]{36}$/;
const SAFE_FILE = /^[0-9a-f-]{36}\.(webm|ogg|m4a)$/;

/** "<uuid>/<uuid>.<ext>" only: no "..", no slashes beyond the one separator. */
export function isSafeVoicePath(storagePath: string): boolean {
  const parts = storagePath.split("/");
  return parts.length === 2 && SAFE_SEGMENT.test(parts[0]) && SAFE_FILE.test(parts[1]);
}

export const VOICE_DIR = path.join(process.cwd(), ".data", "voice");

export class FileVoiceStore implements VoiceStore {
  constructor(private readonly dir = VOICE_DIR) {}

  async save(householdId: string, id: string, data: Uint8Array, ext: string): Promise<string> {
    const storagePath = `${householdId}/${id}.${ext}`;
    if (!isSafeVoicePath(storagePath)) throw new Error("Unsafe voice path");
    mkdirSync(/*turbopackIgnore: true*/ path.join(this.dir, householdId), { recursive: true });
    writeFileSync(/*turbopackIgnore: true*/ path.join(this.dir, storagePath), data);
    return storagePath;
  }

  async playUrl(storagePath: string): Promise<string | null> {
    return isSafeVoicePath(storagePath) ? `/api/voice/${storagePath}` : null;
  }

  read(storagePath: string): Buffer | null {
    if (!isSafeVoicePath(storagePath)) return null;
    try {
      return readFileSync(/*turbopackIgnore: true*/ path.join(this.dir, storagePath));
    } catch {
      return null;
    }
  }

  async remove(storagePath: string): Promise<void> {
    if (isSafeVoicePath(storagePath)) rmSync(/*turbopackIgnore: true*/ path.join(this.dir, storagePath), { force: true });
  }
}

export class SupabaseVoiceStore implements VoiceStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private readonly client: SupabaseClient<any, any, any>) {}

  async save(householdId: string, id: string, data: Uint8Array, ext: string, contentType: string): Promise<string> {
    const storagePath = `${householdId}/${id}.${ext}`;
    const { error } = await this.client.storage.from("voice").upload(storagePath, data, { contentType, upsert: false });
    if (error) throw new Error(`Voice upload failed: ${error.message}`);
    return storagePath;
  }

  async playUrl(storagePath: string): Promise<string | null> {
    const { data } = await this.client.storage.from("voice").createSignedUrl(storagePath, 60 * 60);
    return data?.signedUrl ?? null;
  }

  async remove(storagePath: string): Promise<void> {
    await this.client.storage.from("voice").remove([storagePath]);
  }
}

/** G15: voice clips older than the family's chosen period (at most 30 days) are deleted. */
export async function purgeOldVoice(repos: Repos, store: VoiceStore, householdId: string, now: Date, days: number = VOICE_RETENTION_DAYS): Promise<number> {
  const cutoff = now.getTime() - Math.min(days, VOICE_RETENTION_DAYS) * 24 * 3600000;
  let removed = 0;
  const old = <T extends { audioPath: string | null; createdAt: string }>(rows: T[]) =>
    rows.filter((r) => r.audioPath && new Date(r.createdAt).getTime() < cutoff);
  for (const r of old(await repos.childReminders.find({ householdId }))) {
    await store.remove(r.audioPath!);
    await repos.childReminders.update(r.id, { audioPath: null });
    removed++;
  }
  for (const r of old(await repos.responses.find({ householdId }))) {
    await store.remove(r.audioPath!);
    await repos.responses.update(r.id, { audioPath: null });
    removed++;
  }
  for (const r of old(await repos.helperRequests.find({ householdId }))) {
    await store.remove(r.audioPath!);
    await repos.helperRequests.update(r.id, { audioPath: null });
    removed++;
  }
  return removed;
}
