import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import type { CheckinRow, ConsentRow, MetaItemRow, ResponseRow } from "@/data/types";
import { buildDigest, digestDue, isFreeOfDiagnosis, latestDigestSlot, safeLabel, sharedItems } from "@/domain/digest";
import { maybeSendDigest, setDigestFeedback } from "@/services/digest";
import messages from "../../messages/en.json";

const LONDON = "Europe/London";
const day = 24 * 3600000;
const at = (s: string) => new Date(s);

describe("digest timing (child's 19:00, covering the parent's previous 24 hours)", () => {
  it("finds the latest 19:00 London slot, in winter and summer time", () => {
    expect(latestDigestSlot(at("2026-11-05T18:59:00Z"), "19:00", LONDON).toISOString()).toBe("2026-11-04T19:00:00.000Z");
    expect(latestDigestSlot(at("2026-11-05T19:00:00Z"), "19:00", LONDON).toISOString()).toBe("2026-11-05T19:00:00.000Z");
    expect(latestDigestSlot(at("2026-07-01T18:30:00Z"), "19:00", LONDON).toISOString()).toBe("2026-07-01T18:00:00.000Z");
  });

  it("is due once per slot, covers 24 hours, and waits for setup", () => {
    const base = { digestLocalTime: "19:00", childTimeZone: LONDON, setupCompletedAt: "2026-11-01T00:00:00Z" };
    const due = digestDue({ ...base, now: at("2026-11-05T19:01:00Z"), lastDigestSentAt: "2026-11-04T19:00:00.000Z" });
    expect(due?.periodEnd.toISOString()).toBe("2026-11-05T19:00:00.000Z");
    expect(due!.periodEnd.getTime() - due!.periodStart.getTime()).toBe(day);
    expect(digestDue({ ...base, now: at("2026-11-05T19:30:00Z"), lastDigestSentAt: "2026-11-05T19:00:00.000Z" })).toBeNull();
    expect(digestDue({ ...base, setupCompletedAt: null, now: at("2026-11-05T19:30:00Z"), lastDigestSentAt: null })).toBeNull();
    expect(digestDue({ ...base, setupCompletedAt: "2026-11-05T19:10:00Z", now: at("2026-11-05T19:30:00Z"), lastDigestSentAt: null })).toBeNull();
  });

  it("changing the digest time never back-fills an old day", () => {
    // Last digest yesterday 19:00; at 15:00 today the child picks 15:02.
    const base = { childTimeZone: LONDON, setupCompletedAt: "2026-11-01T00:00:00Z", lastDigestSentAt: "2026-11-04T19:00:00.000Z" };
    expect(digestDue({ ...base, digestLocalTime: "15:02", now: at("2026-11-05T15:00:00Z") })).toBeNull();
    expect(digestDue({ ...base, digestLocalTime: "15:02", now: at("2026-11-05T15:02:30Z") })?.periodEnd.toISOString()).toBe("2026-11-05T15:02:00.000Z");
  });
});

// --- Contents ------------------------------------------------------------------------------

const meta = (id: string, over: Partial<MetaItemRow> = {}): MetaItemRow => ({
  id, householdId: "h", parentId: "p", label: id, checkinType: "physical_activity", localTime: "06:30", onDate: null, source: "child", createdAt: "2026-10-01T00:00:00Z", ...over,
});
const consent = (metaItemId: string, over: Partial<ConsentRow> = {}): ConsentRow => ({
  id: `c-${metaItemId}`, householdId: "h", metaItemId, grantedAt: "2026-10-01T00:00:00Z", revokedAt: null, shareInDigest: true, ...over,
});
const checkin = (id: string, metaItemId: string, dueAt: string): CheckinRow => ({
  id, householdId: "h", metaItemId, dueAt, status: "answered", prompted1At: dueAt, prompted2At: null, answeredAt: dueAt, escalatedAt: null, acknowledgedAt: null, snoozedUntil: null,
});
const response = (id: string, checkinId: string, createdAt: string, text: string, outcome: ResponseRow["outcome"] = "yes"): ResponseRow => ({
  id, householdId: "h", checkinId, text, outcome, audioPath: null, source: null, createdAt,
});

const END = at("2026-11-05T19:00:00Z");
const START = new Date(END.getTime() - day);

/** Walk answered "yes" on each of the 5 days before the period (a habit). */
function walkHistory() {
  const checkins: CheckinRow[] = [];
  const responses: ResponseRow[] = [];
  for (let d = 1; d <= 5; d++) {
    const due = new Date(END.getTime() - d * day - 12 * 3600000).toISOString();
    checkins.push(checkin(`kw${d}`, "walk", due));
    responses.push(response(`rw${d}`, `kw${d}`, due, `Walked, day ${d}.`));
  }
  return { checkins, responses };
}

