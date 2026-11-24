import { expect, type Page, test } from "@playwright/test";
import { demoLogin, localHHMM, localYMD, openDemo, resetDemoData, switchOffAlarms } from "./helpers";

// Parent app P4: help requests from Maa's app, and Priya's voice reminders ringing on Maa's phone.
test.afterAll(async ({ browser }) => resetDemoData(browser));
test.use({ permissions: ["microphone"] }); // Chromium's fake microphone (playwright.config.ts)

async function openBoth(page: Page) {
  await demoLogin(page);
  await openDemo(page);
  const [maa] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(maa).toHaveURL(/\/p$/, { timeout: 45_000 });
  return maa;
}

test("Maa asks for help in words; Priya sees it; Maa sees that Priya has seen it", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/help");
  await expect(maa.getByText("Not for emergencies.")).toBeVisible();
  await expect(maa.getByTestId("helper-badge")).toBeVisible();
  const words = `Please get my BP tablets this week ${Date.now() % 1000}`;
  await maa.getByLabel("What do you need?").fill(words);
  await maa.getByRole("button", { name: "Send to Gudiya" }).click();
  await expect(maa.getByTestId("help-notice")).toHaveText("Sent. Gudiya will see it in their Helper list.");
  const mine = maa.getByTestId("my-request").filter({ hasText: words });
  await expect(mine.getByTestId("my-request-status")).toHaveText("Sent");

  await page.goto("/helper");
  const item = page.getByTestId("helper-item").filter({ hasText: words });
  await expect(item.getByTestId("helper-status")).toHaveText("New");
  await expect(item.getByTestId("helper-badge")).toBeVisible();

  // Priya's list marks it Seen just after it opens; Maa sees that on her next look.
  await expect
    .poll(async () => {
      await maa.reload();
      return maa.getByTestId("my-request").filter({ hasText: words }).getByTestId("my-request-status").textContent();
    })
    .toBe("Gudiya has seen it");

  // P-030: Priya sends a voice reply (her own voice) to Maa’s help request; Maa can play it.
  await page.goto("/chat");
  const helperBubble = page.getByTestId("bubble-helper").last();
  await helperBubble.getByTestId("voice-reply").click();
  const panel = helperBubble.getByTestId("voice-reply-panel");
  await panel.getByRole("button", { name: "Record your voice" }).click();
  await page.waitForTimeout(1500);
  await panel.getByRole("button", { name: "Stop" }).click();
  await panel.getByRole("button", { name: "Send voice reply" }).click();
  await expect(page.getByTestId("bubble-reply").last()).toContainText("Your voice reply to Maa about their help request");
  await maa.goto("/p");
  const fromPriya = maa.getByTestId("parent-bubble-reply").last();
  await expect(fromPriya).toContainText("Gudiya sent you a voice reply about your help request:");
  await expect(fromPriya.getByTestId("reply-audio")).toBeVisible();
  await expect(fromPriya.getByRole("img", { name: "Picture of My Child" })).toBeVisible();
});

test("Maa records a voice note for help; Priya can play it", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/help");
  await maa.getByRole("button", { name: "Record your voice" }).click();
  await expect(maa.getByTestId("recording-on")).toBeVisible(); // visible mic indicator (G3)
  await maa.waitForTimeout(1500);
  await maa.getByRole("button", { name: "Stop" }).click();
  await expect(maa.getByTestId("recording-on")).toHaveCount(0);
  await maa.getByRole("button", { name: "Send to Gudiya" }).click();
  await expect(maa.getByTestId("help-notice")).toHaveText("Sent. Gudiya will see it in their Helper list.");
  await expect(maa.getByTestId("my-request").first()).toContainText("(voice note)");

  await page.goto("/helper");
  await expect(page.getByTestId("helper-item").first().getByTestId("voice-note")).toBeVisible();
  const before = await page.getByTestId("helper-item").count();

  // P-028: her chat shows what she sent (the voice note, playable) above the companion's note.
  await maa.goto("/p");
  const sent = maa.getByTestId("parent-bubble-request").last();
  await expect(sent.getByTestId("voice-note")).toBeVisible();
  // Delete, like her usual chat app: "Delete for me" hides it only in her chat...
  await sent.getByTestId("delete-message").click();
  const dialog = maa.getByTestId("delete-dialog");
  await expect(dialog.getByRole("button", { name: "Delete for everyone" })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  const requests = await maa.getByTestId("parent-bubble-request").count();
  await sent.getByTestId("delete-message").click();
  await maa.getByTestId("delete-dialog").getByRole("button", { name: "Delete for everyone" }).click();
  await expect(maa.getByTestId("parent-bubble-request")).toHaveCount(requests - 1);
  // ...and "Delete for everyone" removes it from Gudiya's Helper list too.
  await page.reload();
  await expect(page.getByTestId("helper-item")).toHaveCount(before - 1);
});

