import { expect, type Browser, type Page } from "@playwright/test";

export async function demoLogin(page: Page) {
  await page.goto("/login");
  // Already signed in on this "phone": the login page goes straight to the chats (P-038).
  const button = page.getByRole("button", { name: "Demo login", exact: true });
  await expect
    .poll(async () => /\/(home|alarm)$/.test(page.url()) || (await button.isVisible()), { timeout: 45_000 })
    .toBe(true);
  if (/\/(home|alarm)$/.test(page.url())) return;
  await button.click();
  await expect(page).toHaveURL(/\/home$/, { timeout: 45_000 });
}

export async function openDemo(page: Page) {
  // Opened directly: on the dev server a click during the first compile can land before hydration.
  await page.goto("/demo");
  await expect(page.getByTestId("demo-clock")).toBeVisible({ timeout: 45_000 });
}

/** Switches off every ringing alarm (the app keeps opening the alarm page until each is off). */
export async function switchOffAlarms(page: Page) {
  for (let i = 0; i < 8; i++) {
    await page.goto("/alarm");
    const off = page.getByRole("button", { name: "Switch off", exact: true });
    await expect(page.getByTestId("no-alarm").or(off)).toBeVisible({ timeout: 45_000 });
    if (!(await off.isVisible())) return;
    // P-036: several missed check-in alarms go in one tap.
    const all = page.getByTestId("switch-off-all");
    if (await all.isVisible()) {
      await all.click();
      await expect(all).toHaveCount(0, { timeout: 15_000 }).catch(() => undefined);
      continue;
    }
    await off.click();
    // With another alarm still ringing the page stays on /alarm; otherwise it goes to /alerts.
    await expect(off).toHaveCount(0, { timeout: 15_000 }).catch(() => undefined);
  }
}

/** Puts the shared sample data back so later tests start from the seed. */
export async function resetDemoData(browser: Browser) {
  const page = await browser.newPage();
  await demoLogin(page);
  // A test may have left an alarm ringing: the app (rightly) keeps opening it until switched off.
  await switchOffAlarms(page);
  await openDemo(page);
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Sample data restored.");
  await page.close();
}

/** "HH:MM" in a time zone, `addMinutes` from now. */
export function localHHMM(timeZone: string, addMinutes = 0): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(Date.now() + addMinutes * 60000));
}

/** "YYYY-MM-DD" in a time zone, `addMinutes` from now. */
export function localYMD(timeZone: string, addMinutes = 0): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + addMinutes * 60000));
}

/** The once-only "can and cannot do" agreement before first use (P-011 item 0). */
export async function agreeToTerms(page: Page) {
  await expect(page).toHaveURL(/\/agree$/, { timeout: 45_000 });
  await expect(page.getByTestId("terms-content")).toContainText("ParCare cannot");
  await page.getByRole("checkbox", { name: /I understand what ParCare can and cannot do/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
}

/**
 * "Demo: start a new setup" and the child's 9 steps with typed answers (Asha in Leeds, her mother
 * "Amma" in Pune). Ends on the child's home screen. Returns the one-time invite link.
 */
export async function quickChildSetup(page: Page, description: string): Promise<string> {
  const next = () => page.getByRole("button", { name: "Next", exact: true }).click();
  const step = (n: number) => expect(page.getByTestId("setup-progress")).toHaveText(`Step ${n} of 9`);
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo: start a new setup" }).click();
  await agreeToTerms(page);
  await expect(page).toHaveURL(/\/setup$/, { timeout: 45_000 });
  await step(1);
  await page.getByLabel("Your name").fill("Asha Rao");
  await page.getByLabel(/Pet name your parents use/).fill("Chinni");
  await page.getByLabel("Country").selectOption("United Kingdom");
  await page.getByLabel("City").fill("Leeds");
  await expect(page.getByLabel("Time zone")).toHaveValue("Europe/London");
  await next();
  await step(2);
  const p1 = page.getByTestId("parent-0");
  await p1.getByLabel("Name", { exact: true }).fill("Lakshmi Rao");
  await p1.getByLabel("What you call them").fill("Amma");
  await p1.getByLabel("City").fill("Pune");
  await expect(p1.getByLabel("Time zone")).toHaveValue("Asia/Kolkata");
  await next();
  await step(3);
  await next();
  await step(4);
  await next();
  await step(5);
  await page.getByLabel("Description").fill(description);
  await page.getByRole("button", { name: "Make the check-in list" }).click();
  await expect(page.getByTestId("meta-item").first()).toBeVisible();
  await next();
  await step(6);
  await page.getByRole("button", { name: "Skip for now" }).click();
  await step(7);
  await page.getByRole("button", { name: "Create invite link" }).click();
  await expect(page.getByTestId("invite-url")).toContainText("/p/");
  const inviteUrl = ((await page.getByTestId("invite-url").textContent()) ?? "").trim();
  await next();
  await step(8);
  await next();
  await step(9);
  await page.getByRole("checkbox", { name: "I have read this and agree" }).check();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/home$/);
  return inviteUrl;
}
