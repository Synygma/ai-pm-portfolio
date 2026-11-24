import { expect, test } from "@playwright/test";
import { demoLogin, openDemo, quickChildSetup, resetDemoData } from "./helpers";

// Parent app P1: open from Demo tools (both apps in one browser), the invite link, SOS.
test.afterAll(async ({ browser }) => resetDemoData(browser));

test("demo: open Maa's app next to Priya's; her chat, read aloud, SOS without calls", async ({ page }) => {
  await demoLogin(page);
  await openDemo(page);
  const [parent] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(parent).toHaveURL(/\/p$/, { timeout: 45_000 });

  await expect(parent.getByRole("heading", { name: "Vidya" })).toBeVisible();
  await expect(parent.getByText("Your ParCare AI companion", { exact: true })).toBeVisible();
  const chat = parent.getByTestId("parent-chat");
  await expect(chat.getByTestId("parent-bubble-setup")).toContainText("Hello Kamla! I am Vidya, your ParCare AI companion. I am an AI voice, not a person.");
  await expect(chat.getByTestId("parent-bubble-checkin").first()).toContainText("Kamla");
  await expect(chat.getByTestId("parent-bubble-answer").first()).toBeVisible();
  // Reading aloud is optional: Off at first (no speaker buttons), both choices visible.
  await expect(parent.getByTestId("read-aloud-chat-off")).toHaveAttribute("aria-pressed", "true");
  await expect(parent.getByTestId("read-aloud-chat-on")).toHaveAttribute("aria-pressed", "false");
  await expect(chat.getByTestId("read-aloud")).toHaveCount(0);
  await parent.getByTestId("read-aloud-chat-on").click();
  await expect(parent.getByTestId("read-aloud-chat-on")).toHaveAttribute("aria-pressed", "true");
  await expect(chat.getByTestId("read-aloud").first()).toBeVisible();

  // SOS: local help + the family's contact; never a call.
  await parent.getByTestId("sos-button").click();
  await expect(parent.getByTestId("sos-page")).toContainText("Please contact local help now");
  await expect(parent.getByTestId("sos-page")).toContainText("ParCare cannot call anyone");
  await expect(parent.getByTestId("sos-contact")).toContainText("Mrs. Verma");
  await expect(parent.getByTestId("sos-contact")).toContainText("+91 00000 12345");
  await expect(parent.locator('a[href^="tel:"]')).toHaveCount(0);

  // Settings: the same choice (remembered on this phone), and notifications show both On and Off.
  await parent.goto("/p/settings");
  await expect(parent.getByTestId("read-aloud-toggle-on")).toHaveAttribute("aria-pressed", "true");
  await parent.getByTestId("read-aloud-toggle-off").click();
  await expect(parent.getByTestId("read-aloud-status")).toContainText("Off: messages are shown only.");
  await parent.reload();
  await expect(parent.getByTestId("read-aloud-toggle-off")).toHaveAttribute("aria-pressed", "true");
  await expect(parent.getByTestId("push-choice-on")).toBeVisible();
  await expect(parent.getByTestId("push-choice-off")).toBeVisible();

  // Priya is still signed in, and her chat never shows Kamla's check-in prompts.
  await page.goto("/chat");
  await expect(page.getByRole("heading", { name: "Vidya" })).toBeVisible();
  await expect(page.getByTestId("chat-messages")).not.toContainText("Good morning, Kamla");
});

