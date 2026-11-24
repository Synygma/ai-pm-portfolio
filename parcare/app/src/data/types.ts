// Row types for every table (CLAUDE.md section 7). TypeScript uses camelCase; Postgres uses
// snake_case with the same words (gapAMinutes <-> gap_a_minutes). Mapping is in ./case.ts.
//
// Rules:
// - Every id is a UUID string. Every instant is an ISO-8601 UTC string. Wall-clock values are
//   "HH:MM" plus an IANA time zone.
// - The app always supplies timestamps itself (so the demo clock works); the database never
//   fills them in.
// - Free text (labels, the parent's words) is data, not UI text, so it is not in en.json.
// - Designed so the parent app (next phase) can plug in: parent-side fields already exist.

import type { AvatarId } from "@/config/brand";

export type Iso = string;

export const CHECKIN_TYPES = [
  "woken_up",
  "medicine",
  "help_arrived",
  "social",
  "physical_activity",
  "puja",
  "appointment",
  "last_checkin",
] as const;
export type CheckinType = (typeof CHECKIN_TYPES)[number];

export const CHECKIN_STATUSES = [
  "scheduled",
  "prompted1",
  "prompted2",
  "answered",
  "escalated",
  "acknowledged",
  // Due while the app was not running (e.g. the demo clock jumped a day): the parent was never
  // prompted, so there is no alarm and nothing claims "I checked in twice".
  "lapsed",
  // The parent asked for a little more time (F3); it comes back at snoozedUntil.
  "snoozed",
] as const;
export type CheckinStatus = (typeof CHECKIN_STATUSES)[number];

export const RETENTION_CHOICES = [8, 15, 30] as const;
export type RetentionDays = (typeof RETENTION_CHOICES)[number];

export type ProfileRow = {
  /** Same id as the auth user. */
  id: string;
  email: string;
  fullName: string;
  /** Pet name the parents use for the child (e.g. "Gudiya"). */
  petName: string | null;
  country: string | null;
  city: string | null;
  age: number | null;
  timeZone: string;
  createdAt: Iso;
};

export type HouseholdRow = {
  id: string;
  childId: string;
  managedParentId: string | null;
  /** Chosen by the parent (parent app). Read-only in the child app. Never "my-child". */
  parentAvatarId: AvatarId | null;
  /** Minutes from parent prompt 1 to prompt 2 (parent-chosen). */
  gapAMinutes: number;
  /** Minutes from parent prompt 2 to the child alarm (parent-chosen). */
  gapBMinutes: number;
  /** Child's local time for the daily digest, "HH:MM". */
  digestLocalTime: string;
  /** Demo clock: simulated now = real now + this offset. */
  demoClockOffsetMs: number;
  /** Days the parent's words, voice clips and digests are kept: 8, 15 or 30 (default, the longest). */
  retentionDays: RetentionDays;
  setupCompletedAt: Iso | null;
  createdAt: Iso;
};

export type ParentProfileRow = {
  id: string;
  householdId: string;
  name: string;
  /** What the child calls this parent (e.g. "Maa"). */
  petName: string;
  gender: "female" | "male" | "other" | null;
  age: number | null;
  country: string | null;
  city: string | null;
  timeZone: string;
  /** v1 manages one parent; a second may be stored but not managed. */
  managed: boolean;
  /** The parent finished her own setup in the parent app (A–F + terms). */
  setupCompletedAt: Iso | null;
  lastSeenAt: Iso | null;
  createdAt: Iso;
};

/** The parent's app on one phone (from the invite link; no password). Only a hash of the secret. */
export type ParentSessionRow = {
  id: string;
  householdId: string;
  parentId: string;
  secretHash: string;
  expiresAt: Iso;
  revokedAt: Iso | null;
  createdAt: Iso;
};

export type Audience = "child" | "parent";

export type SetupDraftRow = {
  id: string;
  householdId: string;
  audience: Audience;
  /** Last completed wizard step (save-and-resume). */
  step: number;
  data: Record<string, unknown>;
  updatedAt: Iso;
};

