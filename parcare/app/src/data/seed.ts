// Fictional seed data (CLAUDE.md section 7). Pure: buildSeed(now) -> snapshot. Used by the
// memory adapter (first start / reset) and by `npm run seed:supabase`.
// Every name, number and quote here is invented.

import { hashPassword } from "../auth/password";
import { DEMO_CHILD_EMAIL, DEMO_CHILD_PASSWORD } from "../config/demo";
import { TERMS_VERSION } from "../config/terms";
import { buildDigest } from "../domain/digest";
import { initialReviewPrompts, REVIEW_EVERY_DAYS } from "../domain/review";
import { addDays, addMinutes, localDate, zonedTimeToUtc } from "../domain/time";
import { emptySnapshot } from "./memory";
import type {
  CheckinRow,
  CheckinType,
  DbSnapshot,
  MetaItemRow,
  ResponseRow,
} from "./types";

export const CHILD_TZ = "Europe/London";
export const PARENT_TZ = "Asia/Kolkata";
export const HISTORY_DAYS = 8;
export const DIGEST_LOCAL_TIME = "19:00";

/** Deterministic, valid v4-format UUIDs so seed runs are repeatable. */
export function seedIdGenerator(prefix = "5eed0000") {
  let n = 0;
  return () => `${prefix}-0000-4000-8000-${(++n).toString(16).padStart(12, "0")}`;
}

type DailyItem = {
  key: string;
  label: string;
  type: CheckinType;
  time: string;
  /** One answer per history day (index 0 = 1 day ago). */
  answers: string[];
};

const DAILY_ITEMS: DailyItem[] = [
  {
    key: "woken",
    label: "Woken up",
    type: "woken_up",
    time: "06:00",
    answers: [
      "Good morning beta, I am up. Slept well.",
      "Up early today, the birds woke me.",
      "Awake. A little cold this morning.",
      "Good morning! Up and making tea.",
      "", // day 5: missed, escalated (see ESCALATION_DAY)
      "I am up, all fine.",
      "Woke up at six as usual.",
      "Good morning, I am up and the milk has come.",
    ],
  },
  {
    key: "walk",
    label: "Morning walk",
    type: "physical_activity",
    time: "06:30",
    answers: [
      "Walked two rounds of the park with Mrs. Verma.",
      "Went for my walk, it was pleasant.",
      "No walk today, it was raining. I stayed in.", // day 3: pattern flag
      "Walked to the temple and back.",
      "Short walk today, three rounds of the colony.",
      "Did my walk, met the Gupta aunty on the way.",
      "Walked in the park, the roses are blooming.",
      "Morning walk done, 30 minutes.",
    ],
  },
  {
    key: "medAm",
    label: "BP medicine (morning)",
    type: "medicine",
    time: "08:30",
    answers: [
      "Took my BP tablet after breakfast.",
      "Tablet taken with my tea.",
      "Yes, took the morning tablet.",
      "Took it after poha.",
      "Morning tablet done.",
      "Taken, don't worry.",
      "Took my BP tablet on time.",
      "Yes beta, tablet taken.",
    ],
  },
  {
    key: "puja",
    label: "Evening puja",
    type: "puja",
    time: "18:30",
    answers: [
      "Did the evening aarti.",
      "Lit the diya and did my puja.",
      "Puja done, prayed for all of you.",
      "Did aarti with the neighbours today.",
      "Evening puja done.",
      "Lit the lamp and read the Gita for a while.",
      "Aarti done, the bell sounded lovely.",
      "Did my puja, all peaceful.",
    ],
  },
  {
    key: "medPm",
    label: "BP medicine (evening)",
    type: "medicine",
    time: "20:30",
    answers: [
      "Evening tablet taken after dinner.",
      "Took the night tablet.",
      "Yes, evening tablet done.",
      "Taken with warm water.",
      "Took it after khichdi.",
      "Evening tablet taken.",
      "Done, tablet taken.",
      "Took my evening tablet.",
    ],
  },
  {
    key: "last",
    label: "Last check-in of the day",
    type: "last_checkin",
    time: "21:00",
    answers: [
      "Going to sleep now. Good night beta.",
      "Watched my serial, now sleeping.",
      "All good, good night.",
      "Locked the door, going to bed.",
      "Tired today, sleeping early. Good night.",
      "Good night, give my love to the children.",
      "Going to bed now, all fine.",
      "Good night beta, talk tomorrow.",
    ],
  },
];

