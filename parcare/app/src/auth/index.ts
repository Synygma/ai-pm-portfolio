import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getDataMode, getMemoryStore, getServiceRepos } from "@/data";
import { deleteChildData } from "@/services/household";
import { createSupabaseServiceClient, createSupabaseUserClient } from "@/data/supabase-clients";
import { isDemoMode } from "@/config/env";
import { DEMO_CHILD_EMAIL, DEMO_NEW_SETUP_EMAIL } from "@/config/demo";
import { hashPassword, verifyPassword } from "./password";
import { issueLink, redeemLink, type ResetLinkState } from "./reset-link";
import { createSessionToken, verifySessionToken } from "./session-token";

// One auth API for both data modes:
// - memory: users in the memory store, signed httpOnly session cookie
// - supabase: Supabase Auth (email + password), cookies managed by @supabase/ssr

const SESSION_COOKIE = "parcare_session";
const SESSION_DAYS = 7;

const globalForAuth = globalThis as unknown as { __parcareSessionSecret?: string };

function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  // Development: fixed so sessions survive restarts. Anywhere else without a secret: random per
  // server process (everyone is signed out on restart, which is safe).
  if (process.env.NODE_ENV === "development") return "parcare-dev-only-session-secret";
  globalForAuth.__parcareSessionSecret ??= randomBytes(32).toString("hex");
  return globalForAuth.__parcareSessionSecret;
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function signInWithPassword(email: string, password: string): Promise<boolean> {
  if (getDataMode() === "supabase") {
    const supabase = await createSupabaseUserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: normaliseEmail(email), password });
    return !error;
  }
  const user = getMemoryStore().snapshot.authUsers.find((u) => u.email === normaliseEmail(email));
  if (!user || !verifyPassword(password, user.passwordHash)) return false;
  await setMemorySession(user.id);
  return true;
}

export type SignUpResult = { ok: true } | { ok: false; reason: "exists" | "failed" };

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const clean = normaliseEmail(email);
  if (getDataMode() === "supabase") {
    const supabase = await createSupabaseUserClient();
    const { data, error } = await supabase.auth.signUp({ email: clean, password });
    if (error) return { ok: false, reason: /registered|exists/i.test(error.message) ? "exists" : "failed" };
    // With "Confirm email" switched off in Supabase (see README) the user is signed in at once.
    return data.session ? { ok: true } : { ok: false, reason: "failed" };
  }
  const store = getMemoryStore();
  if (store.snapshot.authUsers.some((u) => u.email === clean)) return { ok: false, reason: "exists" };
  const id = randomUUID();
  store.snapshot.authUsers.push({ id, email: clean, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
  store.changed();
  await setMemorySession(id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  if (getDataMode() === "supabase") {
    const supabase = await createSupabaseUserClient();
    await supabase.auth.signOut();
    return;
  }
  (await cookies()).delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; email: string };

/** The signed-in user, or null. Reads cookies, so callers must sit behind <Suspense>. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Session checks read cookies and the clock (token expiry): request-time work for Cache Components.
  await connection();
  if (getDataMode() === "supabase") {
    const supabase = await createSupabaseUserClient();
    const { data } = await supabase.auth.getUser();
    return data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token, sessionSecret());
  if (!userId) return null;
  const user = getMemoryStore().snapshot.authUsers.find((u) => u.id === userId);
  return user ? { id: user.id, email: user.email } : null;
}

/**
 * Demo only: makes sure the fictional "new setup" account exists, wipes its data so the wizard
 * starts from scratch, and signs in as it.
 */
export async function signInFreshDemoUser(email: string, password: string): Promise<boolean> {
  if (getDataMode() === "supabase") {
    const admin = createSupabaseServiceClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = data?.users.find((u) => u.email === email);
    // Deleting the auth user cascades to its profile, household and everything in it.
    if (existing) await admin.auth.admin.deleteUser(existing.id);
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return false;
    return signInWithPassword(email, password);
  }
  // Like Supabase: a brand-new login each time (so it also starts with the terms agreement).
  // The old login's agreement record stays, as every agreement record does.
  const store = getMemoryStore();
  const old = store.snapshot.authUsers.find((u) => u.email === email);
  if (old) {
    await deleteChildData(getServiceRepos(), old.id);
    store.snapshot.authUsers = store.snapshot.authUsers.filter((u) => u.id !== old.id);
  }
  store.snapshot.authUsers.push({ id: randomUUID(), email, passwordHash: hashPassword(password), createdAt: new Date().toISOString() });
  store.changed();
  return signInWithPassword(email, password);
}

// ---- Admin: every login, and deleting one ----

export type LoginRow = { id: string; email: string; createdAt: string };

/** Every login (admin page). Server only; Supabase uses the service role. */
export async function listLogins(): Promise<LoginRow[]> {
  if (getDataMode() === "supabase") {
    const admin = createSupabaseServiceClient();
    const rows: LoginRow[] = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error || !data) break;
      rows.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? "", createdAt: u.created_at })));
      if (data.users.length < 200) break;
    }
    return rows;
  }
  return getMemoryStore().snapshot.authUsers.map((u) => ({ id: u.id, email: u.email, createdAt: u.createdAt }));
}