export type MetaItemRow = {
  id: string;
  householdId: string;
  parentId: string;
  label: string;
  checkinType: CheckinType;
  /** Parent-local "HH:MM", or null when there is no fixed time. */
  localTime: string | null;
  /** For one-off items such as an appointment: parent-local "YYYY-MM-DD". Null = daily. */
  onDate: string | null;
  /** Who described it: the child (setup) or the parent (parent app). */
  source: "child" | "parent";
  createdAt: Iso;
};

export type ConsentRow = {
  id: string;
  householdId: string;
  metaItemId: string;
  grantedAt: Iso;
  revokedAt: Iso | null;
  /** Parent allows this item to appear in the child's digest. */
  shareInDigest: boolean;
};

export type CheckinRow = {
  id: string;
  householdId: string;
  metaItemId: string;
  dueAt: Iso;
  status: CheckinStatus;
  prompted1At: Iso | null;
  prompted2At: Iso | null;
  answeredAt: Iso | null;
  escalatedAt: Iso | null;
  acknowledgedAt: Iso | null;
  snoozedUntil: Iso | null;
};

export type ResponseRow = {
  id: string;
  householdId: string;
  checkinId: string | null;
  /** The parent's own words, quoted exactly in the digest. */
  text: string;
  /** Did the thing happen? From the parent's answer (yes/no buttons or AI reading). */
  outcome: "yes" | "no" | "unclear" | null;
  /** Storage path of a short voice clip (30-day retention), if any. */
  audioPath: string | null;
  /** How the parent answered (null for older rows and the demo simulator). */
  source: "button" | "voice" | "typed" | null;
  createdAt: Iso;
};

