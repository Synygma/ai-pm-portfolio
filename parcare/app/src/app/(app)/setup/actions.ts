"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { extractMetaListSafely } from "@/ai";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { findCity, findCountry, timeZonesOfCountry } from "@/data/places";
import { normalizeTimeZone } from "@/domain/time";
import { appNow } from "@/domain/clock";
import {
  type ChildInput,
  type DayItemInput,
  type EmergencyInput,
  type FieldErrors,
  inviteUrl,
  type ParentsInput,
  type SetupStep,
  shareLink,
  validateChild,
  validateDayItems,
  validateParents,
} from "@/domain/setup";
import {
  createParentInvite,
  finishSetup,
  markStepDone,
  saveChildStep,
  saveDayStep,
  saveEmergencyStep,
  saveParentsStep,
} from "@/services/setup";

export type ActionResult = { ok: true } | { ok: false; errors?: FieldErrors; reason?: "signedOut" | "order" | "termsRequired" | "incomplete" };

const hasErrors = (e: FieldErrors) => Object.keys(e).length > 0;

async function context() {
  const child = await getCurrentChild();
  if (!child) return null;
  return { child, repos: await getRepos(), now: appNow(child.household) };
}

/**
 * Only real places (item 8): the country must be on the list, the city must exist in it, and the
 * time zone must be one used in that country (India + Pacific/Easter is refused).
 * Returns the names as stored in the list (e.g. "lucknow" -> "Lucknow").
 */
async function checkPlace(errors: FieldErrors, prefix: string, country: string, city: string, timeZone: string) {
  const c = await findCountry(country);
  if (!c) {
    errors[`${prefix}country`] = "country";
    return { country, city };
  }
  const zones = await timeZonesOfCountry(c.name);
  if (zones && !zones.includes(normalizeTimeZone(timeZone))) errors[`${prefix}timeZone`] = "timeZoneCountry";
  if (!city.trim()) return { country: c.name, city: "" };
  const found = await findCity(c.name, city);
  if (!found) errors[`${prefix}city`] = "city";
  return { country: c.name, city: found?.name ?? city };
}

export async function saveChildAction(input: ChildInput): Promise<ActionResult> {
  const errors = validateChild(input);
  if (hasErrors(errors)) return { ok: false, errors };
  const place = await checkPlace(errors, "", input.country, input.city, input.timeZone);
  if (hasErrors(errors)) return { ok: false, errors };
  input = { ...input, country: place.country, city: place.city };
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  await saveChildStep(ctx.repos, { id: ctx.child.userId, email: ctx.child.email }, input, ctx.now);
  return { ok: true };
}

export async function saveParentsAction(input: ParentsInput): Promise<ActionResult> {
  const errors = validateParents(input);
  if (hasErrors(errors)) return { ok: false, errors };
  const parents = [];
  for (const [i, p] of input.parents.entries()) {
    const place = await checkPlace(errors, `${i}.`, p.country, p.city, p.timeZone);
    parents.push({ ...p, country: place.country, city: place.city });
  }
  if (hasErrors(errors)) return { ok: false, errors };
  input = { ...input, parents };
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  if (!ctx.child.household) return { ok: false, reason: "order" };
  await saveParentsStep(ctx.repos, ctx.child.household, input, ctx.now);
  return { ok: true };
}

export async function markStepAction(step: Extract<SetupStep, "howItWorks" | "introduce" | "call">): Promise<ActionResult> {
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  if (!ctx.child.household) return { ok: false, reason: "order" };
  await markStepDone(ctx.repos, ctx.child.household.id, step, ctx.now);
  return { ok: true };
}

export async function suggestDayAction(
  transcript: string,
): Promise<{ ok: true; items: DayItemInput[]; fellBack: boolean } | { ok: false; reason: "signedOut" | "empty" }> {
  if (!transcript.trim()) return { ok: false, reason: "empty" };
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  const { items, fellBack } = await extractMetaListSafely(transcript, { parentPetName: ctx.child.parent?.petName ?? "" });
  return { ok: true, items: items.map((i) => ({ ...i, included: true })), fellBack };
}

export async function saveDayAction(items: DayItemInput[], transcript: string): Promise<ActionResult> {
  const errors = validateDayItems(items);
  if (hasErrors(errors)) return { ok: false, errors };
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  if (!ctx.child.household?.managedParentId) return { ok: false, reason: "order" };
  await saveDayStep(ctx.repos, ctx.child.household, items, transcript, ctx.now);
  return { ok: true };
}

export async function saveEmergencyAction(
  input: EmergencyInput,
): Promise<{ ok: true; outcome: "skip" | "store" | "doNotStore" } | { ok: false; errors?: FieldErrors; reason?: "signedOut" | "order" }> {
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  if (!ctx.child.household) return { ok: false, reason: "order" };
  const decision = await saveEmergencyStep(ctx.repos, ctx.child.household.id, input, ctx.now);
  if (decision.action === "invalid") return { ok: false, errors: decision.errors };
  return { ok: true, outcome: decision.action };
}

export async function createInviteAction(): Promise<
  { ok: true; url: string; shareUrl: string; expiresAt: string } | { ok: false; reason: "signedOut" | "order" }
> {
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  if (!ctx.child.household || !ctx.child.parent) return { ok: false, reason: "order" };
  const { token, expiresAt } = await createParentInvite(ctx.repos, ctx.child.household.id, ctx.now);
  const h = await headers();
  const base = h.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = inviteUrl(base, token);
  const t = await getTranslations("setup.invite");
  const message = t("shareMessage", { parentPetName: ctx.child.parent.petName, url });
  return { ok: true, url, shareUrl: shareLink(message), expiresAt };
}

export async function finishSetupAction(termsAccepted: boolean): Promise<ActionResult> {
  const ctx = await context();
  if (!ctx) return { ok: false, reason: "signedOut" };
  if (!ctx.child.household) return { ok: false, reason: "incomplete" };
  const result = await finishSetup(ctx.repos, ctx.child.household, ctx.child.userId, termsAccepted, ctx.now);
  if (!result.ok) return { ok: false, reason: result.reason };
  redirect("/home");
}
