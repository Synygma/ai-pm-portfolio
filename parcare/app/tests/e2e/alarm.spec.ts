import { expect, test } from "@playwright/test";
import { demoLogin, openDemo, resetDemoData } from "./helpers";

test.afterAll(async ({ browser }) => resetDemoData(browser));

test("/api/tick needs the cron secret", async ({ request }) => {
  expect((await request.post("/api/tick")).status()).toBe(401);
  expect((await request.post("/api/tick", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);
  const ok = await request.post("/api/tick", { headers: { Authorization: "Bearer e2e-only-cron-secret" } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ ok: true });
});

test("missed check-in: demo clock, parent lets it go unanswered, alarm, switch off, history", async ({ page }) => {
  await demoLogin(page);
  await openDemo(page);

  // Demo clock moves and shows both time zones.
  const before = await page.getByTestId("child-now").textContent();
  await page.getByRole("button", { name: "+1 hour" }).click();
  await expect(page.getByTestId("child-now")).not.toHaveText(before ?? "");
  await expect(page.getByText("60 minutes ahead of real time.")).toBeVisible();
  await expect(page.getByTestId("demo-upcoming").getByRole("listitem").first()).toBeVisible();

  // Parent does not answer -> prompt 1, prompt 2, then the child alarm.
  await page.getByRole("button", { name: "Let the next check-in go unanswered" }).click();
  await expect(page).toHaveURL(/\/alarm$/);
  const alarm = page.getByTestId("alarm-missed");
  await expect(alarm.getByRole("heading", { name: "Check-in not answered" })).toBeVisible();
  await expect(page.locator("#alarm-text")).toHaveText("I checked in with Maa twice and did not hear back.");
  await expect(page.locator("#alarm-text")).not.toContainText(/emergency/i);
  await expect(page.getByTestId("alarm-contact")).toContainText("Mrs. Verma");
  await expect(page.getByTestId("alarm-contact")).toContainText("ParCare never calls anyone.");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);

  // It keeps ringing until switched off: leaving and coming back shows it again.
  await page.goto("/home");
  await expect(page).toHaveURL(/\/alarm$/, { timeout: 20_000 });

  await page.getByRole("button", { name: "Switch off", exact: true }).click();
  await expect(page).toHaveURL(/\/alerts$/);
  const missed = page.getByTestId("alert-missed_checkin").first();
  await expect(missed).toContainText("I checked in with Maa twice and did not hear back.");
  await expect(missed).toContainText("Switched off:");

  // The alarm also appears in the companion chat.
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-alert").last()).toContainText("You switched off the alarm at");
});

test("emergency word in a helper request rings the distinct alarm; normal answers do not", async ({ page }) => {
  await demoLogin(page);
  await openDemo(page);

  await page.getByLabel("Answer the next check-in").fill("Took my tablet after breakfast.");
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Answer saved in the parent’s own words.");

  await page.getByRole("button", { name: "Fill a normal request" }).click();
  await page.getByRole("button", { name: "Send helper request" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Helper request sent.");

  await page.getByRole("button", { name: "Fill with an emergency word" }).click();
  await expect(page.getByLabel("Send a helper request")).toHaveValue("Help me, I fell in the bathroom.");
  await page.getByRole("button", { name: "Send helper request" }).click();
  await expect(page).toHaveURL(/\/alarm$/);
  await expect(page.getByTestId("alarm-emergency")).toBeVisible();
  await expect(page.locator("#alarm-text")).toHaveText("Maa used an emergency word. The app asked them to contact local help.");
  await page.getByRole("button", { name: "Switch off", exact: true }).click();
  await expect(page).toHaveURL(/\/alerts$/);
  await expect(page.getByTestId("alert-emergency_word").first()).toContainText("Switched off:");
});

test("parent switches off all check-ins: child is told, and the companion can change", async ({ page }) => {
  await demoLogin(page);
  await openDemo(page);
  await expect(page.getByTestId("demo-consents")).toContainText("7 of 7");
  await page.getByRole("button", { name: "Parent switches off all check-ins" }).click();
  await expect(page.getByTestId("demo-consents")).toContainText("0 of 7");
  await expect(page.getByTestId("demo-upcoming")).toContainText("No check-ins are switched on.");

  await page.getByLabel("Parent changes their companion").selectOption("guruji");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Companion changed.");
  await expect(page.getByLabel("Parent changes their companion").locator("option")).toHaveCount(11);

  await page.goto("/chat");
  await expect(page.getByRole("heading", { name: "Guruji" })).toBeVisible();
  await expect(page.getByTestId("bubble-alert").last()).toContainText("All check-ins are switched off. Please talk to Maa.");

  await page.goto("/demo");
  await page.getByRole("button", { name: "Parent agrees to all check-ins" }).click();
  await expect(page.getByTestId("demo-consents")).toContainText("7 of 7");
});

test("several missed check-in alarms: one Switch off says what happened; 'Switch off all' clears the rest (P-036, P-037)", async ({ page }) => {
  await demoLogin(page);
  for (let i = 0; i < 3; i++) {
    await openDemo(page);
    await page.getByRole("button", { name: "Let the next check-in go unanswered" }).click();
    await expect(page).toHaveURL(/\/alarm$/);
  }
  await expect(page.getByText("2 more alarms after this one")).toBeVisible();
  await page.getByRole("button", { name: "Switch off", exact: true }).click();
  await expect(page.getByTestId("alarm-next-note")).toHaveText("Switched off. This is the next alarm.");
  await expect(page.getByText("1 more alarm after this one")).toBeVisible();
  await page.getByTestId("switch-off-all").click();
  await expect(page).toHaveURL(/\/alerts$/);
});
