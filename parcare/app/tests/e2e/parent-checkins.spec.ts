import { expect, type Page, test } from "@playwright/test";
import { demoLogin, openDemo, resetDemoData, switchOffAlarms } from "./helpers";

// Parent app P3: Maa answers live check-ins in her app (both apps open in one browser).
test.afterAll(async ({ browser }) => resetDemoData(browser));

async function openBoth(page: Page) {
  await demoLogin(page);
  await openDemo(page);
  const [maa] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(maa).toHaveURL(/\/p$/, { timeout: 45_000 });
  return maa;
}

async function askNow(page: Page) {
  await openDemo(page);
  await page.getByRole("button", { name: "Ask Maa the next check-in now" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Asked. Open Maa’s app to answer.");
}

test("Maa answers in her own words; stored exactly; the companion thanks her", async ({ page }) => {
  const maa = await openBoth(page);
  await askNow(page);
  await maa.goto("/p");
  const card = maa.getByTestId("answer-card");
  await expect(card).toBeVisible();
  // P-029: the buttons sit right under the question in her chat.
  await expect(maa.getByTestId("parent-bubble-checkin").last()).toContainText("Kamla");
  await expect(card).toContainText("Answer here");
  await expect(card.getByRole("button", { name: "Yes, done" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Snooze 30 min" })).toBeVisible();
  const words = `Fine today, did it with my neighbour ${Date.now() % 1000}.`;
  await card.getByLabel("Or say it in your own words").fill(words);
  await card.getByRole("button", { name: "Send" }).click();
  // (Another check-in may still be open if this runs just after one of Kamla's times.)
  await expect(maa.getByTestId("parent-bubble-answer").last()).toContainText(words);
  await expect(maa.getByTestId("parent-bubble-checkin").last()).toContainText("Thank you, Kamla!");
});

test("snooze: asked again later; the button answers also work", async ({ page }) => {
  const maa = await openBoth(page);
  await askNow(page);
  await maa.goto("/p");
  await maa.getByTestId("answer-card").getByRole("button", { name: "Snooze 30 min" }).click();
  await expect(maa.getByTestId("parent-bubble-checkin").last()).toContainText(/All right\. I will ask again at \d\d:\d\d\./);
  const card = maa.getByTestId("answer-card");
  await expect(card).toContainText(/I will ask again at \d\d:\d\d\./);
  await expect(card.getByRole("button", { name: "Snooze 30 min" })).toHaveCount(0);
  await card.getByRole("button", { name: "Yes, done" }).click();
  await expect(maa.getByTestId("parent-bubble-answer").last()).toContainText("“Yes, done.”");
});

test("prompt 2 rings full screen in her app; answering stops it", async ({ page }) => {
  test.setTimeout(120_000);
  const maa = await openBoth(page);
  await askNow(page);
  // Gap A (10 min for Kamla) passes without an answer -> the alarm-like second reminder.
  await page.getByRole("button", { name: "+5 min" }).click();
  await expect(page.getByText(/ahead of real time/)).toBeVisible();
  await page.getByRole("button", { name: "+5 min" }).click();
  await expect(page.getByTestId("demo-upcoming")).toBeVisible();
  await maa.goto("/p");
  await expect(maa).toHaveURL(/\/p\/ringing$/, { timeout: 30_000 }); // her app opens the ringing page
  await expect(maa.getByTestId("parent-ringing")).toContainText("Vidya is asking again");
  await maa.getByTestId("answer-card").getByRole("button", { name: "Not today" }).click();
  await expect(maa).toHaveURL(/\/p$/);
  await expect(maa.getByTestId("parent-bubble-answer").last()).toContainText("“Not today.”");
});

test("an emergency word in her answer: PAUSE for her, the distinct alarm for Priya (G5)", async ({ page }) => {
  const maa = await openBoth(page);
  await askNow(page);
  await maa.goto("/p");
  const card = maa.getByTestId("answer-card");
  await card.getByLabel("Or say it in your own words").fill("Help me, I fell in the bathroom");
  await card.getByRole("button", { name: "Send" }).click();
  const pause = maa.getByTestId("pause-panel");
  await expect(pause).toContainText("PAUSE");
  await expect(pause).toContainText("Please contact local help now");
  await expect(pause).toContainText("Gudiya has been told.");
  await expect(pause).toContainText("Mrs. Verma");
  await expect(maa.locator('a[href^="tel:"]')).toHaveCount(0);

  await page.goto("/home");
  await expect(page).toHaveURL(/\/alarm$/, { timeout: 30_000 });
  await expect(page.locator("#alarm-text")).toHaveText("Maa used an emergency word. The app asked them to contact local help.");
  // (A check-in that was already due when the test started may have escalated too.)
  await switchOffAlarms(page);
});
