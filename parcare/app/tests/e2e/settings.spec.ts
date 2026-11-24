import { expect, test } from "@playwright/test";
import { demoLogin, openDemo, resetDemoData } from "./helpers";

test.afterAll(async ({ browser }) => resetDemoData(browser));

test("settings: the parent's check-ins and companion are read-only; gallery, language, review, terms", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/settings");
  // Alarm notifications: both choices are always shown.
  await expect(page.getByTestId("push-choice-on")).toBeVisible();
  await expect(page.getByTestId("push-choice-off")).toBeVisible();

  const checkins = page.getByTestId("settings-checkins");
  await expect(checkins).toContainText("Your parent controls these. Only Maa can change, pause or stop them, in their app.");
  await expect(checkins.getByTestId("settings-checkin")).toHaveCount(7);
  await expect(checkins.getByTestId("settings-checkin").filter({ hasText: "Woken up" })).toContainText(/06:00, Maa’s time \(\d\d:\d\d your time\)/);
  await expect(checkins.locator("input, select, button")).toHaveCount(0);

  const companion = page.getByTestId("settings-companion");
  await expect(companion).toContainText("Vidya, Maa’s ParCare AI companion");
  await expect(companion).toContainText("Your parent chooses this.");
  await expect(companion.locator("input, select, button")).toHaveCount(0);

  const language = page.getByTestId("language-select");
  await expect(language).toHaveValue("en");
  await expect(language.locator('option[value="hi"]')).toBeDisabled();
  await expect(language.locator('option[value="hi"]')).toHaveText("हिन्दी (Hindi): coming soon");

  await expect(page.getByTestId("settings-review")).toContainText("then every 3 months");
  await expect(page.getByTestId("settings-review")).toContainText("Next reminder:");
  await expect(page.getByTestId("terms-accepted")).toContainText("You agreed to terms version 2026-11-v2");
  await expect(page.getByTestId("settings-emergency")).toContainText("Mrs. Verma");

  // Gallery: 11 companions, the chosen one marked, "My Child" never a companion, helper look.
  await page.goto("/settings/companions");
  const grid = page.getByTestId("companion-grid");
  await expect(grid.getByRole("listitem")).toHaveCount(11);
  await expect(grid).not.toContainText("My Child");
  await expect(page.getByTestId("companion-chosen")).toContainText("Vidya");
  await expect(page.getByTestId("companion-chosen")).toContainText("Chosen by Maa");
  await expect(page.getByTestId("my-child-note")).toContainText("It can never be chosen as a companion.");
  await expect(page.getByTestId("helper-badge")).toBeVisible();
  for (const img of await page.locator("main img").all()) {
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveJSProperty("complete", true);
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  }

  // Can / cannot + T&C, always reachable.
  await page.goto("/settings");
  await page.getByTestId("terms-link").click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByTestId("terms-content")).toContainText("It is not an emergency service and never calls anyone.");
  await expect(page.getByTestId("terms-content")).toContainText("Terms version 2026-11-v2");
});

test("terms are reachable before signing in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "What ParCare can and cannot do" }).click();
  await expect(page).toHaveURL(/\/terms$/);
  await expect(page.getByRole("heading", { name: "ParCare cannot" })).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "What ParCare can and cannot do" })).toHaveAttribute("href", "/terms");
});

test("emergency contact in Settings: 'No' stores nothing, 'Yes' replaces, remove; time zone", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/settings/emergency-contact");
  await expect(page.getByTestId("emergency-current")).toContainText("Mrs. Verma");

  await page.getByLabel("Name").fill("Mr. Das");
  await page.getByLabel("Phone number").fill("+91 00000 22222");
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByTestId("emergency-not-stored")).toContainText("Not saved. Please tell Mr. Das first");
  await expect(page.getByTestId("emergency-current")).toContainText("Mrs. Verma");
  await expect(page.getByLabel("Name")).toHaveValue("");

  await page.getByLabel("Name").fill("Mr. Das");
  await page.getByLabel("Phone number").fill("+91 00000 22222");
  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("button", { name: "Save contact" }).click();
  await expect(page.getByText("Saved. Mr. Das is your emergency contact.")).toBeVisible();
  await expect(page.getByTestId("emergency-current")).toContainText("Mr. Das, +91 00000 22222");

  await page.getByRole("button", { name: "Remove this contact" }).click();
  await expect(page.getByText("Contact removed.")).toBeVisible();
  await page.goto("/settings");
  await expect(page.getByTestId("settings-emergency")).toContainText("No emergency contact saved.");

  const tz = page.getByTestId("settings-timezone");
  // A real list now (the old free-text box with suggestions showed only the zone already typed).
  await expect.poll(() => tz.getByLabel("Your time zone").locator("option").count()).toBeGreaterThan(100);
  await tz.getByLabel("Your time zone").selectOption("Asia/Dubai");
  await tz.getByRole("button", { name: "Save" }).click();
  await expect(tz.getByRole("status")).toHaveText("Saved: Asia/Dubai");
  await page.reload();
  await expect(page.getByTestId("digest-time")).toContainText("Your time (Asia/Dubai)");
});

test("review prompt: 'Done, we talked', then again 3 months later; all check-ins off shows on home", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/chat");
  const review = page.getByTestId("bubble-alert").filter({ hasText: "Check with Maa that all is OK" });
  await expect(review).toHaveCount(1);
  // On the dev server a tap before the chat page is interactive can be lost: tap until it is done.
  await expect(async () => {
    if (await review.getByTestId("review-done").isVisible()) await review.getByTestId("review-done").click();
    await expect(review).toContainText("You marked this done at", { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  await expect(review.getByTestId("review-done")).toHaveCount(0);
  await page.goto("/alerts");
  await expect(page.getByTestId("alert-review").first()).toContainText("Done:");

  await openDemo(page);
  await page.getByRole("button", { name: "+3 months" }).click();
  await expect(page.getByText(/ahead of real time/)).toBeVisible();
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-alert").filter({ hasText: "Check with Maa that all is OK" })).toHaveCount(2);

  await page.goto("/demo");
  await page.getByRole("button", { name: "Parent switches off all check-ins" }).click();
  await expect(page.getByTestId("demo-consents")).toContainText("0 of 7");
  await page.goto("/home");
  await expect(page.getByTestId("consent-banner")).toContainText("All check-ins are switched off. Please talk to Maa.");
  await page.goto("/settings");
  await expect(page.getByTestId("settings-all-disabled")).toHaveText("All check-ins are switched off. Please talk to Maa.");
});

test("delete all our data: needs the tick, signs out; Demo login brings the sample back", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/settings/delete");
  await expect(page.getByText("including every voice clip")).toBeVisible();
  await page.getByRole("button", { name: "Delete everything" }).click();
  await expect(page).toHaveURL(/\/settings\/delete$/); // the tick is required
  await page.getByRole("checkbox", { name: "I understand this cannot be undone" }).check();
  await page.getByRole("button", { name: "Delete everything" }).click();
  await expect(page).toHaveURL(/\/deleted$/);
  await expect(page.getByRole("status")).toHaveText("Your family’s data has been deleted.");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);

  await demoLogin(page);
  await expect(page.getByTestId("companion-chat-row")).toContainText("Vidya");
});
