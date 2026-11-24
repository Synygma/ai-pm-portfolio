import "server-only";
import { supabaseConfig, supabaseServiceKey } from "@/config/env";
import { createMemoryRepos, loadSnapshotFile, MemoryStore, saveSnapshotFile } from "./memory";
import type { DataMode, Repos } from "./repo";
import { buildSeed } from "./seed";
import { createSupabaseRepos } from "./supabase";
import { createSupabaseServiceClient, createSupabaseUserClient } from "./supabase-clients";

export type { DataMode, Repos } from "./repo";

/** Supabase when its URL and anon key are set; otherwise the in-memory database. */
export function getDataMode(): DataMode {
  return supabaseConfig() ? "supabase" : "memory";
}

const globalForDb = globalThis as unknown as { __parcareMemory?: MemoryStore };

/** One memory store per server process (kept on globalThis so dev hot-reload does not wipe it). */
export function getMemoryStore(): MemoryStore {
  if (!globalForDb.__parcareMemory) {
    // DEV_DB_FILE=off (used by Playwright) keeps the data in memory only, fresh on every start.
    const persist = process.env.NODE_ENV === "development" && process.env.DEV_DB_FILE !== "off";
    const fromFile = persist ? loadSnapshotFile() : null;
    const snapshot = fromFile ?? buildSeed({ now: new Date() });
    const store = new MemoryStore(snapshot, persist ? (s) => saveSnapshotFile(s) : undefined);
    if (persist && !fromFile) saveSnapshotFile(snapshot);
    globalForDb.__parcareMemory = store;
  }
  return globalForDb.__parcareMemory;
}

/** Repositories for the current request, acting as the signed-in user. */
export async function getRepos(): Promise<Repos> {
  if (getDataMode() === "memory") return createMemoryRepos(getMemoryStore());
  return createSupabaseRepos(await createSupabaseUserClient());
}

/** Repositories that bypass row-level security: only for /api/tick, demo tools and seeding. */
export function getServiceRepos(): Repos {
  if (getDataMode() === "memory") return createMemoryRepos(getMemoryStore());
  if (!supabaseServiceKey()) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createSupabaseRepos(createSupabaseServiceClient());
}
