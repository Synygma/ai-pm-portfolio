import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig, supabaseServiceKey } from "@/config/env";

/** Per-request client acting as the signed-in user (row-level security applies). */
export async function createSupabaseUserClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. The proxy refreshes them.
        }
      },
    },
  });
}

/** Service-role client: bypasses RLS. Server only, for /api/tick and seeding. */
export function createSupabaseServiceClient() {
  const config = supabaseConfig();
  const serviceKey = supabaseServiceKey();
  if (!config || !serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(config.url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
