import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { adminCredentials } from "@/config/env";
import { createSessionToken, verifySessionToken } from "./session-token";

// The admin login: one email + password from the environment (ADMIN_EMAIL, ADMIN_PASSWORD), a
// signed httpOnly cookie for 8 hours. Separate from child logins and the parent's phone cookie.

const ADMIN_COOKIE = "parcare_admin";
const ADMIN_HOURS = 8;
const globalForAdmin = globalThis as unknown as { __parcareAdminSecret?: string; __parcareAdminFails?: number[] };

function adminSecret(): string {
  const base = process.env.SESSION_SECRET?.trim() || (process.env.NODE_ENV === "development" ? "parcare-dev-only-session-secret" : "");
  // Without SESSION_SECRET: random per server process (the admin signs in again after a restart).
  if (!base) return (globalForAdmin.__parcareAdminSecret ??= randomBytes(32).toString("hex"));
  // Includes the admin password, so changing it signs every admin out.
  return `${base}:admin:${adminCredentials()?.password ?? ""}`;
}

const digest = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function isAdminConfigured(): boolean {
  return adminCredentials() !== null;
}

export type AdminSignIn = "ok" | "wrong" | "tooMany" | "off";

export async function adminSignIn(email: string, password: string, now = Date.now()): Promise<AdminSignIn> {
  const creds = adminCredentials();
  if (!creds) return "off";
  // Slow down guessing: at most 5 failed tries in 15 minutes per server.
  const fails = (globalForAdmin.__parcareAdminFails ?? []).filter((t) => now - t < 15 * 60_000);
  globalForAdmin.__parcareAdminFails = fails;
  if (fails.length >= 5) return "tooMany";
  const okEmail = same(email.trim().toLowerCase(), creds.email);
  const okPassword = same(password, creds.password);
  if (!okEmail || !okPassword) {
    fails.push(now);
    return "wrong";
  }
  const expires = new Date(now + ADMIN_HOURS * 3600_000);
  (await cookies()).set(ADMIN_COOKIE, createSessionToken("admin", expires, adminSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return "ok";
}

export async function adminSignOut(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdminSignedIn(): Promise<boolean> {
  await connection();
  if (!isAdminConfigured()) return false;
  return verifySessionToken((await cookies()).get(ADMIN_COOKIE)?.value, adminSecret()) === "admin";
}

/** For admin pages and actions: sends anyone else to the admin login. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminSignedIn())) redirect("/admin/login");
}
