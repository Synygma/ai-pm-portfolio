import { expect, test } from "@playwright/test";
import { demoLogin, localHHMM, localYMD, openDemo, resetDemoData } from "./helpers";

test.afterAll(async ({ browser }) => resetDemoData(browser));

test("helper list: requests with the helper badge, New -> Seen -> Done (then only Done shows)", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/helper");
  const items = page.getByTestId("helper-item");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText("Can someone bring a refill of my BP tablets from the chemist this week?");
  await expect(items.first().getByTestId("helper-status")).toHaveText("New");
  await expect(items.first().getByTestId("helper-badge")).toBeVisible();
  await expect(items.nth(1).getByTestId("helper-status")).toHaveText("Done");
  await expect(page.getByText("ParCare does not book services.")).toBeVisible();

  // Opening the list marked it Seen.
  await expect.poll(async () => {
    await page.reload();
    return page.getByTestId("helper-item").first().getByTestId("helper-status").textContent();
  }).toBe("Seen");

  await items.first().getByRole("button", { name: "Mark as done" }).click();
  await expect(items.first().getByTestId("helper-status")).toHaveText("Done");
  // Once done, only "Done" shows: no buttons left on it.
  await expect(items.first().getByRole("button")).toHaveCount(0);
  await expect(items.nth(1).getByRole("button")).toHaveCount(0);
});

test("reminders: sample with My Child picture; typed reminder rings at the parent's time and gets OK", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/reminders");
  const sample = page.getByTestId("reminder-item").filter({ hasText: "Drink a glass of water after your walk" });
  await expect(sample).toContainText("Sample");
  await expect(sample.getByRole("img", { name: "My Child" })).toBeVisible();
  await expect(sample.getByTestId("reminder-status")).toHaveText("Scheduled");
  const chip = sample.getByTestId("speed-chip");
  await expect(chip).toHaveText("1×");
  // Retried: on the dev server a click before hydration is dropped.
  await expect(async () => {
    if ((await chip.textContent()) === "1×") await chip.click();
    await expect(chip).toHaveText("1.5×", { timeout: 2000 });
  }).toPass();
  await expect(sample.getByRole("button", { name: "Play voice note" })).toBeVisible();

  // New typed reminder, 3 minutes from now in Maa's time (Asia/Kolkata).
  await page.getByTestId("new-reminder").click();
  await expect(page.getByRole("heading", { name: "New reminder" })).toBeVisible();
  await page.getByRole("button", { name: "Save reminder" }).click();
  await expect(page.getByText("Record your voice or type a short note.")).toBeVisible();
  await page.getByLabel("Short note").fill("Call me after lunch");
  await page.getByLabel("Date").fill(localYMD("Asia/Kolkata", 3));
  const time = localHHMM("Asia/Kolkata", 3);
  await page.getByLabel("Time").fill(time);
  await expect(page.getByTestId("reminder-child-time")).toContainText(`${localHHMM("Europe/London", 3)} your time`);
  await page.getByRole("button", { name: "Save reminder" }).click();
  await expect(page).toHaveURL(/\/reminders$/);
  const mine = page.getByTestId("reminder-item").filter({ hasText: "Call me after lunch" });
  await expect(mine.getByTestId("reminder-status")).toHaveText("Scheduled");
  await expect(mine.getByTestId("reminder-when")).toContainText(`${time}, Maa’s time`);

  // Clock +5 min -> it rings for the parent; the parent says OK.
  await openDemo(page);
  await page.getByRole("button", { name: "+5 min" }).click();
  await expect(page.getByTestId("ringing-reminder")).toHaveText("Ringing for the parent now: Call me after lunch");
  await page.getByRole("button", { name: "Parent says OK" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Parent said OK.");
  await page.goto("/reminders");
  await expect(page.getByTestId("reminder-item").filter({ hasText: "Call me after lunch" }).getByTestId("reminder-status")).toHaveText("Parent said OK");
});

test.describe("recording", () => {
  // The fake microphone itself is set in playwright.config.ts.
  test.use({ permissions: ["microphone"] });

  test("records a short voice note with a visible mic indicator, saves and plays it back", async ({ page }) => {
    await demoLogin(page);
    await page.goto("/reminders/new");
    await page.getByRole("button", { name: "Record your voice" }).click();
    await expect(page.getByTestId("recording-on")).toBeVisible();
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: "Stop" }).click();
    await expect(page.getByTestId("recording-on")).toHaveCount(0);
    await expect(page.getByTestId("recording-preview").getByTestId("voice-note")).toBeVisible();
    await page.getByRole("button", { name: "Save reminder" }).click();
    await expect(page).toHaveURL(/\/reminders$/);

    const item = page.getByTestId("reminder-item").filter({ hasText: "Voice reminder" });
    await expect(item.getByTestId("voice-note")).toBeVisible();
    const src = await page.evaluate(() => {
      // The stored clip is served only to this signed-in child.
      const html = document.body.innerHTML;
      return html.match(/\/api\/voice\/[0-9a-f-]+\/[0-9a-f-]+\.(webm|ogg|m4a)/)?.[0] ?? null;
    });
    expect(src).toMatch(/^\/api\/voice\/[0-9a-f-]+\/[0-9a-f-]+\.(webm|ogg|m4a)$/);
    const res = await page.request.get(src!);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/^audio\//);
    expect((await res.body()).byteLength).toBeGreaterThan(100);
    // Signed out, the clip is not served.
    const anon = await page.context().browser()!.newContext();
    expect((await anon.request.get(new URL(src!, page.url()).toString())).status()).toBe(404);
    await anon.close();
  });
});
