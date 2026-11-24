// One-time parent invite tokens (5.2 g). Server only (Node crypto). Only the hash is stored.
import { createHash, randomBytes } from "node:crypto";

export const INVITE_VALID_DAYS = 7;

export function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * The token from a pasted invite link (P-033: on an iPhone the home-screen app has no address bar,
 * so the parent pastes the link). Accepts the whole link or just the token; anything else is null.
 * The token is only read here; /p/<token> still checks it (one use, expiry, hash only).
 */
export function tokenFromPasted(text: string): string | null {
  const s = text.trim();
  const inLink = s.match(/\/p\/([A-Za-z0-9_-]{20,})(?:[/?#]|$)/);
  if (inLink) return inLink[1];
  return /^[A-Za-z0-9_-]{20,}$/.test(s) ? s : null;
}
