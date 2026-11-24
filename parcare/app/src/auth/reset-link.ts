// One-time password-reset links for memory mode (Supabase Auth makes and checks its own links).
// Pure functions over a small state object, so the rules can be tested with any clock.
// Only a hash of the link's secret is kept; a link works once, for 1 hour (like Supabase's).

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const LINK_TTL_MS = 60 * 60 * 1000;
/** A new link for the same email no sooner than this (stops email flooding). */
export const RESEND_GAP_MS = 60 * 1000;

export type ResetLinkEntry = { tokenHash: string; expiresAt: number; sentAt: number };
/** Keyed by email: only the newest link for an email works. */
export type ResetLinkState = Map<string, ResetLinkEntry>;

const hash = (token: string) => createHash("sha256").update(token).digest();

export function makeToken(): string {
  return randomBytes(32).toString("base64url");
}

export type IssueResult = { ok: true; token: string } | { ok: false; reason: "tooSoon" };

/** Issues a new link secret for this email (the older link stops working), unless one was sent a moment ago. */
export function issueLink(state: ResetLinkState, email: string, now: number, token = makeToken()): IssueResult {
  const old = state.get(email);
  if (old && now - old.sentAt < RESEND_GAP_MS) return { ok: false, reason: "tooSoon" };
  state.set(email, { tokenHash: hash(token).toString("hex"), expiresAt: now + LINK_TTL_MS, sentAt: now });
  return { ok: true, token };
}

/** The email the link belongs to (and the link is used up), or null if it is unknown, used or old. */
export function redeemLink(state: ResetLinkState, token: string, now: number): string | null {
  if (!token) return null;
  const given = hash(token);
  for (const [email, entry] of state) {
    const expected = Buffer.from(entry.tokenHash, "hex");
    if (expected.length === given.length && timingSafeEqual(expected, given)) {
      state.delete(email);
      return now <= entry.expiresAt ? email : null;
    }
  }
  return null;
}
