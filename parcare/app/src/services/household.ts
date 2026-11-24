// Deleting a household's data (G14: deletion on request; also used to reset the demo account).
// Works on both adapters: Supabase would cascade anyway, the memory adapter needs every table.

import type { Repos } from "@/data/repo";
import { NON_HOUSEHOLD_TABLES, TABLE_NAMES } from "@/data/types";
import type { VoiceStore } from "./voice";

/** Removes every row of one household, then the household itself. */
export async function deleteHouseholdData(repos: Repos, householdId: string): Promise<void> {
  // Children first (reverse foreign-key order).
  for (const name of [...TABLE_NAMES].reverse()) {
    // Also skips terms_agreements: the record of agreeing is kept (item 0, P-011).
    if (NON_HOUSEHOLD_TABLES.has(name)) continue;
    const table = repos[name] as unknown as {
      find(where: { householdId: string }): Promise<{ id: string }[]>;
      remove(id: string): Promise<void>;
    };
    for (const row of await table.find({ householdId })) await table.remove(row.id);
  }
  await repos.households.remove(householdId);
}

/** "Delete all our data" (G14, G15): every voice clip first, then every row. */
export async function deleteFamilyData(repos: Repos, voice: VoiceStore, userId: string): Promise<void> {
  const household = await repos.households.findOne({ childId: userId });
  if (household) {
    const householdId = household.id;
    const [responses, helper, reminders] = await Promise.all([
      repos.responses.find({ householdId }),
      repos.helperRequests.find({ householdId }),
      repos.childReminders.find({ householdId }),
    ]);
    for (const row of [...responses, ...helper, ...reminders]) {
      if (row.audioPath) await voice.remove(row.audioPath).catch(() => undefined);
    }
    // Voice replies between parent and child (P-030); both bubbles share one clip.
    const replyClips = new Set((await repos.chatMessages.find({ householdId, kind: "reply" })).flatMap((m) => (typeof m.data.audioPath === "string" ? [m.data.audioPath] : [])));
    for (const path of replyClips) await voice.remove(path).catch(() => undefined);
  }
  await deleteChildData(repos, userId);
}

/** Removes the child's household (if any) and profile. The login itself is kept. */
export async function deleteChildData(repos: Repos, userId: string): Promise<void> {
  const household = await repos.households.findOne({ childId: userId });
  if (household) {
    // households.managedParentId points at a parent profile that is about to go.
    await repos.households.update(household.id, { managedParentId: null });
    await deleteHouseholdData(repos, household.id);
  }
  await repos.profiles.remove(userId);
}
