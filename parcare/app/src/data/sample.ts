import "server-only";
import { DEMO_CHILD_EMAIL } from "@/config/demo";
import { getDataMode, getMemoryStore } from "./index";
import { buildSeed } from "./seed";

// Demo sample data in memory mode (no Supabase keys). Seed ids are fixed, so sessions stay valid.

/** Back to fresh sample data, keeping other logins and every agreement record. */
export function restoreMemorySample(): void {
  const store = getMemoryStore();
  const fresh = buildSeed({ now: new Date() });
  const seeded = new Set(fresh.authUsers.map((u) => u.email));
  fresh.authUsers.push(...store.snapshot.authUsers.filter((u) => !seeded.has(u.email)));
  // Agreement records are never deleted (P-011 item 0), not even by a demo reset.
  const known = new Set(fresh.termsAgreements.map((a) => a.id));
  fresh.termsAgreements.push(...store.snapshot.termsAgreements.filter((a) => !known.has(a.id)));
  store.replace(fresh);
}

/** After "Delete all our data" on the demo account, Demo login brings the sample back. */
export function ensureMemorySample(): void {
  if (getDataMode() !== "memory") return;
  const { snapshot } = getMemoryStore();
  const user = snapshot.authUsers.find((u) => u.email === DEMO_CHILD_EMAIL);
  if (!user || !snapshot.households.some((h) => h.childId === user.id)) restoreMemorySample();
}
