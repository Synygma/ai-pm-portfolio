import { expect, test } from "@playwright/test";
import { demoLogin, localHHMM, openDemo, resetDemoData } from "./helpers";

test.afterAll(async ({ browser }) => resetDemoData(browser));

test("digest list and detail: own words, factual pattern note, Matched is stored", async ({ page }) => {
  await demoLogin(page);
  await page.getByRole("navigation", { name: "Main sections" }).getByRole("link", { name: "Digest" }).click();
  // 7 sample digests, plus today's once it is past 19:00 in London.
  await expect.poll(() => page.getByTestId("digest-row").count()).toBeGreaterThanOrEqual(7);

  // The day without a walk shows the pattern note.
  await page.getByTestId("digest-row").filter({ hasText: "1 change from usual" }).click();
  await expect(page).toHaveURL(/\/digest\/[0-9a-f-]+$/);
  await expect(page.getByTestId("digest-quote").filter({ hasText: "No walk today, it was raining. I stayed in." })).toHaveCount(1);
  await expect(page.getByTestId("digest-flags")).toContainText("Morning walk: usually around 06:30. This time Maa said it did not happen.");
  await expect(page.getByTestId("digest-flags")).toContainText("This is not medical advice.");
  await expect(page.getByText("Only the check-ins Maa chose to share appear here.")).toBeVisible();

  const matched = page.getByRole("button", { name: "Matched what my parent told me" });
  await matched.click();
  await expect(page.getByTestId("feedback-saved")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Matched what my parent told me" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("link", { name: "Back to digests" }).click();
  await expect(page.getByTestId("digest-row").filter({ hasText: "1 change from usual" })).toContainText("Matched");
});

test("real time: answer a check-in, set the digest for the next minute, the digest arrives quoting it", async ({ page }) => {
  test.setTimeout(180_000);
  await demoLogin(page);

  // Parent answers live (no demo-clock jump).
  await openDemo(page);
  await expect(page.getByText("Real time.")).toBeVisible();
  const words = `Took my tablet after breakfast, real-time check ${Date.now() % 10000}.`;
  await page.getByLabel("Answer the next check-in").fill(words);
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Answer saved in the parent’s own words.");

  // Digest time = the next minute, Priya's time (London).
  const time = localHHMM("Europe/London", 1);
  await page.goto("/settings");
  await page.getByLabel("Daily digest time").fill(time);
  await page.getByTestId("digest-time").getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(`Saved. The next digest arrives at ${time}.`)).toBeVisible();

  // Wait: the open app's poll runs the engine every 10 s, as cron would in production. The newest
  // digest then quotes her words (whatever the time of day, so no fixed digest count).
  await expect
    .poll(
      async () => {
        await page.goto("/chat");
        await page.getByTestId("bubble-digest").last().getByRole("link", { name: "Open digest" }).click();
        await expect(page).toHaveURL(/\/digest\/[0-9a-f-]+$/);
        return page.getByTestId("digest-quote").filter({ hasText: words }).count();
      },
      { timeout: 130_000, intervals: [10_000] },
    )
    .toBe(1);
});
