import { expect, type Page, test } from "@playwright/test";
import { demoLogin, openDemo, resetDemoData } from "./helpers";

// Parent app P5: "Who can see what", companion and gaps, her review prompt, the last question of
// the day with the photo prompt.
test.afterEach(async ({ browser }) => resetDemoData(browser));

async function openBoth(page: Page) {
  await demoLogin(page);
  await openDemo(page);
  const [maa] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(maa).toHaveURL(/\/p$/, { timeout: 45_000 });
  return maa;
}

test("Maa pauses a check-in and keeps one to herself; Priya's Settings follow; stop all tells Priya", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/settings");
  const who = maa.getByTestId("who-can-see");
  await expect(who).toContainText("Gudiya cannot change this.");
  const walk = who.getByTestId("my-checkin").filter({ hasText: "Morning walk" });
  await expect(walk.getByTestId("my-checkin-state")).toHaveText("On");
  await walk.getByRole("button", { name: "Pause" }).click();
  await expect(walk.getByTestId("my-checkin-state")).toHaveText("Paused");
  const puja = who.getByTestId("my-checkin").filter({ hasText: "Evening puja" });
  await puja.getByRole("button", { name: "Keep it to myself" }).click();
  await expect(puja).toContainText("Only you see your answer");

  await page.goto("/settings");
  const checkins = page.getByTestId("settings-checkins");
  await expect(checkins.getByTestId("settings-checkin")).toHaveCount(6);
  await expect(checkins).not.toContainText("Morning walk");
  await expect(checkins.getByTestId("settings-checkin").filter({ hasText: "Evening puja" })).toContainText("Not shared in your digest");

  await walk.getByRole("button", { name: "Turn on again" }).click();
  await expect(walk.getByTestId("my-checkin-state")).toHaveText("On");
  await maa.getByRole("button", { name: "Stop all check-ins" }).click();
  await expect(who.getByTestId("my-checkin-state").filter({ hasText: "On" })).toHaveCount(0);
  await page.goto("/home");
  await expect(page.getByTestId("consent-banner")).toContainText("All check-ins are switched off. Please talk to Maa.");
});

test("Maa changes her companion and her reminder gaps", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/settings");
  const form = maa.getByTestId("my-companion");
  await form.locator("label").filter({ hasText: "Garden Mitra" }).click();
  await form.getByRole("button", { name: "Save companion" }).click();
  await maa.goto("/p");
  await expect(maa.getByRole("heading", { name: "Garden Mitra" })).toBeVisible();
  await maa.goto("/p/settings");
  const gaps = maa.getByTestId("my-gaps");
  await gaps.getByLabel("Second reminder after").selectOption("15");
  await gaps.getByLabel("Then Gudiya is told after").selectOption("30");
  await gaps.getByRole("button", { name: "Save" }).click();
  await expect(maa.getByTestId("my-gaps").getByLabel("Second reminder after")).toHaveValue("15");
  await page.goto("/chat");
  await expect(page.getByRole("heading", { name: "Garden Mitra" })).toBeVisible();
  await openDemo(page);
  await expect(page.getByTestId("demo-upcoming")).toContainText("Prompt 2 after 15 min");
});

test("her review prompt at +2 weeks: in her chat, 'All is fine' answers it", async ({ page }) => {
  const maa = await openBoth(page);
  await openDemo(page);
  await page.getByRole("button", { name: "+1 week" }).click();
  await expect(page.getByText(/ahead of real time/)).toBeVisible();
  // A week on, Priya's daily sample reminder is ringing too: her app shows that first.
  for (let i = 0; i < 3; i++) {
    await maa.goto("/p/reminder");
    const ok = maa.getByRole("button", { name: "OK, thank you" });
    await expect(ok.or(maa.getByTestId("parent-chat"))).toBeVisible({ timeout: 15_000 }); // no reminder ringing -> back to chat
    if (!(await ok.isVisible())) break;
    await maa.getByRole("button", { name: "OK, thank you" }).click();
    await expect(maa).toHaveURL(/\/p$/);
  }
  await maa.goto("/p");
  const review = maa.getByTestId("parent-bubble-review").last();
  await expect(review).toContainText("Did Gudiya speak to you recently? Would you like to change any check-in?");
  await expect(review.getByRole("link", { name: "Change my check-ins" })).toHaveAttribute("href", "/p/settings");
  await expect(async () => {
    // Retried: on the dev server a tap before the page is ready is dropped.
    if (await review.getByRole("button", { name: "All is fine" }).isVisible()) await review.getByRole("button", { name: "All is fine" }).click();
    await expect(maa.getByTestId("parent-bubble-review").last()).toContainText("Thank you.", { timeout: 3000 });
  }).toPass();
  await maa.reload();
  await expect(maa.getByTestId("parent-bubble-review").last()).toContainText("Thank you."); // saved
});

test("the last check-in of the day asks a personalised question, then offers to share a photo", async ({ page }) => {
  test.setTimeout(180_000);
  const maa = await openBoth(page);
  const last =
    /anything special about your day|made you smile|have for dinner|looking forward to tomorrow|hear anything nice|walk go today|move about today|anything special in your puja|meet anyone nice|news from your friends|appointment go|help you had today/;
  // Ask the next check-in and answer it, until the evening one comes (at most a day's worth).
  for (let i = 0; i < 9; i++) {
    await openDemo(page);
    await page.getByRole("button", { name: "Ask Maa the next check-in now" }).click();
    await expect(page.getByTestId("demo-notice")).toBeVisible();
    await maa.goto("/p");
    const card = maa.getByTestId("answer-card");
    await expect(card).toBeVisible();
    const question = (await maa.getByTestId("parent-bubble-checkin").last().textContent()) ?? "";
    if (last.test(question)) {
      await card.getByLabel("Or say it in your own words").fill("Watched a nice film with Mrs. Verma.");
      await card.getByRole("button", { name: "Send" }).click();
      await expect(maa.getByTestId("share-photo")).toBeVisible();
      await expect(maa.getByTestId("share-photo")).toHaveText("Share a photo with Gudiya");
      await expect(maa.getByTestId("share-photo")).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=A%20photo%20from%20my%20day/);
      return;
    }
    // On the dev server a tap before the page is interactive can be lost: tap until the answer is in.
    const thanked = maa.getByTestId("parent-bubble-checkin").last();
    await expect(async () => {
      if (!((await thanked.textContent()) ?? "").includes("Thank you, Kamla!")) await card.getByRole("button", { name: "Yes, done" }).click({ timeout: 3000 });
      await expect(thanked).toContainText("Thank you, Kamla!", { timeout: 5000 });
    }).toPass({ timeout: 45_000 });
  }
  throw new Error("The last check-in of the day did not come up");
});
