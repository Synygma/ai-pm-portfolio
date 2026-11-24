import { expect, test } from "@playwright/test";
import { demoLogin, resetDemoData, switchOffAlarms } from "./helpers";

// Admin page (P-027): its own login, logins with activity bands, delete a test user so the same
// email can sign up again, and gentle check-in notes (no marketing) to children's apps.

test.afterAll(async ({ browser }) => resetDemoData(browser));

const ADMIN = { email: "admin@example.com", password: "e2e-only-admin-password" }; // playwright.config.ts

async function adminLogin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Admin email").fill(ADMIN.email);
  await page.getByLabel("Admin password").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 45_000 });
}

test("admin login is separate; a child login cannot open it; wrong password refused", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 45_000 });
  await page.getByLabel("Admin email").fill(ADMIN.email);
  await page.getByLabel("Admin password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "do not match" })).toBeVisible();

  await adminLogin(page);
  await expect(page.getByTestId("bands")).toContainText("Activity bands (last 14 days)");
  const priya = page.getByTestId("admin-user").filter({ hasText: "demo.child@example.com" });
  await expect(priya).toContainText("Priya Sharma");
  await expect(priya.getByTestId("user-band")).toBeVisible();
  await expect(priya).toContainText("cannot be deleted here");
  await expect(priya.getByTestId("delete-user")).toHaveCount(0);
});

test("delete a test user: the same email can sign up again and starts fresh", async ({ page, browser }) => {
  const email = `tester.${Date.now()}@example.com`;
  const signUp = async () => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("a-long-password");
    await page.getByRole("button", { name: "Create account" }).click();
  };
  await signUp();
  await expect(page).toHaveURL(/\/agree$/, { timeout: 45_000 });

  const admin = await browser.newPage();
  await adminLogin(admin);
  const row = admin.getByTestId("admin-user").filter({ hasText: email });
  await expect(row).toContainText("Child setup not finished");
  await row.getByRole("checkbox").check();
  await row.getByTestId("delete-user").click();
  await expect(admin.getByTestId("user-deleted")).toBeVisible({ timeout: 45_000 });
  await expect(admin.getByTestId("admin-user").filter({ hasText: email })).toHaveCount(0);

  // The old browser session is gone; the same email signs up again from the start.
  await page.context().clearCookies();
  await signUp();
  await expect(page).toHaveURL(/\/agree$/, { timeout: 45_000 });
  await admin.close();
});

test("gentle check-in: marketing refused; a fixed note reaches the child's chat", async ({ page, browser }) => {
  // "All is OK" for the sample family: no alarm left ringing.
  await demoLogin(page);
  await switchOffAlarms(page);
  const admin = await browser.newPage();
  await adminLogin(admin);
  const form = admin.getByTestId("send-note");
  await expect(form).toContainText("No marketing");

  await form.getByTestId("note-custom").check();
  await form.getByTestId("note-text").fill("Special offer: upgrade to premium today");
  await form.getByTestId("note-gentle").check();
  await form.getByRole("button", { name: "Send to all families where all is OK" }).click();
  await expect(form.getByTestId("note-error")).toContainText("looks like marketing");

  await form.getByRole("radio", { name: /Wishing you a calm weekend/ }).check();
  await form.getByRole("button", { name: "Send to all families where all is OK" }).click();
  await expect(form.getByTestId("note-sent")).toContainText("Sent to");
  await expect(admin.getByText("Sent recently")).toBeVisible();
  await admin.close();

  await demoLogin(page);
  await page.goto("/chat");
  // Sent only where all is OK; the sample family has no alarm ringing at the start.
  await expect(page.getByTestId("chat-messages")).toContainText("A note from the ParCare team: Wishing you a calm weekend.");
});
