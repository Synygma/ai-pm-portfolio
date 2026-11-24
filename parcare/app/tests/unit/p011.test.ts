// Changes requested after C8 (P-011): agreement record, keeping period, summaries, places, Skip.
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { TERMS_VERSION } from "@/config/terms";
import { createMemoryRepos, emptySnapshot, MemoryStore } from "@/data/memory";
import { findCity, findCountry, listCountries, searchCities, timeZonesOfCountry } from "@/data/places";
import { buildSeed, PARENT_TZ } from "@/data/seed";
import { isFreeOfDiagnosis } from "@/domain/digest";
import { buildSummary } from "@/domain/summary";
import { addMinutes } from "@/domain/time";
import { clientIp, ipFingerprint, recordAgreement } from "@/services/agreement";
import { setDigestFeedback } from "@/services/digest";
import { deleteFamilyData } from "@/services/household";
import { purgeOldData } from "@/services/retention";
import type { VoiceStore } from "@/services/voice";
import messages from "../../messages/en.json";

const NOW = new Date("2026-11-05T12:00:00Z");
const DAY = 24 * 60;
const noVoice: VoiceStore = { save: async () => "", playUrl: async () => null, remove: async () => undefined };

function seeded() {
  const snap = buildSeed({ now: NOW });
  const repos = createMemoryRepos(new MemoryStore(snap));
  return { snap, repos, household: snap.households[0], childId: snap.households[0].childId };
}

describe("agreement before first use (item 0)", () => {
  it("stores version, time and a salted one-way fingerprint, never the address", async () => {
    const repos = createMemoryRepos(new MemoryStore(emptySnapshot()));
    const row = await recordAgreement(repos, "u1", "203.0.113.7", NOW);
    expect(row).toMatchObject({ userId: "u1", termsVersion: TERMS_VERSION, acceptedAt: NOW.toISOString() });
    expect(row.ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain("203.0.113.7");
    expect(ipFingerprint("203.0.113.7", "a")).not.toBe(ipFingerprint("203.0.113.7", "b")); // salted
    expect(ipFingerprint(null)).toBeNull();
    // Once per version.
    expect((await recordAgreement(repos, "u1", "198.51.100.1", NOW)).id).toBe(row.id);
  });

  it("reads the client address from the proxy headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.1" }))).toBe("198.51.100.1");
    expect(clientIp(new Headers())).toBeNull();
  });

  it("is kept after 'Delete all our data'", async () => {
    const { repos, childId } = seeded();
    expect(await repos.termsAgreements.find({ userId: childId })).toHaveLength(1);
    await deleteFamilyData(repos, noVoice, childId);
    expect(await repos.households.find({})).toEqual([]);
    expect(await repos.termsAgreements.find({ userId: childId })).toHaveLength(1);
  });

  it("the terms say what is kept and for how long", () => {
    const text = JSON.stringify(messages.commitments.terms);
    expect(text).toContain("8 days, 15 days or one month");
    expect(text).toContain("kept even after you delete your data");
    expect(text).toContain("the address itself is not stored");
  });
});

describe("keeping period: 8 / 15 days / a month (item 3)", () => {
  it("default a month: the week of sample history stays", async () => {
    const { repos, household } = seeded();
    const before = (await repos.responses.find({})).length;
    expect(await purgeOldData(repos, household, NOW, noVoice)).toEqual({ voice: 0, words: 0, digests: 0 });
    expect((await repos.responses.find({})).length).toBe(before);
  });

  it("deletes the parent's words, help requests and digests (with feedback and bubbles) older than the period", async () => {
    const { repos, household } = seeded();
    const later = addMinutes(NOW, 12 * DAY);
    const r = await purgeOldData(repos, { ...household, retentionDays: 8 }, later, noVoice);
    expect(r.words).toBeGreaterThan(0);
    expect(r.digests).toBeGreaterThan(0);
    const cutoff = later.getTime() - 8 * DAY * 60000;
    for (const x of await repos.responses.find({})) expect(new Date(x.createdAt).getTime()).toBeGreaterThanOrEqual(cutoff);
    for (const d of await repos.digests.find({})) expect(new Date(d.sentAt).getTime()).toBeGreaterThanOrEqual(cutoff);
    const digestIds = new Set((await repos.digests.find({})).map((d) => d.id));
    for (const f of await repos.digestFeedback.find({})) expect(digestIds.has(f.digestId)).toBe(true);
    for (const m of await repos.chatMessages.find({ kind: "digest" })) expect(digestIds.has(m.refId!)).toBe(true);
    // Settings, consents, check-ins, alerts and the agreement stay.
    expect(await repos.consents.find({})).not.toHaveLength(0);
    expect(await repos.alerts.find({})).not.toHaveLength(0);
    expect(await repos.termsAgreements.find({})).toHaveLength(1);
  });

  it("never keeps more than a month, and leaves a row with a clip for a tick that can delete the clip", async () => {
    const { repos, household } = seeded();
    const [first] = await repos.responses.find({}, { orderBy: "createdAt" });
    await repos.responses.update(first.id, { audioPath: `${household.id}/x.webm` });
    const later = addMinutes(NOW, 40 * DAY);
    await purgeOldData(repos, { ...household, retentionDays: 30 }, later); // no voice store
    expect(await repos.responses.get(first.id)).not.toBeNull();
    const removed: string[] = [];
    await purgeOldData(repos, household, later, { ...noVoice, remove: async (p) => void removed.push(p) });
    expect(removed).toEqual([`${household.id}/x.webm`]);
    expect(await repos.responses.get(first.id)).toBeNull();
    expect(await repos.responses.find({})).toEqual([]);
  });
});

