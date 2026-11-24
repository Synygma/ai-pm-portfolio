import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/auth/password";
import { createSessionToken, verifySessionToken } from "@/auth/session-token";
import { issueLink, LINK_TTL_MS, makeToken, redeemLink, RESEND_GAP_MS, type ResetLinkState } from "@/auth/reset-link";

describe("password hashing (memory mode)", () => {
  it("verifies the right password and rejects a wrong one", () => {
    const stored = hashPassword("ParCare-demo-2026");
    expect(stored.startsWith("scrypt$")).toBe(true);
    expect(stored).not.toContain("ParCare-demo-2026");
    expect(verifyPassword("ParCare-demo-2026", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
    expect(verifyPassword("anything", "garbage")).toBe(false);
  });
});

describe("session token (memory mode)", () => {
  const secret = "test-secret";
  const now = new Date("2026-11-04T10:00:00Z");
  const later = new Date("2026-11-11T10:00:00Z");

  it("accepts a genuine, unexpired token", () => {
    expect(verifySessionToken(createSessionToken("user-1", later, secret), secret, now)).toBe("user-1");
  });

  it("rejects tampered, wrongly signed, expired and missing tokens", () => {
    const token = createSessionToken("user-1", later, secret);
    expect(verifySessionToken(token.replace("user-1", "user-2"), secret, now)).toBeNull();
    expect(verifySessionToken(token, "other-secret", now)).toBeNull();
    expect(verifySessionToken(token, secret, new Date("2026-11-12T00:00:00Z"))).toBeNull();
    expect(verifySessionToken(undefined, secret, now)).toBeNull();
    expect(verifySessionToken("a.b", secret, now)).toBeNull();
  });
});

describe("password reset links (memory mode)", () => {
  const email = "child@example.com";
  const t0 = Date.UTC(2026, 10, 11, 9, 0);

  it("makes long unguessable secrets", () => {
    const a = makeToken();
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(makeToken()).not.toBe(a);
  });

  it("a link works once, and only a hash is kept", () => {
    const state: ResetLinkState = new Map();
    expect(issueLink(state, email, t0, "secret-1")).toEqual({ ok: true, token: "secret-1" });
    expect(JSON.stringify([...state.values()])).not.toContain("secret-1");
    expect(redeemLink(state, "secret-1", t0 + 1000)).toBe(email);
    expect(redeemLink(state, "secret-1", t0 + 2000)).toBeNull(); // used up
  });

  it("expires after 1 hour", () => {
    const state: ResetLinkState = new Map();
    issueLink(state, email, t0, "secret-1");
    expect(redeemLink(state, "secret-1", t0 + LINK_TTL_MS + 1)).toBeNull();
  });

  it("unknown or empty links do nothing", () => {
    const state: ResetLinkState = new Map();
    issueLink(state, email, t0, "secret-1");
    expect(redeemLink(state, "secret-2", t0)).toBeNull();
    expect(redeemLink(state, "", t0)).toBeNull();
    expect(redeemLink(state, "secret-1", t0)).toBe(email); // still there after the wrong tries
  });

  it("will not send a new link within a minute; a newer link replaces the old one", () => {
    const state: ResetLinkState = new Map();
    issueLink(state, email, t0, "old");
    expect(issueLink(state, email, t0 + RESEND_GAP_MS - 1, "new")).toEqual({ ok: false, reason: "tooSoon" });
    expect(issueLink(state, email, t0 + RESEND_GAP_MS, "new").ok).toBe(true);
    expect(redeemLink(state, "old", t0 + RESEND_GAP_MS + 1)).toBeNull();
    expect(redeemLink(state, "new", t0 + RESEND_GAP_MS + 2)).toBe(email);
  });
});
