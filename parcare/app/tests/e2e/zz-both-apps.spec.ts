import { expect, test } from "@playwright/test";
import { localHHMM, localYMD, openDemo, quickChildSetup, switchOffAlarms } from "./helpers";

// P6: the whole product, both apps, as a real family uses it. Asha (child) sets up and sends the
// invite link; Lakshmi ("Amma") opens it on her own phone (a separate browser), does her own
// setup, answers a check-in in her own words, misses one (Asha's alarm), asks for help, and hears
// Asha's voice reminder. Asha's digest quotes Amma's words.

test("both apps end to end: child setup → invite → parent setup → check-ins → alarm → digest → help → reminder", async ({ page, browser }) => {
  test.setTimeout(300_000);

  // 1. Asha: setup, invite link.
  const invite = await quickChildSetup(page, "Amma wakes up at 6. She takes her BP tablet at 8:30 and 8:30 pm. She sleeps by 9:30.");
  expect(invite).toMatch(/\/p\/[A-Za-z0-9_-]{30,}$/);
  await expect(page.getByTestId("consent-banner")).toContainText("Nothing is checked yet");

  // 2. Amma's phone: open the link, her own setup.
  const phone = await browser.newContext({ permissions: ["microphone"] });
  const maa = await phone.newPage();
  await maa.goto(invite);
  await expect(maa.getByText("Chinni invited you.")).toBeVisible();
  await maa.getByRole("button", { name: "Open my ParCare" }).click();
  await expect(maa).toHaveURL(/\/p\/setup$/, { timeout: 45_000 });
  const next = () => maa.getByRole("button", { name: "Next", exact: true }).click();
  await maa.getByRole("radio", { name: /Vidya/ }).click();
  await next();
  await maa.getByRole("textbox", { name: "Your day" }).fill("I wake up at 6 and take my BP tablet at 8:30 and again at 8:30 at night. I sleep at 10.");
  await next();
  await expect(maa.getByTestId("parent-checklist")).toBeVisible();
  const items = maa.getByTestId("consent-item");
  const count = await items.count();
  for (let i = 0; i < count; i++) await items.nth(i).getByRole("checkbox", { name: "Yes, check in with me about this" }).check();
  await next();
  await next(); // thank-you + daily summary on
  await maa.getByLabel("Second reminder after").selectOption("5");
  await maa.getByLabel("Then Chinni is told after").selectOption("5");
  await next();
  await maa.getByRole("checkbox", { name: "I have read this and agree" }).check();
  await maa.getByRole("button", { name: "Finish" }).click();
  await expect(maa).toHaveURL(/\/p$/);
  await expect(maa.getByTestId("parent-bubble-setup").last()).toContainText("I am an AI voice, not a person.");

  // Asha sees Amma's choice (consent first: only now is anything checked).
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-setup").last()).toContainText(`Amma finished their setup and agreed to ${count} check-ins.`);
  await page.goto("/home");
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);

  // 3. A check-in: Amma answers in her own words.
  await openDemo(page);
  await page.getByRole("button", { name: "Ask Maa the next check-in now" }).click();
  await expect(page.getByTestId("demo-notice")).toBeVisible();
  await maa.goto("/p");
  const words = `All good here, had my tea on the balcony ${Date.now() % 1000}.`;
  const card = maa.getByTestId("answer-card");
  // On the dev server, typing before the page is interactive can be lost: type until Send is on.
  await expect(async () => {
    await card.getByLabel("Or say it in your own words").fill(words);
    await expect(card.getByRole("button", { name: "Send" })).toBeEnabled({ timeout: 3000 });
  }).toPass({ timeout: 60_000 });
  await card.getByRole("button", { name: "Send" }).click();
  await expect(maa.getByTestId("parent-bubble-answer").last()).toContainText(words);

  // 4. The next one goes unanswered: asked twice, then Asha's alarm (factual, no call).
  await openDemo(page);
  await page.getByRole("button", { name: "Let the next check-in go unanswered" }).click();
  await expect(page).toHaveURL(/\/alarm$/);
  await expect(page.locator("#alarm-text")).toHaveText("I checked in with Amma twice and did not hear back.");
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await switchOffAlarms(page);
  // P-029: Amma can still answer it in her chat, under the question; she is told Chinni knows.
  await maa.goto("/p");
  const late = maa.getByTestId("answer-card");
  await expect(late.getByTestId("answer-child-told")).toContainText("Chinni has been told that you did not answer.");
  await expect(late.getByRole("button", { name: "Snooze 30 min" })).toHaveCount(0);
  await late.getByRole("button", { name: "I’m okay today" }).click();
  await expect(maa.getByTestId("parent-bubble-answer").last()).toContainText("I’m okay today.");

  // 5. A day later the digest quotes Amma's words exactly.
  await openDemo(page);
  await page.getByRole("button", { name: "+1 day" }).click();
  await expect(page.getByText(/ahead of real time/)).toBeVisible();
  await switchOffAlarms(page); // later check-ins of the day may have gone unanswered too
  await page.goto("/digest");
  const rows = page.getByTestId("digest-row");
  await expect(rows.first()).toBeVisible();
  let found = false;
  for (let i = 0; i < (await rows.count()) && !found; i++) {
    await page.goto("/digest");
    await page.getByTestId("digest-row").nth(i).click();
    await expect(page).toHaveURL(/\/digest\/[0-9a-f-]+$/);
    await expect(page.getByRole("button", { name: "Matched what my parent told me" })).toBeVisible();
    found = (await page.getByTestId("digest-quote").filter({ hasText: words }).count()) > 0;
  }
  expect(found).toBe(true);
  await page.getByRole("button", { name: "Matched what my parent told me" }).click();
  await expect(page.getByTestId("feedback-saved")).toBeVisible();

  // 6. Amma asks for help; Asha's Helper list has it.
  await maa.goto("/p/help");
  await maa.getByLabel("What do you need?").fill("Please send someone to fix the fan");
  await maa.getByRole("button", { name: "Send to Chinni" }).click();
  await expect(maa.getByTestId("help-notice")).toContainText("Sent.");
  await page.goto("/helper");
  await expect(page.getByTestId("helper-item").filter({ hasText: "Please send someone to fix the fan" }).getByTestId("helper-status")).toHaveText("New");

  // 7. Asha's voice reminder rings on Amma's phone until she taps OK.
  await openDemo(page);
  const parentNow = (await page.getByTestId("parent-now").textContent()) ?? "";
  await page.goto("/reminders/new");
  await page.getByLabel("Short note").fill("Drink water, Amma");
  // The demo clock is a day ahead: use its date and a time a few minutes after it.
  const [d, t] = parentNow.split(" ");
  const [dd, mm, yyyy] = d.split("/");
  const due = new Date(`${yyyy}-${mm}-${dd}T${t}:00Z`);
  due.setUTCMinutes(due.getUTCMinutes() + 3);
  const ymd = due.toISOString().slice(0, 10);
  const hhmm = due.toISOString().slice(11, 16);
  await page.getByLabel("Date").fill(ymd || localYMD("Asia/Kolkata", 3));
  await page.getByLabel("Time").fill(hhmm || localHHMM("Asia/Kolkata", 3));
  await page.getByRole("button", { name: "Save reminder" }).click();
  await expect(page).toHaveURL(/\/reminders$/);
  await openDemo(page);
  await page.getByRole("button", { name: "+5 min" }).click();
  await switchOffAlarms(page);
  await maa.goto("/p/reminder");
  await expect(maa.getByTestId("reminder-label")).toHaveText("Drink water, Amma", { timeout: 30_000 });
  await maa.getByRole("button", { name: "OK, thank you" }).click();
  await expect(maa).toHaveURL(/\/p$/);
  await page.goto("/reminders");
  await expect(page.getByTestId("reminder-item").filter({ hasText: "Drink water, Amma" }).getByTestId("reminder-status")).toHaveText("Parent said OK");

  await phone.close();
});