test("Maa changes a check-in time in her Settings; Gudiya's chat is told", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/settings");
  const row = maa.getByTestId("my-checkin").filter({ hasText: "Evening puja" });
  await row.getByTestId("my-checkin-time").selectOption("19:15");
  await row.getByRole("button", { name: "Change time" }).click();
  await expect(maa.getByTestId("my-checkin").filter({ hasText: "Evening puja" }).getByTestId("my-checkin-time")).toHaveValue("19:15");
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-setup").last()).toContainText("Maa changed the time of “Evening puja” to 19:15.");
  // P-030: the child can delete a bubble for themselves only (no "Delete for everyone").
  const bubbles = await page.getByTestId("bubble-setup").count();
  await page.getByTestId("bubble-setup").last().getByTestId("delete-message").click();
  const dialog = page.getByTestId("delete-dialog");
  await expect(dialog.getByRole("button", { name: "Delete for everyone" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Delete for me" }).click();
  await expect(page.getByTestId("bubble-setup")).toHaveCount(bubbles - 1);
});

test("Maa adds a check-in herself in her Settings (P-040); Gudiya's chat is told", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/settings");
  const before = await maa.getByTestId("my-checkin").count();
  await maa.getByTestId("add-checkin-open").click();
  await maa.getByTestId("add-checkin-save").click(); // empty: the browser asks for the words first
  await expect(maa.getByTestId("my-checkin")).toHaveCount(before);
  await maa.getByTestId("add-checkin-label").fill("Call my sister");
  await maa.getByTestId("add-checkin-kind").selectOption("social");
  await maa.getByTestId("add-checkin-time").selectOption("16:00");
  await maa.getByTestId("add-checkin-save").click();
  await expect(maa.getByTestId("add-checkin-done")).toBeVisible();
  const row = maa.getByTestId("my-checkin").filter({ hasText: "Call my sister" });
  await expect(row.getByTestId("my-checkin-state")).toHaveText("On");
  await expect(row.getByTestId("my-checkin-time")).toHaveValue("16:00");
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-setup").last()).toContainText("Maa added a check-in: “Call my sister” at 16:00.");
});

test("an emergency word in a help request: PAUSE for Maa, the distinct alarm for Priya (G5)", async ({ page }) => {
  const maa = await openBoth(page);
  await maa.goto("/p/help");
  await maa.getByLabel("What do you need?").fill("Help me, I fell and cannot get up");
  await maa.getByRole("button", { name: "Send to Gudiya" }).click();
  await expect(maa).toHaveURL(/\/p\/pause$/);
  await expect(maa.getByTestId("pause-panel")).toContainText("Please contact local help now");
  await page.goto("/home");
  await expect(page).toHaveURL(/\/alarm$/, { timeout: 30_000 });
  await expect(page.locator("#alarm-text")).toHaveText("Maa used an emergency word. The app asked them to contact local help.");
  await switchOffAlarms(page);
});

test("Priya's voice reminder rings on Maa's phone until she taps OK; Priya sees 'Parent said OK'", async ({ page }) => {
  const maa = await openBoth(page);
  // Priya: a typed reminder 3 minutes from now, Maa's time.
  await page.goto("/reminders/new");
  await page.getByLabel("Short note").fill("Call me after your nap");
  await page.getByLabel("Date").fill(localYMD("Asia/Kolkata", 3));
  await page.getByLabel("Time").fill(localHHMM("Asia/Kolkata", 3));
  await page.getByRole("button", { name: "Save reminder" }).click();
  await expect(page).toHaveURL(/\/reminders$/);
  await openDemo(page);
  await page.getByRole("button", { name: "+5 min" }).click();
  await expect(page.getByTestId("ringing-reminder")).toContainText("Call me after your nap");

  // Maa's app opens the reminder page by itself (polls every 10 s).
  await maa.goto("/p");
  await expect(maa).toHaveURL(/\/p\/reminder$/, { timeout: 30_000 });
  await expect(maa.getByTestId("parent-reminder")).toContainText("A voice reminder from Gudiya");
  await expect(maa.getByTestId("reminder-label")).toHaveText("Call me after your nap");
  await expect(maa.getByRole("img", { name: "Picture of My Child" })).toBeVisible();
  await maa.getByRole("button", { name: "OK, thank you" }).click();
  await expect(maa).toHaveURL(/\/p$/);
  await expect(maa.getByTestId("parent-bubble-reminder").last()).toContainText("Gudiya sent you a voice reminder: “Call me after your nap”");
  // P-030: Maa reacts 👍; Priya’s chat says so.
  await maa.getByTestId("parent-bubble-reminder").last().getByTestId("react-up").click();
  await expect(maa.getByTestId("parent-bubble-reminder").last().getByTestId("my-reaction")).toHaveText("You reacted 👍");
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-reply").last()).toContainText("Maa reacted 👍 to your voice reminder “Call me after your nap”.");

  await page.goto("/reminders");
  await expect(page.getByTestId("reminder-item").filter({ hasText: "Call me after your nap" }).getByTestId("reminder-status")).toHaveText("Parent said OK");
});
