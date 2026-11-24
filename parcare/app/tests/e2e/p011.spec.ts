import { expect, test } from "@playwright/test";
import { demoLogin, openDemo, resetDemoData } from "./helpers";

// Changes requested after C8 (P-011): digest Skip, summaries in words, the data-keeping setting.
test.afterAll(async ({ browser }) => resetDemoData(browser));

test("digest: Skip is stored and shown in the list", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/digest");
  await page.getByTestId("digest-row").first().click();
  await expect(page).toHaveURL(/\/digest\/[0-9a-f-]+$/);
  const skip = page.getByRole("button", { name: "Skip, I have not checked" });
  await expect(async () => {
    await skip.click();
    await expect(skip).toHaveAttribute("aria-pressed", "true", { timeout: 2000 });
  }).toPass();
  await page.goto("/digest");
  await expect(page.getByTestId("digest-row").first()).toContainText("Skipped");
});

test("weekly and monthly summaries: in words, with days, no totals; her own words", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/digest");
  await expect(page.getByTestId("summary-links").getByRole("link")).toHaveCount(2);

  await page.goto("/digest/week");
  await expect(page.getByRole("heading", { name: "Weekly summary" })).toBeVisible();
  const lines = page.getByTestId("summary-lines");
  await expect(lines.getByTestId("summary-line").filter({ hasText: "Morning walk" })).toContainText(/Did not happen on \w{3} \d{1,2} \w{3}\./);
  await expect(lines.getByTestId("summary-line").filter({ hasText: "Evening puja" })).toContainText("Happened as planned whenever Maa was asked.");
  await expect(lines).not.toContainText(/%|\d+ of \d+|score/i);
  await expect(page.getByTestId("summary-quote").first()).toBeVisible();
  await expect(page.getByText("This is not medical advice.", { exact: false })).toBeVisible();

  await page.goto("/digest/month");
  await expect(page.getByRole("heading", { name: "Monthly summary" })).toBeVisible();
  await expect(page.getByTestId("summary-line").first()).toBeVisible();
});

test("helper: a request marked done shows only 'Done'", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/helper");
  const done = page.getByTestId("helper-item").filter({ hasText: "kitchen tap" });
  await expect(done.getByTestId("helper-status")).toHaveText("Done");
  await expect(done.getByRole("button")).toHaveCount(0);
});

test("data setting: 8 days / 15 days / 1 month; a shorter period deletes older words and digests", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/settings");
  const card = page.getByTestId("settings-retention");
  await expect(card).toContainText("never kept longer than a month: after a month they are deleted");
  await expect(card).toContainText("Kept always: the record that you agreed to the terms");
  await expect(card.getByRole("radio", { name: "1 month (the longest)" })).toBeChecked();

  // Move the clock a week on, then keep only 8 days: the older sample digests go.
  await openDemo(page);
  await page.getByRole("button", { name: "+1 week" }).click();
  await expect(page.getByText(/ahead of real time/)).toBeVisible();
  await page.goto("/digest");
  const before = await page.getByTestId("digest-row").count();

  await page.goto("/settings");
  await card.getByRole("radio", { name: "8 days" }).check();
  await card.getByRole("button", { name: "Save" }).click();
  await expect(card.getByRole("status")).toHaveText("Saved. Older items are deleted after 8 days.");
  await page.goto("/digest");
  await expect.poll(() => page.getByTestId("digest-row").count()).toBeLessThan(before);
  await page.goto("/settings");
  await expect(page.getByTestId("settings-retention").getByRole("radio", { name: "8 days" })).toBeChecked();
});
