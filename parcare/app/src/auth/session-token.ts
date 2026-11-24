// Signed session token for the memory adapter: "<userId>.<expiresMs>.<hmac>".
// Pure (no Next APIs) so it can be unit-tested. Supabase mode uses Supabase Auth cookies instead.

import { createHmac, timingSafeEqual } from "node:crypto";

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, expiresAt: Date, secret: string): string {
  const payload = `${userId}.${expiresAt.getTime()}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** The user id when the token is genuine and not expired, else null. */
export function verifySessionToken(token: string | undefined, secret: string, now = new Date()): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expires, mac] = parts;
  const expected = Buffer.from(sign(`${userId}.${expires}`, secret));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  if (!(Number(expires) > now.getTime())) return null;
  return userId;
}
