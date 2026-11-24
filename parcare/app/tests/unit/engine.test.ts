import { describe, expect, it } from "vitest";
import { createMemoryRepos, emptySnapshot, MemoryStore } from "@/data/memory";
import type { CheckinRow, ConsentRow, HouseholdRow, MetaItemRow } from "@/data/types";
import { activeAlarms, type EngineInput, planTick } from "@/domain/engine";
import { acknowledgeAlert } from "@/services/alerts";
import { answerNextCheckin, createHelperRequest, setAllConsents, tickHousehold } from "@/services/checkins";
import { changeCompanion, letNextGoUnanswered } from "@/services/demo";

const IST = "Asia/Kolkata";
const at = (s: string) => new Date(s);
// 08:30 IST = 03:00 UTC.
const MED: MetaItemRow = { id: "m1", householdId: "h", parentId: "p", label: "BP medicine", checkinType: "medicine", localTime: "08:30", onDate: null, source: "child", createdAt: "2026-11-01T00:00:00.000Z" };
const CONSENT: ConsentRow = { id: "c1", householdId: "h", metaItemId: "m1", grantedAt: "2026-11-01T00:00:00.000Z", revokedAt: null, shareInDigest: true };
const HH = { gapAMinutes: 10, gapBMinutes: 20, setupCompletedAt: "2026-11-01T00:00:00.000Z" };

function input(now: string, checkins: CheckinRow[] = [], over: Partial<EngineInput> = {}): EngineInput {
  return { now: at(now), household: HH, parentTimeZone: IST, metaItems: [MED], consents: [CONSENT], checkins, alerts: [], ...over };
}

function checkin(over: Partial<CheckinRow>): CheckinRow {
  return { id: "k1", householdId: "h", metaItemId: "m1", dueAt: "2026-11-05T03:00:00.000Z", status: "scheduled", prompted1At: null, prompted2At: null, answeredAt: null, escalatedAt: null, acknowledgedAt: null, snoozedUntil: null, ...over };
}

describe("check-in engine: escalation timing", () => {
  it("schedules consented items at the parent's local time (08:30 IST = 03:00 UTC)", () => {
    const actions = planTick(input("2026-11-05T00:00:00Z"));
    const created = actions.filter((a) => a.type === "createCheckin");
    expect(created.map((a) => (a as { dueAt: string }).dueAt)).toEqual(["2026-11-05T03:00:00.000Z", "2026-11-06T03:00:00.000Z"]);
    expect(planTick(input("2026-11-05T00:00:00Z", [checkin({}), checkin({ id: "k2", dueAt: "2026-11-06T03:00:00.000Z" })]))).toEqual([]);
  });

  it("prompt 1 at the due time, prompt 2 after gap A, child alarm after gap B, nothing early", () => {
    expect(planTick(input("2026-11-05T02:59:00Z", [checkin({})])).filter((a) => a.type !== "createCheckin")).toEqual([]);
    expect(planTick(input("2026-11-05T03:00:00Z", [checkin({})]))).toContainEqual({ type: "prompt1", id: "k1", at: "2026-11-05T03:00:00.000Z" });

    const p1 = checkin({ status: "prompted1", prompted1At: "2026-11-05T03:00:00.000Z" });
    expect(planTick(input("2026-11-05T03:09:59Z", [p1])).some((a) => a.type === "prompt2")).toBe(false);
    expect(planTick(input("2026-11-05T03:10:00Z", [p1]))).toContainEqual({ type: "prompt2", id: "k1", at: "2026-11-05T03:10:00.000Z" });

    const p2 = checkin({ status: "prompted2", prompted1At: "2026-11-05T03:00:00.000Z", prompted2At: "2026-11-05T03:10:00.000Z" });
    expect(planTick(input("2026-11-05T03:29:59Z", [p2])).some((a) => a.type === "escalate")).toBe(false);
    expect(planTick(input("2026-11-05T03:30:00Z", [p2]))).toContainEqual({ type: "escalate", id: "k1", at: "2026-11-05T03:30:00.000Z" });
  });

  it("uses the parent-chosen gaps and measures them from the real prompt times", () => {
    const p1 = checkin({ status: "prompted1", prompted1At: "2026-11-05T03:07:00.000Z" }); // prompt went out late
    const slow = { ...HH, gapAMinutes: 15, gapBMinutes: 45 };
    expect(planTick(input("2026-11-05T03:21:00Z", [p1], { household: slow })).some((a) => a.type === "prompt2")).toBe(false);
    expect(planTick(input("2026-11-05T03:22:00Z", [p1], { household: slow })).some((a) => a.type === "prompt2")).toBe(true);
  });

  it("an answered check-in never escalates", () => {
    const answered = checkin({ status: "answered", prompted1At: "2026-11-05T03:00:00.000Z", answeredAt: "2026-11-05T03:05:00.000Z" });
    expect(planTick(input("2026-11-05T05:00:00Z", [answered])).filter((a) => a.type !== "createCheckin")).toEqual([]);
  });

  it("lapses (no alarm) when the app was not running during the prompt window", () => {
    expect(planTick(input("2026-11-05T04:00:00Z", [checkin({})]))).toContainEqual({ type: "lapse", id: "k1" });
    expect(planTick(input("2026-11-05T04:00:00Z", [checkin({})])).some((a) => a.type === "escalate")).toBe(false);
  });

  it("does nothing before setup is finished, and never schedules before consent", () => {
    expect(planTick(input("2026-11-05T00:00:00Z", [], { household: { ...HH, setupCompletedAt: null } }))).toEqual([]);
    const late = { ...CONSENT, grantedAt: "2026-11-05T03:30:00.000Z" };
    const due = planTick(input("2026-11-05T03:31:00Z", [], { consents: [late] })).filter((a) => a.type === "createCheckin");
    expect(due.map((a) => (a as { dueAt: string }).dueAt)).toEqual(["2026-11-06T03:00:00.000Z"]);
  });

  it("schedules a one-off appointment only on its date", () => {
    const appt: MetaItemRow = { ...MED, id: "m2", checkinType: "appointment", localTime: "11:00", onDate: "2026-11-06" };
    const actions = planTick(input("2026-11-05T00:00:00Z", [], { metaItems: [appt], consents: [{ ...CONSENT, metaItemId: "m2" }] }));
    expect(actions.filter((a) => a.type === "createCheckin").map((a) => (a as { dueAt: string }).dueAt)).toEqual(["2026-11-06T05:30:00.000Z"]);
  });
});

