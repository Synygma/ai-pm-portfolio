// Loads the fictional demo data into Supabase.   npm run seed:supabase
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local, and the migration
// supabase/migrations/0001_init.sql already run. Safe to re-run: it deletes the demo user first
// (which cascades to all of the demo household's rows) and creates everything again.

import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { DEMO_CHILD_EMAIL, DEMO_CHILD_PASSWORD } from "../src/config/demo";
import { buildSeed } from "../src/data/seed";
import { createSupabaseRepos } from "../src/data/supabase";
import { TABLE_NAMES } from "../src/data/types";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first (see README).");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  // 1. Remove the old demo user (cascades to profile -> household -> everything else).
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const old = list.users.find((u) => u.email === DEMO_CHILD_EMAIL);
  if (old) {
    const { error } = await supabase.auth.admin.deleteUser(old.id);
    if (error) throw error;
    console.log("Removed the previous demo user and its data.");
  }

  // 2. Create the demo login (fictional; password listed in the README).
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_CHILD_EMAIL,
    password: DEMO_CHILD_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("No user returned");

  // 3. Insert the seed rows table by table, in foreign-key order.
  const snapshot = buildSeed({ now: new Date(), childUserId: created.user.id, includeAuthUser: false });
  const repos = createSupabaseRepos(supabase);
  const household = snapshot.households[0];
  const managedParentId = household.managedParentId;

  for (const name of TABLE_NAMES) {
    const rows = snapshot[name] as { id: string }[];
    if (rows.length === 0) continue;
    // households.managed_parent_id points at parent_profiles, which do not exist yet.
    // Agreement records are never deleted (P-011), so an earlier run's row is still there: give
    // the new demo login's agreement a fresh id instead of the fixed seed id.
    const toInsert =
      name === "households"
        ? rows.map((r) => ({ ...r, managedParentId: null }))
        : name === "termsAgreements"
          ? rows.map((r) => ({ ...r, id: randomUUID() }))
          : rows;
    await (repos[name] as unknown as { insertMany(r: unknown[]): Promise<unknown[]> }).insertMany(toInsert);
    console.log(`  ${name}: ${rows.length}`);
  }
  await repos.households.update(household.id, { managedParentId });

  console.log(`Done. Log in as ${DEMO_CHILD_EMAIL} (password in README), or use "Demo login".`);
}

main().catch((err) => {
  console.error("Seeding failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
