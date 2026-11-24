"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/config/env";
import { getDataMode, getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { restoreMemorySample } from "@/data/sample";
import { appNow } from "@/domain/clock";
import { answerNextCheckin, createHelperRequest, setAllConsents, tickHousehold } from "@/services/checkins";
import { askNextNow, changeCompanion, type ClockStep, letNextGoUnanswered, moveClock } from "@/services/demo";
import { answerRingingReminder } from "@/services/reminders";

// Demo tools (5.12). Every action is refused unless DEMO_MODE=true.

export type DemoResult = { ok: true; alarm?: boolean; message?: string; count?: number } | { ok: false; reason: "demoOff" | "noHousehold" | "nothingDue" | "empty" | "invalid" | "noReminder" };

async function demoContext() {
  if (!isDemoMode()) return null;
  const child = await getCurrentChild();
  if (!child?.household) return null;
  return { child, household: child.household, repos: await getRepos() };
}

const done = (r: DemoResult): DemoResult => {
  revalidatePath("/", "layout");
  return r;
};

export async function moveClockAction(step: ClockStep | "reset"): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: isDemoMode() ? "noHousehold" : "demoOff" };
  const result = await moveClock(ctx.repos, ctx.household, step);
  return done({ ok: true, alarm: result.escalated > 0, count: result.alerts.length });
}

export async function answerAction(text: string, outcome: "yes" | "no"): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  if (!text.trim()) return { ok: false, reason: "empty" };
  const r = await answerNextCheckin(ctx.repos, ctx.household.id, text.trim(), outcome, appNow(ctx.household));
  return done({ ok: true, alarm: r.emergency !== null });
}

export async function letGoUnansweredAction(): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  const alert = await letNextGoUnanswered(ctx.repos, ctx.household);
  if (!alert) return { ok: false, reason: "nothingDue" };
  return done({ ok: true, alarm: true });
}

export async function askNextNowAction(): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  const id = await askNextNow(ctx.repos, ctx.household);
  if (!id) return { ok: false, reason: "nothingDue" };
  return done({ ok: true });
}

export async function helperRequestAction(text: string): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  if (!text.trim()) return { ok: false, reason: "empty" };
  const r = await createHelperRequest(ctx.repos, ctx.household.id, text.trim(), appNow(ctx.household));
  return done({ ok: true, alarm: r.emergency !== null });
}

export async function setAllConsentsAction(on: boolean): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  const now = appNow(ctx.household);
  const count = await setAllConsents(ctx.repos, ctx.household, on, now);
  await tickHousehold(ctx.repos, ctx.household, now);
  return done({ ok: true, count });
}

export async function changeCompanionAction(avatarId: string): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  try {
    await changeCompanion(ctx.repos, ctx.household, avatarId);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  return done({ ok: true });
}

/** Memory mode only: back to fresh sample data. Seed ids are fixed, so sessions stay valid. */
export async function resetDemoDataAction(): Promise<DemoResult> {
  if (!isDemoMode()) return { ok: false, reason: "demoOff" };
  if (getDataMode() !== "memory") return { ok: false, reason: "invalid" };
  restoreMemorySample();
  return done({ ok: true });
}

/** The parent answers the ringing voice reminder: "OK" or "Snooze 10 min". */
export async function answerReminderAction(answer: "ok" | "snooze"): Promise<DemoResult> {
  const ctx = await demoContext();
  if (!ctx) return { ok: false, reason: "noHousehold" };
  const r = await answerRingingReminder(ctx.repos, ctx.household.id, answer, appNow(ctx.household));
  if (!r) return { ok: false, reason: "noReminder" };
  return done({ ok: true });
}
