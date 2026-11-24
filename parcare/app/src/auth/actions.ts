"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/config/env";
import { DEMO_CHILD_EMAIL, DEMO_CHILD_PASSWORD, DEMO_NEW_SETUP_EMAIL } from "@/config/demo";
import { ensureMemorySample } from "@/data/sample";
import { sendPasswordResetLink, setNewPassword, signInFreshDemoUser, signInWithPassword, signOut, signUp } from "./index";

export type AuthFormState = { error?: "missing" | "invalid" | "exists" | "weakPassword" | "badEmail" | "failed" | "demoOff" };

const MIN_PASSWORD = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email.trim() || !password) return { error: "missing" };
  if (!(await signInWithPassword(email, password))) return { error: "invalid" };
  redirect("/home");
}

export async function demoLoginAction(): Promise<AuthFormState> {
  if (!isDemoMode()) return { error: "demoOff" };
  ensureMemorySample();
  if (!(await signInWithPassword(DEMO_CHILD_EMAIL, DEMO_CHILD_PASSWORD))) return { error: "failed" };
  redirect("/home");
}

/** Demo: a fresh fictional account, straight into the setup wizard. */
export async function demoNewSetupAction(): Promise<AuthFormState> {
  if (!isDemoMode()) return { error: "demoOff" };
  if (!(await signInFreshDemoUser(DEMO_NEW_SETUP_EMAIL, DEMO_CHILD_PASSWORD))) return { error: "failed" };
  redirect("/agree"); // a brand-new login agrees to the terms first, then goes on to setup
}

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email");
  const password = field(formData, "password");
  if (!email.trim() || !password) return { error: "missing" };
  if (!EMAIL_RE.test(email.trim())) return { error: "badEmail" };
  if (password.length < MIN_PASSWORD) return { error: "weakPassword" };
  const result = await signUp(email, password);
  if (!result.ok) return { error: result.reason };
  redirect("/agree"); // a brand-new account agrees to the terms first, then goes on to setup
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}

// ---- Forgot password: a link by email, then a new password ----

export type ForgotState = {
  step: "email" | "sent";
  email?: string;
  /** Demo mode without email: the link, shown on screen. */
  demoLink?: string;
  /** A new link was just sent (after "Send the link again"). */
  resent?: boolean;
  error?: "badEmail" | "tooSoon" | "demoAccount" | "failed";
};

/** This site's own address, for the link in the email. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function forgotPasswordAction(prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const intent = field(formData, "intent");
  if (intent === "restart") return { step: "email" };
  const email = field(formData, "email").trim();
  if (!EMAIL_RE.test(email)) return { step: "email", email, error: "badEmail" };
  const sent = await sendPasswordResetLink(email, await siteOrigin());
  if (!sent.ok) return { ...prev, step: intent === "resend" ? "sent" : "email", email, error: sent.reason, resent: false };
  return { step: "sent", email, demoLink: sent.demoLink, resent: intent === "resend" };
}

export type NewPasswordState = { error?: "weakPassword" | "mismatch" | "samePassword" | "linkExpired" | "failed" };

export async function newPasswordAction(_prev: NewPasswordState, formData: FormData): Promise<NewPasswordState> {
  const password = field(formData, "password");
  if (password.length < MIN_PASSWORD) return { error: "weakPassword" };
  if (password !== field(formData, "confirm")) return { error: "mismatch" };
  const result = await setNewPassword(password);
  if (!result.ok) return { error: result.reason };
  redirect("/home"); // signed in with the new password
}