describe("digest contents", () => {
  it("shows only consented, shared items (G1, G2) and quotes the parent's words exactly", () => {
    const metas = [meta("walk"), meta("puja", { checkinType: "puja" }), meta("med", { checkinType: "medicine" }), meta("tea", { checkinType: "social" })];
    const consents = [
      consent("walk"),
      consent("puja", { shareInDigest: false }), // parent chose not to share
      consent("med", { revokedAt: "2026-11-05T10:00:00Z" }), // consent withdrawn
    ]; // "tea" never consented
    const checkins = ["walk", "puja", "med", "tea"].map((m) => checkin(`k-${m}`, m, "2026-11-05T01:00:00Z"));
    const responses = ["walk", "puja", "med", "tea"].map((m) => response(`r-${m}`, `k-${m}`, "2026-11-05T01:05:00Z", `  ${m} done, beta!  `));
    expect(sharedItems(metas, consents, END).map((m) => m.id)).toEqual(["walk"]);
    const { items } = buildDigest({ periodStart: START, periodEnd: END, metaItems: metas, consents, checkins, responses });
    expect(items.map((i) => i.metaItemId)).toEqual(["walk"]);
    expect(items[0].quote).toBe("  walk done, beta!  ");
  });

  it("ignores words outside the 24-hour window", () => {
    const { items } = buildDigest({
      periodStart: START,
      periodEnd: END,
      metaItems: [meta("walk")],
      consents: [consent("walk")],
      checkins: [checkin("k1", "walk", "2026-11-04T18:00:00Z"), checkin("k2", "walk", "2026-11-05T20:00:00Z")],
      responses: [response("r1", "k1", "2026-11-04T18:59:00Z", "too early"), response("r2", "k2", "2026-11-05T19:01:00Z", "too late")],
    });
    expect(items).toEqual([]);
  });

  it("flags 'not done' and 'not mentioned' only against an established habit", () => {
    const h = walkHistory();
    const notDone = buildDigest({
      periodStart: START, periodEnd: END, metaItems: [meta("walk")], consents: [consent("walk")],
      checkins: [...h.checkins, checkin("k0", "walk", "2026-11-05T01:00:00Z")],
      responses: [...h.responses, response("r0", "k0", "2026-11-05T01:10:00Z", "No walk, it rained.", "no")],
    });
    expect(notDone.flags).toEqual([expect.objectContaining({ metaItemId: "walk", kind: "not_done", usualLocalTime: "06:30" })]);

    const notMentioned = buildDigest({
      periodStart: START, periodEnd: END, metaItems: [meta("walk")], consents: [consent("walk")],
      checkins: [...h.checkins, checkin("k0", "walk", "2026-11-05T01:00:00Z")],
      responses: h.responses,
    });
    expect(notMentioned.flags.map((f) => f.kind)).toEqual(["not_mentioned"]);

    // Only 2 earlier days: no habit, so no flag.
    const noHabit = buildDigest({
      periodStart: START, periodEnd: END, metaItems: [meta("walk")], consents: [consent("walk")],
      checkins: [...h.checkins.slice(0, 2), checkin("k0", "walk", "2026-11-05T01:00:00Z")],
      responses: h.responses.slice(0, 2),
    });
    expect(noHabit.flags).toEqual([]);
  });

  it("never flags items the parent does not share", () => {
    const h = walkHistory();
    const { flags } = buildDigest({
      periodStart: START, periodEnd: END, metaItems: [meta("walk")], consents: [consent("walk", { shareInDigest: false })],
      checkins: [...h.checkins, checkin("k0", "walk", "2026-11-05T01:00:00Z")], responses: h.responses,
    });
    expect(flags).toEqual([]);
  });
});

describe("no diagnosis in ParCare's own words (G13)", () => {
  it("blocks diagnosis and mood labels, allows ordinary words", () => {
    for (const bad of ["She seems depressed", "possible dementia", "Lonely today", "a diagnosis", "Symptoms of illness", "compliance score"]) {
      expect(isFreeOfDiagnosis(bad), bad).toBe(false);
    }
    for (const ok of ["Evening puja", "Morning sadhana", "BP medicine (morning)", "Usually around 06:30", "Scored a goal"]) {
      expect(isFreeOfDiagnosis(ok), ok).toBe(true);
    }
  });

  it("every digest sentence template is free of blocked words", () => {
    const t = createTranslator({ locale: "en", messages, namespace: "digest" }) as unknown as (k: string, v?: Record<string, string | number>) => string;
    const values = { label: "Morning walk", time: "06:30", parentPetName: "Maa", count: 2, day: "Today" };
    for (const key of ["flags.not_done", "flags.not_doneNoTime", "flags.not_mentioned", "flags.not_mentionedNoTime", "flagsTitle", "flagsNote", "listIntro", "covers"]) {
      expect(isFreeOfDiagnosis(t(key, values)), key).toBe(true);
    }
  });

  it("replaces a child-written label that contains a blocked word", () => {
    expect(safeLabel("Depression tablet", "Medicine")).toBe("Medicine");
    expect(safeLabel("BP tablet", "Medicine")).toBe("BP tablet");
  });
});

describe("digest service", () => {
  it("sends today's digest once with a chat bubble, and stores feedback (one per digest)", async () => {
    const now = at("2026-11-05T12:00:00Z");
    const repos = createMemoryRepos(new MemoryStore(buildSeed({ now })));
    const household = (await repos.households.find({}))[0];
    expect(await maybeSendDigest(repos, household, now)).toBeNull(); // yesterday's is already there

    const evening = at("2026-11-05T19:00:30Z");
    const digest = await maybeSendDigest(repos, household, evening);
    expect(digest?.periodEnd).toBe("2026-11-05T19:00:00.000Z");
    expect(await maybeSendDigest(repos, household, at("2026-11-05T19:05:00Z"))).toBeNull();
    expect(await repos.chatMessages.find({ householdId: household.id, refId: digest!.id })).toHaveLength(1);

    // Quotes are exactly the stored words.
    const stored = new Map((await repos.responses.find({ householdId: household.id })).map((r) => [r.id, r.text]));
    for (const item of digest!.items) expect(item.quote).toBe(stored.get(item.responseId));

    await setDigestFeedback(repos, household.id, digest!.id, "matched", evening);
    await setDigestFeedback(repos, household.id, digest!.id, "not_matched", evening);
    const fb = await repos.digestFeedback.find({ digestId: digest!.id });
    expect(fb.map((f) => f.verdict)).toEqual(["not_matched"]);
    expect(await setDigestFeedback(repos, "someone-else", digest!.id, "matched", evening)).toBeNull();
  });
});
