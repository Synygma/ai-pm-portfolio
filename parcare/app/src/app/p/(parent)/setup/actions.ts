"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { extractMetaListSafely } from "@/ai";
import { getCurrentParent } from "@/data/parent-access";
import { appNow } from "@/domain/clock";
import { followUpQuestions, type ParentItem, type ParentSetupInput } from "@/domain/parent-setup";
import { clientIp } from "@/services/agreement";
import { finishParentSetup, saveParentDraft } from "@/services/parent-setup";

export type FollowUp = { label: string; checkinType: ParentItem["checkinType"]; localTime: string | null };

/** Save-and-resume: the wizard's state after each step. */
export async function saveParentDraftAction(step: number, data: Record<string, unknown>): Promise<{ ok: boolean }> {
  const me = await getCurrentParent();
  if (!me || me.parent.setupCompletedAt) return { ok: false };
  try {
    await saveParentDraft(me.repos, me.household.id, step, JSON.parse(JSON.stringify(data)) as Record<string, unknown>, appNow(me.household));
  } catch (err) {
    console.error("parent setup: draft not saved", err instanceof Error ? err.message : err);
    return { ok: false };
  }
  return { ok: true };
}

/**
 * B: her day in her own words -> what the companion understood (A2), plus up to 3 follow-up
 * questions about items her child mentioned that she did not (A3, G4). Fictional data only goes
 * to Gemini; without a key the rule-based provider is used.
 */
export async function understandDayAction(
  transcript: string,
): Promise<{ ok: true; items: ParentItem[]; followUps: FollowUp[]; fellBack: boolean } | { ok: false; reason: "empty" | "signedOut" }> {
  const text = transcript.trim().slice(0, 4000);
  if (!text) return { ok: false, reason: "empty" };
  const me = await getCurrentParent();
  if (!me) return { ok: false, reason: "signedOut" };
  const { items, fellBack } = await extractMetaListSafely(text, { parentPetName: me.parent.petName });
  const childItems = (await me.repos.metaItems.find({ householdId: me.household.id, parentId: me.parent.id })).filter((m) => m.source === "child");
  const followUps = followUpQuestions(items, childItems).map((c) => ({ label: c.label, checkinType: c.checkinType, localTime: c.localTime }));
  return {
    ok: true,
    items: items.map((i) => ({ ...i, included: true, consent: false, share: true })),
    followUps,
    fellBack,
  };
}

/** Last step: everything is checked again on the server, then stored. */
export async function finishParentSetupAction(input: ParentSetupInput): Promise<{ ok: false; errors: Record<string, string> } | void> {
  const me = await getCurrentParent();
  if (!me) redirect("/parent");
  const result = await finishParentSetup(me.repos, me.household, me.parent, input, appNow(me.household), clientIp(await headers()));
  if (!result.ok) return result;
  redirect("/p");
}