export const ALERT_KINDS = ["missed_checkin", "emergency_word", "all_disabled", "review"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export type AlertRow = {
  id: string;
  householdId: string;
  kind: AlertKind;
  checkinId: string | null;
  /** Values for the translated message, e.g. { petName: "Maa" }. */
  data: Record<string, unknown>;
  createdAt: Iso;
  ackAt: Iso | null;
};

export type DigestItem = {
  metaItemId: string;
  checkinType: CheckinType;
  label: string;
  responseId: string;
  /** Exactly the stored response text. */
  quote: string;
  at: Iso;
};

export type DigestFlag = {
  metaItemId: string;
  checkinType: CheckinType;
  label: string;
  /** Factual change from the usual pattern; never a diagnosis. */
  kind: "not_done" | "not_mentioned";
  usualLocalTime: string | null;
};

export type DigestRow = {
  id: string;
  householdId: string;
  periodStart: Iso;
  periodEnd: Iso;
  sentAt: Iso;
  items: DigestItem[];
  flags: DigestFlag[];
};

export type DigestFeedbackRow = {
  id: string;
  householdId: string;
  digestId: string;
  /** "skipped" = the child chose not to check this digest with the parent. */
  verdict: "matched" | "not_matched" | "skipped";
  createdAt: Iso;
};

export type HelperRequestRow = {
  id: string;
  householdId: string;
  text: string;
  audioPath: string | null;
  status: "new" | "seen" | "done";
  createdAt: Iso;
  updatedAt: Iso;
};

export type ChildReminderRow = {
  id: string;
  householdId: string;
  label: string;
  audioPath: string | null;
  /** Seed reminder with a generated tone instead of a recording, labelled "sample". */
  isSample: boolean;
  dueAt: Iso;
  repeat: "none" | "daily" | "weekly";
  status: "scheduled" | "ringing" | "parent_ok" | "snoozed";
  createdAt: Iso;
};

export type EmergencyContactRow = {
  id: string;
  householdId: string;
  name: string;
  phone: string;
  /** Stored only after the child confirms the person knows (G7), so this is always set. */
  confirmedToldAt: Iso;
  createdAt: Iso;
};

export type TermsAcceptanceRow = {
  id: string;
  householdId: string;
  role: "child" | "parent";
  userId: string | null;
  termsVersion: string;
  acceptedAt: Iso;
};

export type ReviewPromptRow = {
  id: string;
  householdId: string;
  audience: "child" | "parent";
  dueAt: Iso;
  shownAt: Iso | null;
  doneAt: Iso | null;
};

/**
 * Proof that a user agreed to "what ParCare can and cannot do" + terms before first use. Not part
 * of any household and never deleted (kept after "Delete all our data"). The internet address is
 * not stored, only a salted one-way fingerprint.
 */
export type TermsAgreementRow = {
  id: string;
  userId: string;
  termsVersion: string;
  acceptedAt: Iso;
  ipHash: string | null;
};

/** A gentle check-in note the ParCare team sent to children's apps (admin page). No household. */
export type AdminBroadcastRow = {
  id: string;
  message: string;
  /** Which fixed note, or null for the team's own words. */
  preset: string | null;
  sentAt: Iso;
  /** Families it reached (only those where all was OK). */
  families: number;
  /** Phones a notification was pushed to. */
  pushed: number;
};

export type PushSubscriptionRow = {
  id: string;
  householdId: string;
  /** The child's login; null for the parent's phone (she has no login). */
  userId: string | null;
  audience: Audience;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: Iso;
};

export type ParentInviteRow = {
  id: string;
  householdId: string;
  /** SHA-256 of the one-time token; the token itself is never stored. */
  tokenHash: string;
  expiresAt: Iso;
  usedAt: Iso | null;
  createdAt: Iso;
};

export type ChatMessageRow = {
  id: string;
  householdId: string;
  /** "reply": a reaction or voice reply between parent and child (P-030, src/domain/replies.ts). */
  kind: "setup" | "digest" | "alert" | "review" | "reminder" | "helper" | "checkin" | "answer" | "note" | "reply";
  /** Whose chat: the child's companion chat or the parent's. */
  audience: Audience;
  /** "in" = from the companion / system, "out" = from the child. */
  direction: "in" | "out";
  /** Id of the digest / alert / etc. this bubble shows. */
  refId: string | null;
  /** Values for the translated bubble text. */
  data: Record<string, unknown>;
  createdAt: Iso;
  readAt: Iso | null;
};

/** Table name (camelCase) -> row type. */
export type Tables = {
  profiles: ProfileRow;
  households: HouseholdRow;
  parentProfiles: ParentProfileRow;
  parentSessions: ParentSessionRow;
  setupDrafts: SetupDraftRow;
  metaItems: MetaItemRow;
  consents: ConsentRow;
  checkins: CheckinRow;
  responses: ResponseRow;
  alerts: AlertRow;
  digests: DigestRow;
  digestFeedback: DigestFeedbackRow;
  helperRequests: HelperRequestRow;
  childReminders: ChildReminderRow;
  emergencyContacts: EmergencyContactRow;
  termsAcceptances: TermsAcceptanceRow;
  reviewPrompts: ReviewPromptRow;
  pushSubscriptions: PushSubscriptionRow;
  parentInvites: ParentInviteRow;
  chatMessages: ChatMessageRow;
  termsAgreements: TermsAgreementRow;
  adminBroadcasts: AdminBroadcastRow;
};

export type TableName = keyof Tables;

/** Insert order that satisfies foreign keys (households.managedParentId is set afterwards). */
export const TABLE_NAMES: readonly TableName[] = [
  "profiles",
  "households",
  "parentProfiles",
  "parentSessions",
  "setupDrafts",
  "metaItems",
  "consents",
  "checkins",
  "responses",
  "alerts",
  "digests",
  "digestFeedback",
  "helperRequests",
  "childReminders",
  "emergencyContacts",
  "termsAcceptances",
  "reviewPrompts",
  "pushSubscriptions",
  "parentInvites",
  "chatMessages",
  "termsAgreements",
  "adminBroadcasts",
];

/** Tables without a household_id: everything else belongs to exactly one household. */
export const NON_HOUSEHOLD_TABLES: ReadonlySet<TableName> = new Set(["profiles", "households", "termsAgreements", "adminBroadcasts"]);

/** Memory-adapter only: stand-in for Supabase Auth users. */
export type AuthUserRow = {
  id: string;
  email: string;
  /** "scrypt$<salt hex>$<hash hex>" */
  passwordHash: string;
  createdAt: Iso;
};

export type DbSnapshot = { version: 1; authUsers: AuthUserRow[] } & { [K in TableName]: Tables[K][] };