/** Removes a login (its data must already be gone). Afterwards the email can sign up again. */
export async function deleteLogin(userId: string): Promise<boolean> {
  if (getDataMode() === "supabase") {
    const { error } = await createSupabaseServiceClient().auth.admin.deleteUser(userId);
    return !error;
  }
  const store = getMemoryStore();
  store.snapshot.authUsers = store.snapshot.authUsers.filter((u) => u.id !== userId);
  store.changed();
  return true;
}

// ---- Forgot password: a one-time link by email, then a new password ----
// Supabase: its standard "Reset password" email (no custom email settings needed). The link goes
// through Supabase to /auth/reset?code=… on this site, which must be listed under Authentication
// → URL Configuration → Redirect URLs (README). It works in the browser where it was asked for.
// Memory mode: no email can be sent, so the link is shown on screen in demo mode only.
// Neither mode tells anyone whether an email has an account.

const RECOVERY_COOKIE = "parcare_recovery";
/** After opening the link, this long to choose the new password. */
const RECOVERY_MINUTES = 15;

const globalForReset = globalThis as unknown as { __parcareResetLinks?: ResetLinkState };
const resetLinks = () => (globalForReset.__parcareResetLinks ??= new Map());
// A different key from the session cookie's, so one can never be used as the other.
const recoverySecret = () => `${sessionSecret()}:password-recovery`;

const isDemoAccount = (email: string) => [DEMO_CHILD_EMAIL, DEMO_NEW_SETUP_EMAIL].includes(email);

export type SendLinkResult = { ok: true; demoLink?: string } | { ok: false; reason: "tooSoon" | "demoAccount" | "failed" };

/** `siteOrigin` is this site's address (for example https://parcare-six.vercel.app). */
export async function sendPasswordResetLink(email: string, siteOrigin: string): Promise<SendLinkResult> {
  const clean = normaliseEmail(email);
  // The fictional demo logins are shared by the team; their password must stay as in the README.
  if (isDemoAccount(clean)) return { ok: false, reason: "demoAccount" };
  if (getDataMode() === "supabase") {
    const supabase = await createSupabaseUserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(clean, { redirectTo: `${siteOrigin}/auth/reset` });
    if (!error) return { ok: true };
    return { ok: false, reason: error.status === 429 ? "tooSoon" : "failed" };
  }
  const user = getMemoryStore().snapshot.authUsers.find((u) => u.email === clean);
  if (!user) return { ok: true }; // same answer as for a real account
  const issued = issueLink(resetLinks(), clean, Date.now());
  if (!issued.ok) return { ok: false, reason: "tooSoon" };
  return isDemoMode() ? { ok: true, demoLink: `/auth/reset?token=${issued.token}` } : { ok: true };
}

/**
 * Opens a reset link (Supabase `code`, or memory `token`): signs the person in and allows a new
 * password for the next few minutes. False when the link is wrong, used or too old.
 */
export async function openPasswordResetLink(params: { code?: string | null; token?: string | null }): Promise<boolean> {
  let userId: string | null = null;
  if (getDataMode() === "supabase") {
    if (!params.code) return false;
    const supabase = await createSupabaseUserClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error || !data.user) return false;
    userId = data.user.id;
  } else {
    const email = params.token ? redeemLink(resetLinks(), params.token, Date.now()) : null;
    const user = email ? getMemoryStore().snapshot.authUsers.find((u) => u.email === email) : undefined;
    if (!user) return false;
    await setMemorySession(user.id);
    userId = user.id;
  }
  const expires = new Date(Date.now() + RECOVERY_MINUTES * 60 * 1000);
  (await cookies()).set(RECOVERY_COOKIE, createSessionToken(userId, expires, recoverySecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return true;
}

/** The signed-in user, only if they arrived through a reset link a few minutes ago. */
export async function getPasswordRecoveryUser(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const token = (await cookies()).get(RECOVERY_COOKIE)?.value;
  return verifySessionToken(token, recoverySecret()) === user.id ? user : null;
}

export type NewPasswordResult = { ok: true } | { ok: false; reason: "linkExpired" | "samePassword" | "failed" };

export async function setNewPassword(newPassword: string): Promise<NewPasswordResult> {
  const user = await getPasswordRecoveryUser();
  if (!user) return { ok: false, reason: "linkExpired" };
  if (getDataMode() === "supabase") {
    const supabase = await createSupabaseUserClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, reason: error.code === "same_password" ? "samePassword" : "failed" };
    await supabase.auth.signOut({ scope: "others" }); // other phones and browsers must log in again
  } else {
    const store = getMemoryStore();
    const stored = store.snapshot.authUsers.find((u) => u.id === user.id);
    if (!stored) return { ok: false, reason: "failed" };
    if (verifyPassword(newPassword, stored.passwordHash)) return { ok: false, reason: "samePassword" };
    stored.passwordHash = hashPassword(newPassword);
    store.changed();
  }
  (await cookies()).delete(RECOVERY_COOKIE);
  return { ok: true };
}

async function setMemorySession(userId: string): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId, expires, sessionSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}