describe("consent revocation and 'all disabled'", () => {
  it("removes future check-ins when consent is revoked, and stops prompting", () => {
    const revoked = { ...CONSENT, revokedAt: "2026-11-05T01:00:00.000Z" };
    const actions = planTick(input("2026-11-05T02:00:00Z", [checkin({}), checkin({ id: "k2", status: "prompted1", prompted1At: "2026-11-05T01:30:00.000Z" })], { consents: [revoked] }));
    expect(actions).toContainEqual({ type: "deleteCheckin", id: "k1" });
    expect(actions.some((a) => a.type === "createCheckin" || a.type === "prompt2")).toBe(false);
  });

  it("raises 'all check-ins are switched off' once, and not for a parent who never consented", () => {
    const revoked = { ...CONSENT, revokedAt: "2026-11-05T01:00:00.000Z" };
    expect(planTick(input("2026-11-05T02:00:00Z", [], { consents: [revoked] }))).toContainEqual({ type: "allDisabled" });
    const told = { id: "a", householdId: "h", kind: "all_disabled" as const, checkinId: null, data: {}, createdAt: "2026-11-05T01:01:00.000Z", ackAt: null };
    expect(planTick(input("2026-11-05T02:00:00Z", [], { consents: [revoked], alerts: [told] }))).not.toContainEqual({ type: "allDisabled" });
    expect(planTick(input("2026-11-05T02:00:00Z", [], { consents: [] }))).not.toContainEqual({ type: "allDisabled" });
  });
});

// --- Service level, on the memory adapter --------------------------------------------------

async function household() {
  const repos = createMemoryRepos(new MemoryStore(emptySnapshot()));
  const now = "2026-11-01T00:00:00.000Z";
  await repos.profiles.insert({ id: "u", email: "x@example.com", fullName: "Asha", petName: "Chinni", country: "UK", city: "Leeds", age: 40, timeZone: "Europe/London", createdAt: now });
  let h: HouseholdRow = await repos.households.insert({ childId: "u", managedParentId: null, parentAvatarId: "vidya", gapAMinutes: 10, gapBMinutes: 20, digestLocalTime: "19:00", demoClockOffsetMs: 0, retentionDays: 30, setupCompletedAt: now, createdAt: now });
  const parent = await repos.parentProfiles.insert({ householdId: h.id, name: "Lakshmi", petName: "Amma", gender: "female", age: 70, country: "India", city: "Pune", timeZone: IST, managed: true, setupCompletedAt: now, lastSeenAt: null, createdAt: now });
  h = await repos.households.update(h.id, { managedParentId: parent.id });
  const meta = await repos.metaItems.insert({ ...MED, id: undefined, householdId: h.id, parentId: parent.id });
  await repos.consents.insert({ ...CONSENT, id: undefined, householdId: h.id, metaItemId: meta.id });
  await repos.emergencyContacts.insert({ householdId: h.id, name: "Mrs. Iyer", phone: "+91 00000 11111", confirmedToldAt: now, createdAt: now });
  return { repos, h };
}

