import { describe, expect, it } from "vitest";
import { TERMS_VERSION } from "@/config/terms";
import { createMemoryRepos, emptySnapshot, MemoryStore } from "@/data/memory";
import { hashInviteToken } from "@/domain/invite";
import {
  canFinishSetup,
  type ChildInput,
  decideEmergencyContact,
  inviteUrl,
  type ParentInput,
  shareLink,
  validateChild,
  validateDayItems,
  validateParents,
} from "@/domain/setup";
import { deleteChildData } from "@/services/household";
import {
  createParentInvite,
  finishSetup,
  getSetupState,
  markStepDone,
  saveChildStep,
  saveDayStep,
  saveEmergencyStep,
  saveParentsStep,
} from "@/services/setup";

const NOW = new Date("2026-11-05T10:00:00Z");
const USER = { id: "11111111-1111-4111-8111-111111111111", email: "fictional.child@example.com" };
const CHILD: ChildInput = { fullName: "Asha Rao", petName: "Chinni", country: "United Kingdom", city: "Leeds", age: 38, timeZone: "Europe/London" };
const PARENT: ParentInput = { name: "Lakshmi Rao", petName: "Amma", gender: "female", age: 70, country: "India", city: "Pune", timeZone: "Asia/Kolkata" };

function repos() {
  return createMemoryRepos(new MemoryStore(emptySnapshot()));
}

async function throughParents() {
  const r = repos();
  let household = await saveChildStep(r, USER, CHILD, NOW);
  await saveParentsStep(r, household, { parents: [PARENT], managedIndex: 0 }, NOW);
  household = (await r.households.get(household.id))!;
  return { r, household };
}

describe("setup validation", () => {
  it("requires the child's name, country, city and a real time zone", () => {
    expect(validateChild(CHILD)).toEqual({});
    expect(validateChild({ ...CHILD, fullName: " ", timeZone: "Mars/Base", age: 12 })).toEqual({ fullName: "required", timeZone: "timeZone", age: "age" });
  });

  it("accepts one or two parents and needs one managed parent", () => {
    expect(validateParents({ parents: [PARENT], managedIndex: 0 })).toEqual({});
    expect(validateParents({ parents: [PARENT, { ...PARENT, petName: "" }], managedIndex: 1 })).toEqual({ "1.petName": "required" });
    expect(validateParents({ parents: [PARENT], managedIndex: 1 })).toEqual({ managedIndex: "required" });
    expect(validateParents({ parents: [], managedIndex: 0 }).parents).toBe("required");
  });

  it("needs at least one ticked check-in with valid time", () => {
    expect(validateDayItems([{ label: "Walk", checkinType: "physical_activity", localTime: "06:30", included: false }])).toEqual({ items: "noItems" });
    expect(validateDayItems([{ label: "Walk", checkinType: "physical_activity", localTime: "6.30", included: true }])).toEqual({ "0.localTime": "time" });
  });
});

describe("emergency contact is not stored without Yes (G7)", () => {
  it("decides store / do not store / skip", () => {
    expect(decideEmergencyContact({ choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: true })).toEqual({ action: "store", name: "Mrs. Iyer", phone: "+91 00000 11111" });
    expect(decideEmergencyContact({ choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: false })).toEqual({ action: "doNotStore", reason: "notTold" });
    expect(decideEmergencyContact({ choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: null })).toMatchObject({ action: "invalid", errors: { told: "required" } });
    expect(decideEmergencyContact({ choice: "add", name: "", phone: "abc", told: true })).toMatchObject({ action: "invalid", errors: { name: "required", phone: "phone" } });
    expect(decideEmergencyContact({ choice: "skip" })).toEqual({ action: "skip" });
  });

  it("keeps no trace of the name or phone when the answer is No", async () => {
    const { r, household } = await throughParents();
    await saveEmergencyStep(r, household.id, { choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: false }, NOW);
    expect(await r.emergencyContacts.find({ householdId: household.id })).toEqual([]);
    const draft = await r.setupDrafts.findOne({ householdId: household.id });
    expect(JSON.stringify(draft)).not.toContain("Iyer");
    expect(JSON.stringify(draft)).not.toContain("11111");
  });

  it("stores the contact with the confirmation time when the answer is Yes", async () => {
    const { r, household } = await throughParents();
    await saveEmergencyStep(r, household.id, { choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: true }, NOW);
    expect(await r.emergencyContacts.find({ householdId: household.id })).toEqual([
      expect.objectContaining({ name: "Mrs. Iyer", phone: "+91 00000 11111", confirmedToldAt: NOW.toISOString() }),
    ]);
  });
});