describe("weekly / monthly summary in words (item 4, G12)", () => {
  it("per check-in: as planned, or the days it did not happen / had no answer; quotes exactly", () => {
    const { snap } = seeded();
    const s = buildSummary({
      periodStart: addMinutes(NOW, -7 * DAY),
      periodEnd: NOW,
      parentTimeZone: PARENT_TZ,
      metaItems: snap.metaItems,
      consents: snap.consents,
      checkins: snap.checkins,
      responses: snap.responses,
    });
    const walk = s.lines.find((l) => l.label === "Morning walk")!;
    expect(walk.notDone).toHaveLength(1); // the rainy day
    // The past escalation was answered late, so it is not "no answer".
    expect(s.lines.every((l) => l.noAnswer.length === 0)).toBe(true);
    const texts = new Set(snap.responses.map((r) => r.text));
    expect(s.quotes.length).toBeGreaterThan(0);
    expect(s.quotes.length).toBeLessThanOrEqual(5);
    for (const q of s.quotes) expect(texts.has(q.text)).toBe(true);
  });

  it("a check-in that ended without an answer is listed by day", () => {
    const { snap } = seeded();
    const walk = snap.metaItems.find((m) => m.label === "Morning walk")!;
    const lapsed = { id: "lapsed-1", householdId: walk.householdId, metaItemId: walk.id, dueAt: addMinutes(NOW, -2 * DAY).toISOString(), status: "lapsed" as const, prompted1At: null, prompted2At: null, answeredAt: null, escalatedAt: null, acknowledgedAt: null, snoozedUntil: null };
    const s = buildSummary({ periodStart: addMinutes(NOW, -7 * DAY), periodEnd: NOW, parentTimeZone: PARENT_TZ, metaItems: snap.metaItems, consents: snap.consents, checkins: [...snap.checkins, lapsed], responses: snap.responses });
    expect(s.lines.find((l) => l.metaItemId === walk.id)!.noAnswer).toEqual(["2026-11-03"]);
  });

  it("only shared, consented items appear", () => {
    const { snap } = seeded();
    const consents = snap.consents.map((c, i) => (i === 0 ? { ...c, shareInDigest: false } : c));
    const hidden = snap.metaItems.find((m) => m.id === snap.consents[0].metaItemId)!;
    const s = buildSummary({ periodStart: addMinutes(NOW, -30 * DAY), periodEnd: NOW, parentTimeZone: PARENT_TZ, metaItems: snap.metaItems, consents, checkins: snap.checkins, responses: snap.responses });
    expect(s.lines.map((l) => l.metaItemId)).not.toContain(hidden.id);
  });

  it("the summary wording has no scores and no diagnosis words", () => {
    const t = createTranslator({ locale: "en", messages, namespace: "summary" });
    for (const line of [t("asPlanned", { parentPetName: "Maa" }), t("notDone", { dates: "Mon 2 Nov" }), t("noAnswer", { dates: "Mon 2 Nov" }), t("note")]) {
      expect(isFreeOfDiagnosis(line)).toBe(true);
      expect(line).not.toMatch(/%|score|streak|\d+ of \d+/i);
    }
  });
});

describe("only real countries and cities (item 8)", () => {
  it("knows the countries and the cities in them, with their time zones", async () => {
    expect((await listCountries()).length).toBeGreaterThan(200);
    expect(await findCountry("india")).toEqual({ code: "IN", name: "India" });
    expect(await findCountry("Narnia")).toBeNull();
    expect(await findCity("India", "lucknow")).toEqual({ name: "Lucknow", timeZone: "Asia/Kolkata" });
    expect(await findCity("United Kingdom", "London")).toEqual({ name: "London", timeZone: "Europe/London" });
    expect(await findCity("United States", "Denver")).toMatchObject({ timeZone: "America/Denver" });
    expect(await findCity("India", "Londn")).toBeNull();
    expect(await findCity("India", "London")).toBeNull(); // real city, wrong country
    expect((await searchCities("India", "luck"))[0].name).toBe("Lucknow");
    expect(await searchCities("India", "l")).toEqual([]);
  }, 30_000);

  it("knows which time zones a country uses (India + Pacific/Easter is refused)", async () => {
    expect(await timeZonesOfCountry("India")).toEqual(["Asia/Kolkata"]);
    expect(await timeZonesOfCountry("United Kingdom")).toContain("Europe/London");
    expect(await timeZonesOfCountry("United Kingdom")).not.toContain("Asia/Kolkata");
    const us = (await timeZonesOfCountry("United States")) ?? [];
    expect(us).toEqual(expect.arrayContaining(["America/New_York", "America/Denver", "America/Los_Angeles"]));
    expect(await timeZonesOfCountry("Narnia")).toBeNull();
  }, 30_000);

  it("the sample data uses real places", async () => {
    const { snap } = seeded();
    for (const p of [...snap.profiles, ...snap.parentProfiles]) {
      expect(await findCountry(p.country!), p.country!).not.toBeNull();
      expect(await findCity(p.country!, p.city!), p.city!).not.toBeNull();
    }
  }, 30_000);
});

describe("digest Skip (item 2)", () => {
  it("is stored like the other answers and can be changed", async () => {
    const { repos, household, snap } = seeded();
    const digest = snap.digests.at(-1)!;
    expect((await setDigestFeedback(repos, household.id, digest.id, "skipped", NOW))?.verdict).toBe("skipped");
    expect((await setDigestFeedback(repos, household.id, digest.id, "matched", NOW))?.verdict).toBe("matched");
    expect(await repos.digestFeedback.find({ digestId: digest.id })).toHaveLength(1);
  });
});
