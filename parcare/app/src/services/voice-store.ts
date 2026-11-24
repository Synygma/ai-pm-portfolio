import "server-only";
import { getDataMode } from "@/data";
import { createSupabaseServiceClient, createSupabaseUserClient } from "@/data/supabase-clients";
import { FileVoiceStore, SupabaseVoiceStore, type VoiceStore } from "./voice";

/** Voice store acting as the signed-in child (Supabase storage RLS applies). */
export async function getVoiceStore(): Promise<VoiceStore> {
  if (getDataMode() === "memory") return new FileVoiceStore();
  return new SupabaseVoiceStore(await createSupabaseUserClient());
}

/** Voice store for the tick (retention clean-up); bypasses RLS. */
export function getServiceVoiceStore(): VoiceStore {
  if (getDataMode() === "memory") return new FileVoiceStore();
  return new SupabaseVoiceStore(createSupabaseServiceClient());
}