describe("tick service: alarm until acknowledged", () => {
  it("creates the factual alarm, chat bubble, and keeps it active until switched off", async () => {
    const { repos, h } = await household();
    await tickHousehold(repos, h, at("2026-11-05T02:00:00Z"));
    await tickHousehold(repos, h, at("2026-11-05T03:00:00Z"));
    await tickHousehold(repos, h, at("2026-11-05T03:10:00Z"));
    const r = await tickHousehold(repos, h, at("2026-11-05T03:30:00Z"));
    expect(r.escalated).toBe(1);
    const alert = r.alerts[0];
    expect(alert).toMatchObject({ kind: "missed_checkin", ackAt: null, data: { petName: "Amma", label: "BP medicine" } });
    expect(await repos.chatMessages.find({ householdId: h.id, refId: alert.id })).toHaveLength(1);

    // Later ticks do not stop or duplicate it.
    await tickHousehold(repos, h, at("2026-11-05T05:00:00Z"));
    await tickHousehold(repos, h, at("2026-11-05T09:00:00Z"));
    expect(activeAlarms(await repos.alerts.find({ householdId: h.id }))).toHaveLength(1);

    await acknowledgeAlert(repos, h.id, alert.id, at("2026-11-05T09:01:00Z"));
    expect(activeAlarms(await repos.alerts.find({ householdId: h.id }))).toHaveLength(0);
    expect((await repos.checkins.get(alert.checkinId!))?.status).toBe("acknowledged");
    expect((await repos.alerts.get(alert.id))?.ackAt).toBe("2026-11-05T09:01:00.000Z");
  });

  it("an answer before the alarm stores the exact words and stops escalation", async () => {
    const { repos, h } = await household();
    await tickHousehold(repos, h, at("2026-11-05T03:00:00Z"));
    const { response, checkinId } = await answerNextCheckin(repos, h.id, "Took my tablet after poha.", "yes", at("2026-11-05T03:04:00Z"));
    expect(response.text).toBe("Took my tablet after poha.");
    expect((await repos.checkins.get(checkinId!))?.status).toBe("answered");
    const later = await tickHousehold(repos, h, at("2026-11-05T04:00:00Z"));
    expect(later.escalated).toBe(0);
  });

  it("'let the next one go unanswered' walks the clock through both prompts to the alarm", async () => {
    const { repos, h } = await household();
    const realNow = at("2026-11-05T00:00:00Z").getTime();
    const alert = await letNextGoUnanswered(repos, h, realNow);
    expect(alert?.kind).toBe("missed_checkin");
    const k = await repos.checkins.get(alert!.checkinId!);
    expect(k).toMatchObject({ status: "escalated", prompted1At: "2026-11-05T03:00:00.000Z", prompted2At: "2026-11-05T03:10:00.000Z", escalatedAt: "2026-11-05T03:30:00.000Z" });
  });

  it("emergency word in a helper request or answer raises the distinct alarm; normal ones do not", async () => {
    const { repos, h } = await household();
    expect((await createHelperRequest(repos, h.id, "Please bring vegetables. Help arrived yesterday for the tap.", at("2026-11-05T05:00:00Z"))).emergency).toBeNull();
    const r = await createHelperRequest(repos, h.id, "Help me, I fell in the bathroom", at("2026-11-05T05:01:00Z"));
    expect(r.emergency?.kind).toBe("emergency_word");
    expect((await answerNextCheckin(repos, h.id, "I have chest pain", "unclear", at("2026-11-05T05:02:00Z"))).emergency?.kind).toBe("emergency_word");
    expect(await repos.helperRequests.find({ householdId: h.id })).toHaveLength(2);
  });

  it("switching all check-ins off removes future ones and tells the child once", async () => {
    const { repos, h } = await household();
    await tickHousehold(repos, h, at("2026-11-05T00:00:00Z"));
    expect((await repos.checkins.find({ householdId: h.id, status: "scheduled" })).length).toBeGreaterThan(0);
    await setAllConsents(repos, h, false, at("2026-11-05T01:00:00Z"));
    const r = await tickHousehold(repos, h, at("2026-11-05T01:00:00Z"));
    expect(r.alerts.map((a) => a.kind)).toEqual(["all_disabled"]);
    expect(await repos.checkins.find({ householdId: h.id, status: "scheduled" })).toEqual([]);
    expect((await tickHousehold(repos, h, at("2026-11-05T02:00:00Z"))).alerts).toEqual([]);
    await setAllConsents(repos, h, true, at("2026-11-05T02:00:00Z"));
    expect((await tickHousehold(repos, h, at("2026-11-05T02:00:00Z"))).created).toBeGreaterThan(0);
  });

  it("the companion can never be changed to 'My Child'", async () => {
    const { repos, h } = await household();
    await expect(changeCompanion(repos, h, "my-child")).rejects.toThrow();
    expect((await changeCompanion(repos, h, "guruji")).parentAvatarId).toBe("guruji");
  });
});
