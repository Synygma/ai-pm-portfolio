// The parent's app on her phone (docs/PLAN-PARENT.md, decision 2): the child's one-time invite
// link signs her in for 90 days, with no password. A session token is "<session id>.<secret>";
// only a SHA-256 of the secret is stored, so a leaked database row cannot be used to sign in.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Repos } from "@/data/repo";
import type { HouseholdRow, ParentProfileRow, ParentSessionRow } from "@/data/types";
import { hashInviteToken } from "@/domain/invite";
import { addMinutes } from "@/domain/time";

export const PARENT_SESSION_DAYS = 90;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createParentSession(repos: Repos, householdId: string, parentId: string, now: Date): Promise<{ token: string; expiresAt: Date }> {
  const secret = randomBytes(32).toString("base64url");
  const expiresAt = addMinutes(now, PARENT_SESSION_DAYS * 24 * 60);
  const row = await repos.parentSessions.insert({
    householdId,
    parentId,
    secretHash: sha(secret),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    createdAt: now.toISOString(),
  });
  return { token: `${row.id}.${secret}`, expiresAt };
}

/** The live session for a token, or null (unknown, wrong secret, expired or revoked). */
export async function verifyParentSession(repos: Repos, token: string | undefined | null, now: Date): Promise<ParentSessionRow | null> {
  if (!token) return null;
  const [id, secret] = token.split(".");
  if (!id || !secret || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const row = await repos.parentSessions.get(id);
  if (!row || row.revokedAt || new Date(row.expiresAt).getTime() <= now.getTime()) return null;
  const a = Buffer.from(sha(secret));
  const b = Buffer.from(row.secretHash);
  return a.length === b.length && timingSafeEqual(a, b) ? row : null;
}

/** Signs the parent out on every phone (used when a new link is redeemed). */
export async function revokeParentSessions(repos: Repos, householdId: string, now: Date): Promise<void> {
  for (const s of await repos.parentSessions.find({ householdId, revokedAt: null })) {
    await repos.parentSessions.update(s.id, { revokedAt: now.toISOString() });
  }
}

export type InviteCheck =
  | { ok: true; household: HouseholdRow; parent: ParentProfileRow; inviteId: string }
  /** householdId is known for a used or expired link (to name the child on the page). */
  | { ok: false; reason: "invalid" | "used" | "expired"; householdId?: string };

/** Checks an invite link without using it up (safe for link previews). */
export async function checkInvite(repos: Repos, token: string, now: Date): Promise<InviteCheck> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return { ok: false, reason: "invalid" };
  const invite = await repos.parentInvites.findOne({ tokenHash: hashInviteToken(token) });
  if (!invite) return { ok: false, reason: "invalid" };
  if (invite.usedAt) return { ok: false, reason: "used", householdId: invite.householdId };
  if (new Date(invite.expiresAt).getTime() <= now.getTime()) return { ok: false, reason: "expired", householdId: invite.householdId };
  const household = await repos.households.get(invite.householdId);
  const parent = household?.managedParentId ? await repos.parentProfiles.get(household.managedParentId) : null;
  if (!household || !parent) return { ok: false, reason: "invalid" };
  return { ok: true, household, parent, inviteId: invite.id };
}

/**
 * The parent taps "Open my ParCare": the link is used up, any older phone is signed out, and a
 * new 90-day session starts on this phone.
 */
export async function redeemInvite(repos: Repos, token: string, now: Date): Promise<(InviteCheck & { ok: false }) | { ok: true; token: string; expiresAt: Date; parent: ParentProfileRow }> {
  const check = await checkInvite(repos, token, now);
  if (!check.ok) return check;
  await repos.parentInvites.update(check.inviteId, { usedAt: now.toISOString() });
  await revokeParentSessions(repos, check.household.id, now);
  const session = await createParentSession(repos, check.household.id, check.parent.id, now);
  return { ok: true, ...session, parent: check.parent };
}
