// The parent's setup against the database: save-and-resume drafts and the final save.

import { TERMS_VERSION } from "@/config/terms";
import type { Repos } from "@/data/repo";
import type { AvatarId } from "@/config/brand";
import type { HouseholdRow, ParentProfileRow, SetupDraftRow } from "@/data/types";
import { consentedItems, type ParentSetupInput, validateParentSetup } from "@/domain/parent-setup";
import { ipFingerprint } from "./agreement";

const iso = (d: Date) => d.toISOString();

export async function getParentDraft(repos: Repos, householdId: string): Promise<SetupDraftRow | null> {
  return (await repos.setupDrafts.find({ householdId })).find((d) => d.audience === "parent") ?? null;
}

/** Save-and-resume after every step (the wizard's whole state, plus when she started). */
export async function saveParentDraft(repos: Repos, householdId: string, step: number, data: Record<string, unknown>, now: Date): Promise<void> {
  const draft = await getParentDraft(repos, householdId);
  if (!draft) {
    await repos.setupDrafts.insert({ householdId, audience: "parent", step, data: { startedAt: iso(now), ...data }, updatedAt: iso(now) });
    return;
  }
  await repos.setupDrafts.update(draft.id, { step, data: { ...draft.data, ...data }, updatedAt: iso(now) });
}

export type FinishResult = { ok: true; consented: number } | { ok: false; errors: Record<string, string> };

/**
 * Stores her setup: companion, her items (source "parent"), a consent for each item she said
 * Yes to (G1) with her sharing choice (G2), the reminder gaps, her terms tick (G10) and the
 * record of it, then tells both chats.
 */
export async function finishParentSetup(
  repos: Repos,
  household: HouseholdRow,
  parent: ParentProfileRow,
  input: ParentSetupInput,
  now: Date,
  ip: string | null,
): Promise<FinishResult> {
  const errors = validateParentSetup(input);
  if (Object.keys(errors).length > 0) return { ok: false, errors: errors as Record<string, string> };
  if (parent.setupCompletedAt) return { ok: true, consented: 0 };

  await repos.households.update(household.id, {
    parentAvatarId: input.companionId as AvatarId,
    gapAMinutes: input.gapAMinutes,
    gapBMinutes: input.gapBMinutes,
  });

  const chosen = consentedItems(input.items);
  for (const item of input.items.filter((i) => i.included)) {
    const meta = await repos.metaItems.insert({
      householdId: household.id,
      parentId: parent.id,
      label: item.label.trim(),
      checkinType: item.checkinType,
      localTime: item.localTime,
      onDate: null,
      source: "parent",
      createdAt: iso(now),
    });
    if (chosen.includes(item)) {
      await repos.consents.insert({
        householdId: household.id,
        metaItemId: meta.id,
        grantedAt: iso(now),
        revokedAt: null,
        shareInDigest: input.summaryToChild && item.share,
      });
    }
  }

  // One set of check-ins (P-028): the child's described items were only a starting point for her
  // list (the follow-up questions). Once she has her own list they go, so the family never sees
  // two lists. Items that already have a consent (older data) stay.
  const consentedIds = new Set((await repos.consents.find({ householdId: household.id })).map((c) => c.metaItemId));
  for (const m of await repos.metaItems.find({ householdId: household.id, source: "child" })) {
    if (!consentedIds.has(m.id)) await repos.metaItems.remove(m.id);
  }

  await repos.termsAcceptances.insert({ householdId: household.id, role: "parent", userId: null, termsVersion: TERMS_VERSION, acceptedAt: iso(now) });
  await repos.termsAgreements.insert({ userId: parent.id, termsVersion: TERMS_VERSION, acceptedAt: iso(now), ipHash: ipFingerprint(ip) });
  await repos.parentProfiles.update(parent.id, { setupCompletedAt: iso(now) });

  await repos.chatMessages.insertMany([
    { householdId: household.id, kind: "setup", direction: "in", audience: "parent", refId: null, data: {}, createdAt: iso(now), readAt: null },
    {
      householdId: household.id,
      kind: "setup",
      direction: "in",
      audience: "child",
      refId: null,
      data: { parentSetupDone: true, count: chosen.length },
      createdAt: iso(now),
      readAt: null,
    },
  ]);
  for (const d of await repos.setupDrafts.find({ householdId: household.id })) if (d.audience === "parent") await repos.setupDrafts.remove(d.id);
  return { ok: true, consented: chosen.length };
}