test("invite link: opening the page does not use it; 'Open my ParCare' does, once", async ({ page, browser }) => {
  await demoLogin(page);
  await page.goto("/settings");
  const card = page.getByTestId("settings-parent-link");
  await expect(async () => {
    await card.getByRole("button", { name: "Make a new link" }).click();
    await expect(card.getByTestId("parent-link-url")).toBeVisible({ timeout: 3000 });
  }).toPass();
  const url = (await card.getByTestId("parent-link-url").textContent())!.trim();
  expect(url).toMatch(/\/p\/[A-Za-z0-9_-]{30,}$/);

  // Maa's phone: no child login, no parent session.
  const phone = await browser.newContext();
  const maa = await phone.newPage();
  await maa.goto(url);
  await expect(maa.getByText("Gudiya invited you.")).toBeVisible();
  await maa.reload(); // a link preview or a second look does not use the link up
  await maa.getByRole("button", { name: "Open my ParCare" }).click();
  await expect(maa).toHaveURL(/\/p$/);
  await expect(maa.getByRole("heading", { name: "Vidya" })).toBeVisible();

  // Used once only.
  const other = await browser.newContext();
  const stranger = await other.newPage();
  await stranger.goto(url);
  await expect(stranger.getByTestId("invite-problem")).toHaveText("This link has already been used. If you changed your phone, ask Gudiya for a new link.");
  await stranger.goto("/p");
  await expect(stranger).toHaveURL(/\/parent$/);
  await expect(stranger.getByText("Open the link your child sent you.")).toBeVisible();
  // P-033: the link can be pasted here (iPhone home-screen app); it goes to the same checks.
  const paste = stranger.getByTestId("paste-link");
  await paste.getByLabel("Paste the link here").fill("not a link");
  await paste.getByRole("button", { name: "Open" }).click();
  await expect(paste.getByRole("alert")).toContainText("does not look like a ParCare link");
  await paste.getByLabel("Paste the link here").fill(`Here: ${url} `);
  await paste.getByRole("button", { name: "Open" }).click();
  await expect(stranger.getByTestId("invite-problem")).toHaveText("This link has already been used. If you changed your phone, ask Gudiya for a new link.");
  await phone.close();
  await other.close();
});

