// Pure rules for the setup wizard (5.2): steps, validation, emergency-contact decision (G7),
// terms gating (G10), invite links. No I/O and no Node APIs here (also used in the browser), so it is all unit-testable.

import { CHECKIN_TYPES, type CheckinType } from "@/data/types";
import { isValidTimeZone } from "./time";

export const SETUP_STEPS = ["child", "parent", "howItWorks", "introduce", "day", "emergency", "invite", "call", "terms"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

export type FieldErrors = Record<string, "required" | "tooLong" | "age" | "timeZone" | "timeZoneCountry" | "country" | "city" | "phone" | "time" | "type" | "noItems">;

export type ChildInput = {
  fullName: string;
  petName: string;
  country: string;
  city: string;
  age: number | null;
  timeZone: string;
};

export type ParentInput = {
  name: string;
  petName: string;
  gender: "female" | "male" | "other" | null;
  age: number | null;
  country: string;
  city: string;
  timeZone: string;
};

export type ParentsInput = { parents: ParentInput[]; managedIndex: number };

export type DayItemInput = { label: string; checkinType: CheckinType; localTime: string | null; included: boolean };

export type EmergencyInput = { choice: "skip" } | { choice: "add"; name: string; phone: string; told: boolean | null };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX = 80;

function text(errors: FieldErrors, key: string, value: string, required: boolean) {
  const v = value.trim();
  if (required && !v) errors[key] = "required";
  else if (v.length > MAX) errors[key] = "tooLong";
}

function age(errors: FieldErrors, key: string, value: number | null, required: boolean) {
  if (value === null) {
    if (required) errors[key] = "required";
  } else if (!Number.isInteger(value) || value < 18 || value > 120) errors[key] = "age";
}

function zone(errors: FieldErrors, key: string, value: string) {
  if (!value.trim()) errors[key] = "required";
  else if (!isValidTimeZone(value.trim())) errors[key] = "timeZone";
}

export function validateChild(input: ChildInput): FieldErrors {
  const errors: FieldErrors = {};
  text(errors, "fullName", input.fullName, true);
  text(errors, "petName", input.petName, false);
  text(errors, "country", input.country, true);
  text(errors, "city", input.city, true);
  age(errors, "age", input.age, false);
  zone(errors, "timeZone", input.timeZone);
  return errors;
}

export function validateParents(input: ParentsInput): FieldErrors {
  const errors: FieldErrors = {};
  if (input.parents.length < 1 || input.parents.length > 2) errors.parents = "required";
  input.parents.forEach((p, i) => {
    text(errors, `${i}.name`, p.name, true);
    text(errors, `${i}.petName`, p.petName, true);
    text(errors, `${i}.country`, p.country, true);
    text(errors, `${i}.city`, p.city, true); // sets her time zone, so it is needed
    age(errors, `${i}.age`, p.age, false);
    zone(errors, `${i}.timeZone`, p.timeZone);
  });
  if (!(input.managedIndex >= 0 && input.managedIndex < input.parents.length)) errors.managedIndex = "required";
  return errors;
}

export function validateDayItems(items: DayItemInput[]): FieldErrors {
  const errors: FieldErrors = {};
  const included = items.filter((i) => i.included);
  if (included.length === 0) errors.items = "noItems";
  items.forEach((item, i) => {
    if (!item.included) return;
    text(errors, `${i}.label`, item.label, true);
    if (item.localTime !== null && !TIME_RE.test(item.localTime)) errors[`${i}.localTime`] = "time";
    if (!(CHECKIN_TYPES as readonly string[]).includes(item.checkinType)) errors[`${i}.checkinType`] = "type";
  });
  return errors;
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^\+?[\d\s()-]+$/.test(phone.trim()) && digits.length >= 6 && digits.length <= 15;
}

export type EmergencyDecision =
  | { action: "skip" }
  | { action: "store"; name: string; phone: string }
  | { action: "doNotStore"; reason: "notTold" }
  | { action: "invalid"; errors: FieldErrors };

/**
 * G7: the emergency contact is stored ONLY when the child confirms the person knows they are the
 * first point of contact. "No" (or no answer) means nothing is stored.
 */
export function decideEmergencyContact(input: EmergencyInput): EmergencyDecision {
  if (input.choice === "skip") return { action: "skip" };
  const errors: FieldErrors = {};
  text(errors, "name", input.name, true);
  if (!input.phone.trim()) errors.phone = "required";
  else if (!validatePhone(input.phone)) errors.phone = "phone";
  if (input.told === null) errors.told = "required";
  if (Object.keys(errors).length > 0) return { action: "invalid", errors };
  if (input.told !== true) return { action: "doNotStore", reason: "notTold" };
  return { action: "store", name: input.name.trim(), phone: input.phone.trim() };
}

/** G10: setup cannot finish without the child's tick on "can and cannot do" + T&C. */
export function canFinishSetup(state: { termsAccepted: boolean; hasProfile: boolean; hasManagedParent: boolean }):
  | { ok: true }
  | { ok: false; reason: "termsRequired" | "incomplete" } {
  if (!state.hasProfile || !state.hasManagedParent) return { ok: false, reason: "incomplete" };
  if (!state.termsAccepted) return { ok: false, reason: "termsRequired" };
  return { ok: true };
}

// --- Parent invite (5.2 g). Token creation/hashing is server-only: see ./invite.ts ----------

export function inviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/p/${token}`;
}

/** Share link that opens a chat app with the message pre-filled (the only chat-app touchpoint). */
export function shareLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
