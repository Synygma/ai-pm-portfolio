// The record that a user agreed to "what ParCare can and cannot do" + terms before first use
// (P-011 item 0). Never deleted. The internet address is never stored: only a salted SHA-256
// fingerprint, which can show that two agreements came from the same connection but cannot be
// turned back into the address.

import { createHash } from "node:crypto";
import { TERMS_VERSION } from "@/config/terms";
import type { Repos } from "@/data/repo";
import type { TermsAgreementRow } from "@/data/types";

/** First address in X-Forwarded-For (set by Vercel and most proxies), else X-Real-IP. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || headers.get("x-real-ip")?.trim();
  return ip ? ip.slice(0, 64) : null;
}

export function ipFingerprint(ip: string | null, salt = process.env.IP_HASH_SALT?.trim() || "parcare-dev-only-ip-salt"): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Records agreement to the current terms once per user and version. */
export async function recordAgreement(repos: Repos, userId: string, ip: string | null, now: Date): Promise<TermsAgreementRow> {
  const existing = await repos.termsAgreements.findOne({ userId, termsVersion: TERMS_VERSION });
  if (existing) return existing;
  return repos.termsAgreements.insert({ userId, termsVersion: TERMS_VERSION, acceptedAt: now.toISOString(), ipHash: ipFingerprint(ip) });
}