test("parent setup A–F: companion, her day, one follow-up, consent per item, gaps, terms; resumes", async ({ page }) => {
  test.setTimeout(180_000);
  await quickChildSetup(page, "Amma wakes up at 6. She takes her BP tablet at 8:30 and 8:30 pm. She sleeps by 9:30.");
  await openDemo(page);
  const [maa] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(maa).toHaveURL(/\/p\/setup$/, { timeout: 45_000 });
  const progress = maa.getByTestId("parent-setup-progress");
  const next = () => maa.getByRole("button", { name: "Next", exact: true }).click();

  // A. Companion (an AI voice, not a person).
  await expect(progress).toHaveText("Step 1 of 7");
  await expect(maa.getByText("Whichever you choose is an AI voice, not a person.")).toBeVisible();
  await expect(maa.getByRole("radio")).toHaveCount(11);
  await maa.getByRole("radio", { name: /Guruji/ }).click();
  await next();
  await expect(progress).toHaveText("Step 2 of 7");
  await maa.reload(); // save-and-resume
  await expect(maa.getByTestId("parent-setup-progress")).toHaveText("Step 2 of 7");

  // B. Her day, in her own words (typed here; hold-to-talk on a phone).
  await expect(maa.getByText("Lakshmi, can you tell me about your day")).toBeVisible();
  await maa.getByRole("textbox", { name: "Your day" }).fill("I wake up at 6 and take my BP tablet at 8:30. I sleep at 10.");
  await next();

  // Follow-up (max 3): Amma's evening tablet, which Asha mentioned and she did not.
  await expect(maa.getByTestId("parent-setup-followups")).toBeVisible();
  await expect(maa.getByText("Question 1 of 1")).toBeVisible();
  await expect(maa.getByText("Chinni said you have “BP medicine (evening)” around 20:30.")).toBeVisible();
  await maa.getByRole("button", { name: "Yes, add it" }).click();

  // C. ONE list: yes / no, time and sharing per item; nothing is pre-ticked (P-028).
  const items = maa.getByTestId("consent-item");
  await expect(items).toHaveCount(4);
  await expect(maa.getByText(/I do not want to micromanage you\./)).toBeVisible();
  await expect(items.getByRole("checkbox", { name: "Yes, check in with me about this", checked: true })).toHaveCount(0);
  // She moves her morning tablet from 08:30 to 09:00 with the time list.
  await items.filter({ hasText: "BP medicine (morning)" }).getByTestId("consent-time").selectOption("09:00");
  for (const label of ["Woken up", "BP medicine (morning)", "BP medicine (evening)"]) {
    await items.filter({ hasText: label }).getByRole("checkbox", { name: "Yes, check in with me about this" }).check();
  }
  await items.filter({ hasText: "BP medicine (evening)" }).getByRole("checkbox", { name: "Share it with Chinni" }).uncheck();
  // P-040: something the voice reader missed, added by hand (ticked yes, she can untick).
  await maa.getByTestId("add-checkin-open").click();
  await maa.getByTestId("add-checkin-label").fill("Thyroid tablet");
  await maa.getByTestId("add-checkin-time").selectOption("07:15");
  await maa.getByTestId("add-checkin-save").click();
  await expect(items).toHaveCount(5);
  await expect(items.filter({ hasText: "Thyroid tablet" }).getByRole("checkbox", { name: "Yes, check in with me about this" })).toBeChecked();
  await next();

  // D + E. Thank-you; daily summary to Chinni.
  await expect(maa.getByText("Your kids want to be a bigger part of your day even though they live away.")).toBeVisible();
  // The list is only SHOWN after the list step, with a big Edit button (P-028).
  const summary = maa.getByTestId("checklist-summary");
  await expect(summary.getByTestId("summary-item")).toHaveCount(4);
  await expect(summary).toContainText("Thyroid tablet · 07:15 · Chinni can see it");
  await expect(summary).toContainText("BP medicine (morning) · 09:00 · Chinni can see it");
  await expect(summary).toContainText("BP medicine (evening) · 20:30 · only you");
  await expect(summary.getByRole("checkbox")).toHaveCount(0);
  await summary.getByRole("button", { name: "Edit my check-ins" }).click();
  await expect(maa.getByTestId("parent-setup-checklist")).toBeVisible();
  await next();
  await next();

  // F. Reminder gaps, chosen together.
  await maa.getByLabel("Second reminder after").selectOption("5");
  await maa.getByLabel("Then Chinni is told after").selectOption("15");
  await expect(maa.getByText(/again after 5 minutes .* after 15 more minutes/)).toBeVisible();
  await next();

  // Terms: cannot finish without the tick.
  await maa.getByRole("button", { name: "Finish" }).click();
  await expect(maa.getByRole("alert").filter({ hasText: "tick the box" })).toBeVisible();
  await maa.getByRole("checkbox", { name: "I have read this and agree" }).check();
  await maa.getByRole("button", { name: "Finish" }).click();
  await expect(maa).toHaveURL(/\/p$/);
  await expect(maa.getByRole("heading", { name: "Guruji" })).toBeVisible();
  await expect(maa.getByTestId("parent-bubble-setup").last()).toContainText("I am Guruji, your ParCare AI companion. I am an AI voice, not a person.");

  // Asha's side: told in the chat; Settings lists the 3 check-ins; the gaps are Amma's.
  await page.goto("/chat");
  await expect(page.getByTestId("bubble-setup").last()).toContainText("Amma finished their setup and agreed to 4 check-ins.");
  await page.goto("/settings");
  await expect(page.getByTestId("settings-checkin")).toHaveCount(4);
  await expect(page.getByTestId("settings-checkin").filter({ hasText: "BP medicine (evening)" })).toContainText("Not shared in your digest");
  await expect(page.getByTestId("settings-companion")).toContainText("Guruji, Amma’s ParCare AI companion");
  await page.goto("/home");
  await expect(page.getByTestId("consent-banner")).toHaveCount(0);
  await openDemo(page);
  await expect(page.getByTestId("demo-upcoming")).toContainText("Prompt 2 after 5 min");
});