/** History day (days ago) on which the 06:00 "woken up" check-in went unanswered. */
export const ESCALATION_DAY = 5;
export const ESCALATION_LATE_ANSWER = "Sorry beta, I slept late today. All fine.";
/** History day (days ago) with no walk (digest pattern flag). */
export const NO_WALK_DAY = 3;

export type SeedOptions = {
  now: Date;
  /** Supabase: the auth user id created by the seed script. Memory: generated. */
  childUserId?: string;
  /** Add the demo login to the memory adapter's auth table. */
  includeAuthUser?: boolean;
};

export function buildSeed({ now, childUserId, includeAuthUser = true }: SeedOptions): DbSnapshot {
  const id = seedIdGenerator();
  const snap = emptySnapshot();
  const iso = (d: Date) => d.toISOString();
  const at = (date: string, time: string, tz = PARENT_TZ) => zonedTimeToUtc(date, time, tz);

  const parentToday = localDate(now, PARENT_TZ);
  const setupAt = at(addDays(parentToday, -HISTORY_DAYS - 1), "15:00", PARENT_TZ);

  // --- People and household ---------------------------------------------------
  const childId = childUserId ?? id();
  const householdId = id();
  const parentId = id();

  if (includeAuthUser) {
    snap.authUsers.push({
      id: childId,
      email: DEMO_CHILD_EMAIL,
      passwordHash: hashPassword(DEMO_CHILD_PASSWORD),
      createdAt: iso(setupAt),
    });
  }

  snap.profiles.push({
    id: childId,
    email: DEMO_CHILD_EMAIL,
    fullName: "Priya Sharma",
    petName: "Gudiya",
    country: "United Kingdom",
    city: "London",
    age: 41,
    timeZone: CHILD_TZ,
    createdAt: iso(setupAt),
  });

  snap.households.push({
    id: householdId,
    childId,
    managedParentId: parentId,
    parentAvatarId: "vidya",
    gapAMinutes: 10,
    gapBMinutes: 20,
    digestLocalTime: DIGEST_LOCAL_TIME,
    demoClockOffsetMs: 0,
    retentionDays: 30,
    setupCompletedAt: iso(setupAt),
    createdAt: iso(setupAt),
  });

  snap.parentProfiles.push({
    id: parentId,
    householdId,
    name: "Kamla Sharma",
    petName: "Maa",
    gender: "female",
    age: 72,
    country: "India",
    city: "Lucknow",
    timeZone: PARENT_TZ,
    managed: true,
    // Kamla has set up her own app (parent app): her consents below come from it.
    setupCompletedAt: iso(addMinutes(setupAt, 85)),
    lastSeenAt: null,
    createdAt: iso(setupAt),
  });

  // --- Meta items + consents (parent consented to each, item by item) ----------
  const metaByKey = new Map<string, MetaItemRow>();
  for (const item of DAILY_ITEMS) {
    const row: MetaItemRow = {
      id: id(),
      householdId,
      parentId,
      label: item.label,
      checkinType: item.type,
      localTime: item.time,
      onDate: null,
      source: "child",
      createdAt: iso(setupAt),
    };
    metaByKey.set(item.key, row);
    snap.metaItems.push(row);
  }
  const appointment: MetaItemRow = {
    id: id(),
    householdId,
    parentId,
    label: "Doctor appointment (BP review)",
    checkinType: "appointment",
    localTime: "11:00",
    onDate: addDays(parentToday, 6),
    source: "child",
    createdAt: iso(setupAt),
  };
  snap.metaItems.push(appointment);

  const consentAt = addMinutes(setupAt, 90);
  for (const m of snap.metaItems) {
    snap.consents.push({
      id: id(),
      householdId,
      metaItemId: m.id,
      grantedAt: iso(consentAt),
      revokedAt: null,
      shareInDigest: true,
    });
  }

  // --- Check-in history with the parent's answers --------------------------------
  let alertId: string | null = null;
  for (let daysAgo = HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const date = addDays(parentToday, -daysAgo);
    DAILY_ITEMS.forEach((item, i) => {
      const meta = metaByKey.get(item.key)!;
      const due = at(date, item.time);
      const checkin: CheckinRow = {
        id: id(),
        householdId,
        metaItemId: meta.id,
        dueAt: iso(due),
        status: "answered",
        prompted1At: iso(due),
        prompted2At: null,
        answeredAt: null,
        escalatedAt: null,
        acknowledgedAt: null,
        snoozedUntil: null,
      };

      let text = item.answers[daysAgo - 1];
      let answeredAt = addMinutes(due, ((daysAgo * 7 + i) % 11) + 2);
      let outcome: ResponseRow["outcome"] = "yes";

      if (item.key === "woken" && daysAgo === ESCALATION_DAY) {
        // Prompt 1 -> (gap A 10 min) prompt 2 -> (gap B 20 min) child alarm, acknowledged.
        checkin.status = "acknowledged";
        checkin.prompted2At = iso(addMinutes(due, 10));
        checkin.escalatedAt = iso(addMinutes(due, 30));
        checkin.acknowledgedAt = iso(addMinutes(due, 34));
        alertId = id();
        snap.alerts.push({
          id: alertId,
          householdId,
          kind: "missed_checkin",
          checkinId: checkin.id,
          data: { petName: "Maa", checkinType: item.type },
          createdAt: checkin.escalatedAt,
          ackAt: checkin.acknowledgedAt,
        });
        text = ESCALATION_LATE_ANSWER;
        answeredAt = addMinutes(due, 52);
      }
      if (item.key === "walk" && daysAgo === NO_WALK_DAY) outcome = "no";

      checkin.answeredAt = iso(answeredAt);
      snap.checkins.push(checkin);
      snap.responses.push({
        id: id(),
        householdId,
        checkinId: checkin.id,
        text,
        outcome,
        audioPath: null,
        source: null,
        createdAt: iso(answeredAt),
      });
    });
  }

  // --- Daily digests: child's 19:00, covering the parent's previous 24 hours -----
  const childToday = localDate(now, CHILD_TZ);
  const digestIds: string[] = [];
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 1; daysAgo--) {
    const sentAt = at(addDays(childToday, -daysAgo), DIGEST_LOCAL_TIME, CHILD_TZ);
    if (sentAt > now) continue;
    const periodStart = addMinutes(sentAt, -24 * 60);
    // Same rules as the live digest (src/domain/digest.ts).
    const { items, flags } = buildDigest({
      periodStart,
      periodEnd: sentAt,
      metaItems: snap.metaItems,
      consents: snap.consents,
      checkins: snap.checkins,
      responses: snap.responses,
    });
    const digestId = id();
    digestIds.push(digestId);
    snap.digests.push({
      id: digestId,
      householdId,
      periodStart: iso(periodStart),
      periodEnd: iso(sentAt),
      sentAt: iso(sentAt),
      items,
      flags,
    });
    snap.chatMessages.push({
      id: id(),
      householdId,
      kind: "digest",
      direction: "in",
      audience: "child",
      refId: digestId,
      data: {},
      createdAt: iso(sentAt),
      readAt: daysAgo === 1 ? null : iso(addMinutes(sentAt, 25)),
    });
  }
  // Priya gave feedback on some digests (not all).
  for (const digestId of digestIds.slice(0, 4)) {
    const d = snap.digests.find((x) => x.id === digestId)!;
    snap.digestFeedback.push({
      id: id(),
      householdId,
      digestId,
      verdict: "matched",
      createdAt: iso(addMinutes(d.sentAt, 30)),
    });
  }

  // --- Chat: setup bubble + the past alert ----------------------------------------
  snap.chatMessages.push({
    id: id(),
    householdId,
    kind: "setup",
    direction: "in",
    audience: "child",
    refId: null,
    data: { parentPetName: "Maa", avatarId: "vidya" },
    createdAt: iso(consentAt),
    readAt: iso(addMinutes(consentAt, 5)),
  });
  if (alertId) {
    const alert = snap.alerts.find((a) => a.id === alertId)!;
    snap.chatMessages.push({
      id: id(),
      householdId,
      kind: "alert",
      direction: "in",
      audience: "child",
      refId: alertId,
      data: { petName: "Maa" },
      createdAt: alert.createdAt,
      readAt: alert.ackAt,
    });
  }
  snap.chatMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // --- Helper requests (one done, one new) ------------------------------------------
  const tapAt = at(addDays(parentToday, -4), "10:15");
  snap.helperRequests.push({
    id: id(),
    householdId,
    text: "Please ask someone to fix the kitchen tap, it keeps dripping.",
    audioPath: null,
    status: "done",
    createdAt: iso(tapAt),
    updatedAt: iso(addMinutes(tapAt, 26 * 60)),
  });
  const chemistAt = at(addDays(parentToday, -1), "16:40");
  snap.helperRequests.push({
    id: id(),
    householdId,
    text: "Can someone bring a refill of my BP tablets from the chemist this week?",
    audioPath: null,
    status: "new",
    createdAt: iso(chemistAt),
    updatedAt: iso(chemistAt),
  });

  // --- Child reminder (generated tone, labelled "sample") -----------------------------
  snap.childReminders.push({
    id: id(),
    householdId,
    label: "Drink a glass of water after your walk",
    audioPath: null,
    isSample: true,
    dueAt: iso(at(addDays(parentToday, 1), "07:15")),
    repeat: "daily",
    status: "scheduled",
    createdAt: iso(addMinutes(setupAt, 120)),
  });

  // --- Emergency contact (child confirmed the person knows: G7) -----------------------
  snap.emergencyContacts.push({
    id: id(),
    householdId,
    name: "Mrs. Verma (neighbour)",
    phone: "+91 00000 12345",
    confirmedToldAt: iso(addMinutes(setupAt, 20)),
    createdAt: iso(addMinutes(setupAt, 20)),
  });

  // --- Terms, review prompts, invite ----------------------------------------------------
  snap.termsAcceptances.push({
    id: id(),
    householdId,
    role: "child",
    userId: childId,
    termsVersion: TERMS_VERSION,
    acceptedAt: iso(addMinutes(setupAt, 30)),
  });
  // Priya agreed before her first use (P-011 item 0). Fictional fingerprint, no real address.
  snap.termsAgreements.push({
    id: id(),
    userId: childId,
    termsVersion: TERMS_VERSION,
    acceptedAt: iso(addMinutes(setupAt, -5)),
    ipHash: null,
  });
  // Review prompts (G9): the child's +1 week prompt has been shown (not yet marked done); the next
  // one is 3 months after it. The parent's +2 weeks prompt is still ahead.
  const [childReview, parentReview] = initialReviewPrompts(setupAt);
  const childReviewId = id();
  snap.reviewPrompts.push(
    { id: childReviewId, householdId, audience: "child", dueAt: childReview.dueAt, shownAt: childReview.dueAt, doneAt: null },
    { id: id(), householdId, audience: "parent", dueAt: parentReview.dueAt, shownAt: null, doneAt: null },
    { id: id(), householdId, audience: "child", dueAt: iso(addMinutes(childReview.dueAt, REVIEW_EVERY_DAYS * 24 * 60)), shownAt: null, doneAt: null },
  );
  const reviewAlertId = id();
  snap.alerts.push({ id: reviewAlertId, householdId, kind: "review", checkinId: null, data: { petName: "Maa", reviewPromptId: childReviewId }, createdAt: childReview.dueAt, ackAt: null });
  snap.chatMessages.push({
    id: id(),
    householdId,
    kind: "alert",
    direction: "in",
    audience: "child",
    refId: reviewAlertId,
    data: { petName: "Maa" },
    createdAt: childReview.dueAt,
    readAt: iso(addMinutes(childReview.dueAt, 40)),
  });
  snap.chatMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  snap.parentInvites.push({
    id: id(),
    householdId,
    // SHA-256 of a throwaway sample token; real tokens are never stored.
    tokenHash: "8d4b2b6f0c2a3a1e5f6d7c8b9a0e1f2d3c4b5a69788766554433221100ffeedd",
    expiresAt: iso(addMinutes(setupAt, 48 * 60)),
    usedAt: iso(addMinutes(setupAt, 60)),
    createdAt: iso(addMinutes(setupAt, 25)),
  });

  // --- Kamla's own chat with Vidya (parent app): hello, then the last two days of check-ins
  // with her answers in her own words. Read already (she answered them).
  const parentSetupAt = addMinutes(setupAt, 85);
  const parentChat: DbSnapshot["chatMessages"] = [
    { id: id(), householdId, kind: "setup", direction: "in", audience: "parent", refId: null, data: {}, createdAt: iso(parentSetupAt), readAt: iso(parentSetupAt) },
  ];
  const twoDaysAgo = zonedTimeToUtc(addDays(parentToday, -2), "00:00", PARENT_TZ).getTime();
  for (const c of snap.checkins) {
    if (new Date(c.dueAt).getTime() < twoDaysAgo || !c.prompted1At) continue;
    parentChat.push({ id: id(), householdId, kind: "checkin", direction: "in", audience: "parent", refId: c.id, data: {}, createdAt: c.prompted1At, readAt: c.answeredAt });
    const r = snap.responses.find((x) => x.checkinId === c.id);
    if (r) parentChat.push({ id: id(), householdId, kind: "answer", direction: "out", audience: "parent", refId: r.id, data: {}, createdAt: r.createdAt, readAt: r.createdAt });
  }
  snap.chatMessages.push(...parentChat);
  snap.chatMessages.sort((x, y) => x.createdAt.localeCompare(y.createdAt));

  return snap;
}