describe("T&C gating (G10)", () => {
  it("cannot finish without the tick, or before the earlier steps", () => {
    expect(canFinishSetup({ termsAccepted: false, hasProfile: true, hasManagedParent: true })).toEqual({ ok: false, reason: "termsRequired" });
    expect(canFinishSetup({ termsAccepted: true, hasProfile: true, hasManagedParent: false })).toEqual({ ok: false, reason: "incomplete" });
    expect(canFinishSetup({ termsAccepted: true, hasProfile: true, hasManagedParent: true })).toEqual({ ok: true });
  });

  it("records nothing when finishing without the tick", async () => {
    const { r, household } = await throughParents();
    expect(await finishSetup(r, household, USER.id, false, NOW)).toEqual({ ok: false, reason: "termsRequired" });
    expect(await r.termsAcceptances.find({ householdId: household.id })).toEqual([]);
    expect((await r.households.get(household.id))?.setupCompletedAt).toBeNull();
  });

  it("with the tick: records acceptance + version, review prompts at +1 and +2 weeks, the first bubble", async () => {
    const { r, household } = await throughParents();
    expect(await finishSetup(r, household, USER.id, true, NOW)).toEqual({ ok: true });
    expect(await r.termsAcceptances.find({ householdId: household.id })).toEqual([
      expect.objectContaining({ role: "child", userId: USER.id, termsVersion: TERMS_VERSION, acceptedAt: NOW.toISOString() }),
    ]);
    const prompts = await r.reviewPrompts.find({ householdId: household.id });
    expect(prompts.map((p) => [p.audience, p.dueAt]).sort()).toEqual([
      ["child", "2026-11-12T10:00:00.000Z"],
      ["parent", "2026-11-19T10:00:00.000Z"],
    ]);
    expect(await r.chatMessages.find({ householdId: household.id, kind: "setup" })).toHaveLength(1);
    expect((await r.households.get(household.id))?.setupCompletedAt).toBe(NOW.toISOString());
  });
});

describe("save-and-resume", () => {
  it("creates the profile and household with defaults, and remembers progress", async () => {
    const r = repos();
    expect((await getSetupState(r, USER.id)).completed).toBe(0);
    const household = await saveChildStep(r, USER, CHILD, NOW);
    expect(household).toMatchObject({ childId: USER.id, gapAMinutes: 10, gapBMinutes: 20, digestLocalTime: "19:00", parentAvatarId: null });
    expect((await getSetupState(r, USER.id)).completed).toBe(1);

    await saveParentsStep(r, household, { parents: [PARENT, { ...PARENT, name: "Ravi Rao", petName: "Appa", gender: "male" }], managedIndex: 1 }, NOW);
    await markStepDone(r, household.id, "howItWorks", NOW);
    await markStepDone(r, household.id, "introduce", NOW);
    const state = await getSetupState(r, USER.id);
    expect(state.completed).toBe(4);
    expect(state.child).toEqual(CHILD);
    expect(state.parents.map((p) => p.petName)).toEqual(["Amma", "Appa"]);
    expect(state.managedIndex).toBe(1);
    const parents = await r.parentProfiles.find({ householdId: household.id });
    expect(parents.filter((p) => p.managed).map((p) => p.petName)).toEqual(["Appa"]);
  });

  it("saves the day as meta items for the managed parent, with no consents (G1)", async () => {
    const { r, household } = await throughParents();
    await saveDayStep(
      r,
      household,
      [
        { label: "Morning walk", checkinType: "physical_activity", localTime: "06:30", included: true },
        { label: "Puja", checkinType: "puja", localTime: "18:30", included: false },
      ],
      "Amma walks at 6:30.",
      NOW,
    );
    const items = await r.metaItems.find({ householdId: household.id });
    expect(items).toEqual([expect.objectContaining({ label: "Morning walk", parentId: household.managedParentId, source: "child" })]);
    expect(await r.consents.find({ householdId: household.id })).toEqual([]);
    const state = await getSetupState(r, USER.id);
    expect(state.day.transcript).toBe("Amma walks at 6:30.");
    expect(state.completed).toBe(5);

    // Saving again replaces the list.
    await saveDayStep(r, household, [{ label: "Evening puja", checkinType: "puja", localTime: "18:30", included: true }], "x", NOW);
    expect((await r.metaItems.find({ householdId: household.id })).map((m) => m.label)).toEqual(["Evening puja"]);
  });
});

describe("parent invite (one-time, hash only)", () => {
  it("stores only the SHA-256 of the token, with a 7-day expiry, and replaces unused invites", async () => {
    const { r, household } = await throughParents();
    const first = await createParentInvite(r, household.id, NOW);
    const second = await createParentInvite(r, household.id, NOW);
    const stored = await r.parentInvites.find({ householdId: household.id });
    expect(stored).toHaveLength(1);
    expect(stored[0].tokenHash).toBe(hashInviteToken(second.token));
    expect(stored[0].tokenHash).not.toBe(hashInviteToken(first.token));
    expect(JSON.stringify(stored)).not.toContain(second.token);
    expect(stored[0].expiresAt).toBe("2026-11-12T10:00:00.000Z");
    expect(second.token.length).toBeGreaterThanOrEqual(40);
  });

  it("builds the invite and share links (no chat-app name in the app)", () => {
    expect(inviteUrl("http://localhost:3000/", "abc")).toBe("http://localhost:3000/p/abc");
    expect(shareLink("Hi Amma: http://x/p/abc")).toBe("https://wa.me/?text=Hi%20Amma%3A%20http%3A%2F%2Fx%2Fp%2Fabc");
  });
});

describe("deleting a family's data (G14)", () => {
  it("removes the household, every row in it and the profile", async () => {
    const { r, household } = await throughParents();
    await saveEmergencyStep(r, household.id, { choice: "add", name: "Mrs. Iyer", phone: "+91 00000 11111", told: true }, NOW);
    await createParentInvite(r, household.id, NOW);
    await deleteChildData(r, USER.id);
    expect(await r.households.find({})).toEqual([]);
    expect(await r.parentProfiles.find({})).toEqual([]);
    expect(await r.emergencyContacts.find({})).toEqual([]);
    expect(await r.parentInvites.find({})).toEqual([]);
    expect(await r.setupDrafts.find({})).toEqual([]);
    expect(await r.profiles.get(USER.id)).toBeNull();
  });
});
