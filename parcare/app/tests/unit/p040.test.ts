// P-040: she can add a check-in herself, in her setup (when the voice reader missed one, or she
// skipped speaking) and later in her Settings. Adding it is her Yes (G1) with her sharing choice (G2).
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { HouseholdRow, ParentProfileRow } from "@/data/types";
import { bubbleLines } from "@/domain/chat";
import { activeConsents } from "@/domain/engine";
import { cleanNewCheckin, validateParentSetup } from "@/domain/parent-setup";
import { replyAbout } from "@/domain/replies";
import { tickHousehold } from "@/services/checkins";
import { finishParentSetup } from "@/services/parent-setup";
import { addMyCheckin, listMyCheckins } from "@/services/parent-settings";

const NOW = new Date("2026-11-12T04:00:00Z"); // 09:30 in Lucknow

function setup() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { snap, repos, household: snap.households[0] as HouseholdRow, parent: snap.parentProfiles[0] as ParentProfileRow };
}

describe("a check-in she adds by hand", () => {
  it("is cleaned and checked: words required (up to 80), a known kind, a real time or none", () => {
    expect(cleanNewCheckin({ label: "  Thyroid tablet ", checkinType: "medicine", localTime: "07:15" })).toEqual({ label: "Thyroid tablet", checkinType: "medicine", localTime: "07:15" });
    expect(cleanNewCheckin({ label: "Call my sister", checkinType: "social", localTime: "" })).toEqual({ label: "Call my sister", checkinType: "social", localTime: null });
    expect(cleanNewCheckin({ label: "   ", checkinType: "medicine", localTime: "07:15" })).toBeNull();
    expect(cleanNewCheckin({ label: "x".repeat(81), checkinType: "medicine", localTime: null })).toBeNull();
    expect(cleanNewCheckin({ label: "Tablet", checkinType: "dancing", localTime: null })).toBeNull();
    expect(cleanNewCheckin({ label: "Tablet", checkinType: "medicine", localTime: "25:00" })).toBeNull();
  });

  it("in Settings: stored as her item, turned on with her sharing choice, planned, and the child is told", async () => {
    const { repos, household, parent } = setup();
    expect(await addMyCheckin(repos, household, parent, { label: "Thyroid tablet", checkinType: "medicine", localTime: "07:15" }, false, NOW)).toBe(true);
    const meta = (await repos.metaItems.find({ householdId: household.id, label: "Thyroid tablet" }))[0];
    expect(meta.source).toBe("parent");
    const consent = activeConsents(await repos.consents.find({ householdId: household.id, metaItemId: meta.id }), NOW);
    expect(consent).toHaveLength(1);
    expect(consent[0].shareInDigest).toBe(false);

    const mine = await listMyCheckins(repos, household, parent, NOW);
    expect(mine.find((m) => m.metaItemId === meta.id)).toMatchObject({ on: true, shared: false, localTime: "07:15" });

    await tickHousehold(repos, household, NOW);
    const planned = await repos.checkins.find({ householdId: household.id, metaItemId: meta.id, status: "scheduled" });
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((c) => c.dueAt.endsWith("T01:45:00.000Z"))).toBe(true); // 07:15 in Lucknow

    const told = (await repos.chatMessages.find({ householdId: household.id, kind: "setup" })).find((m) => m.data.checkinAdded);
    expect(told?.audience).toBe("child");
    expect(bubbleLines(told!, { childPetName: "Gudiya", parentPetName: "Maa", companionName: "Vidya", formatTime: () => "" } as never)).toEqual([
      { key: "parentCheckinAdded", values: { parentPetName: "Maa", label: "Thyroid tablet", time: "07:15" } },
    ]);
    expect(replyAbout(told!, "child")).toEqual({ about: "setup", label: "" });
  });

  it("refuses an empty one and stores nothing", async () => {
    const { repos, household, parent } = setup();
    const before = (await repos.metaItems.find({ householdId: household.id })).length;
    expect(await addMyCheckin(repos, household, parent, { label: "", checkinType: "medicine", localTime: "07:15" }, true, NOW)).toBe(false);
    expect((await repos.metaItems.find({ householdId: household.id })).length).toBe(before);
  });

  it("in setup: she may skip speaking and finish with an empty list (nothing is checked)", async () => {
    const { snap, repos, household, parent } = setup();
    snap.parentProfiles[0] = { ...parent, setupCompletedAt: null };
    for (const c of await repos.consents.find({ householdId: household.id })) await repos.consents.remove(c.id);
    const input = { companionId: "vidya", items: [], summaryToChild: true, gapAMinutes: 10, gapBMinutes: 15, termsAccepted: true };
    expect(validateParentSetup(input)).toEqual({});
    expect(await finishParentSetup(repos, household, snap.parentProfiles[0], input, NOW, null)).toEqual({ ok: true, consented: 0 });
    expect(activeConsents(await repos.consents.find({ householdId: household.id }), NOW)).toHaveLength(0);
  });
});
