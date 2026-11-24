import { expect, type Page, test } from "@playwright/test";
import { agreeToTerms } from "./helpers";

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true }).click();
const expectStep = (page: Page, n: number, step: string) =>
  Promise.all([expect(page.getByTestId("setup-progress")).toHaveText(`Step ${n} of 9`), expect(page.getByTestId(`setup-step-${step}`)).toBeVisible()]);

test("setup wizard: demo new setup, typed description, resume, G7 and T&C gating, then home", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo: start a new setup" }).click();
  // A brand-new login agrees to "can and cannot do" first. The first visit compiles the wizard
  // on the dev server, which can take a while.
  await agreeToTerms(page);
  await expect(page).toHaveURL(/\/setup$/, { timeout: 45_000 });
  await expectStep(page, 1, "child");

  // a. About you (time zone is pre-filled from the device)
  await expect(page.getByLabel("Time zone")).not.toHaveValue("");
  await next(page);
  await expect(page.getByText("Please fill this in.").first()).toBeVisible();
  await page.getByLabel("Your name").fill("Asha Rao");
  await page.getByLabel(/Pet name your parents use/).fill("Chinni");
  // Only real places: a misspelt city is refused; picking a city fills in its time zone.
  await page.getByLabel("Country").selectOption("United Kingdom");
  await page.getByLabel("Time zone").selectOption("Asia/Dubai");
  await page.getByLabel("City").fill("Leedz");
  await expect(page.getByTestId("city-none")).toContainText("No city with that name in United Kingdom");
  await next(page);
  await expect(page.getByText("Please pick the city from the list under the box")).toBeVisible();
  // The matches are a visible list under the box (phones often show no browser list).
  await page.getByLabel("City").fill("Lee");
  await page.getByTestId("city-suggestions").getByRole("button", { name: "Leeds", exact: true }).click();
  await expect(page.getByLabel("City")).toHaveValue("Leeds");
  await expect(page.getByTestId("city-ok")).toBeVisible();
  await expect(page.getByLabel("Time zone")).toHaveValue("Europe/London");
  await next(page);

  // b. About your parent: two parents, manage the second
  await expectStep(page, 2, "parent");
  const p1 = page.getByTestId("parent-0");
  await p1.getByLabel("Name", { exact: true }).fill("Lakshmi Rao");
  await p1.getByLabel("What you call them").fill("Amma");
  // India has one time zone; a zone from elsewhere is flagged and refused.
  await p1.getByLabel("Country").selectOption("India");
  await p1.getByLabel("City").fill("Delhi");
  await expect(p1.getByLabel("Time zone")).toHaveValue("Asia/Kolkata");
  await page.getByRole("button", { name: "Add second parent" }).click();
  const p2 = page.getByTestId("parent-1");
  await p2.getByLabel("Name", { exact: true }).fill("Ravi Rao");
  await p2.getByLabel("What you call them").fill("Appa");
  await p2.getByLabel("Country").selectOption("India");
  await p2.getByLabel("City").fill("Pune");
  await expect(p2.getByLabel("Time zone")).toHaveValue("Asia/Kolkata");
  await expect(page.getByText("In this version ParCare checks in with one parent.")).toBeVisible();
  await page.getByRole("radio", { name: "Lakshmi Rao" }).check();
  await p1.getByLabel("Time zone").selectOption("Pacific/Easter");
  await expect(p1.getByTestId("timezone-mismatch")).toContainText("This time zone is not used in India");
  await next(page);
  await expect(page.getByText("This time zone is not used in the country you chose.")).toBeVisible();
  await p1.getByLabel("Time zone").selectOption("Asia/Kolkata");
  await next(page);

  // c. How setup works -> d. Introduce (11 companions, no "My Child")
  await expectStep(page, 3, "howItWorks");
  await next(page);
  await expectStep(page, 4, "introduce");
  await expect(page.getByText("“The companion is an AI voice, not a real person, and it is not me.”")).toBeVisible();
  await expect(page.getByTestId("setup-companions").getByRole("listitem")).toHaveCount(11);
  await expect(page.getByTestId("setup-companions")).not.toContainText("My Child");

  // Resume: reload and land on the same step.
  await page.reload();
  await expectStep(page, 4, "introduce");
  await next(page);

  // e. Describe the day (typed fallback) -> mock AI list -> edit
  await expectStep(page, 5, "day");
  await expect(page.getByRole("heading", { name: "Describe Amma’s day" })).toBeVisible();
  await page
    .getByLabel("Description")
    .fill("Amma wakes up at 6. She walks in the park around 6:30. She takes her BP tablet at 8:30 and 8:30 pm. She sleeps by 9:30.");
  await page.getByRole("button", { name: "Make the check-in list" }).click();
  const items = page.getByTestId("meta-item");
  await expect(items).toHaveCount(5);
  await expect(page.getByTestId("meta-list").getByRole("textbox", { name: "What" }).nth(2)).toHaveValue("BP medicine (morning)");
  await page.getByRole("checkbox", { name: "Include Morning walk" }).uncheck();
  await page.getByRole("button", { name: "Add item" }).click();
  await items.nth(5).getByRole("textbox", { name: "What" }).fill("Evening puja");
  await items.nth(5).getByLabel("Time").fill("18:30");
  await items.nth(5).getByLabel("Type").selectOption("puja");
  await expect(page.getByText("Amma will later give their own version")).toBeVisible();
  await next(page);

  // f. Emergency contact: "No" means nothing is stored (G7)
  await expectStep(page, 6, "emergency");
  await page.getByLabel("Name").fill("Mrs. Iyer");
  await page.getByLabel("Phone number").fill("+91 00000 11111");
  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByTestId("emergency-not-stored")).toContainText("Not saved. Please tell Mrs. Iyer first");
  await page.getByRole("button", { name: "Continue" }).click();

  // g. Invite link (one-time) with a share link; no chat-app name on screen
  await expectStep(page, 7, "invite");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Create invite link" }).click();
  await expect(page.getByTestId("invite-url")).toContainText("/p/");
  await expect(page.getByTestId("invite-share")).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=Hi%20Amma/);
  await expect(page.locator("body")).not.toContainText(/whatsapp/i);
  await next(page);

  // h. Call your parent now (no tel: links anywhere)
  await expectStep(page, 8, "call");
  await expect(page.getByText("ParCare never makes calls. Use your own phone.")).toBeVisible();
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await next(page);

  // i. Can / cannot + T&C: cannot finish without the tick (G10)
  await expectStep(page, 9, "terms");
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "tick the box" })).toHaveText("Please tick the box to finish setup.");
  await page.getByRole("checkbox", { name: "I have read this and agree" }).check();
  await page.getByRole("button", { name: "Finish setup" }).click();

  // Home: the companion chat (no companion chosen yet) with the setup bubble.
  await expect(page).toHaveURL(/\/home$/);
  const row = page.getByTestId("companion-chat-row");
  await expect(row).toContainText("Your parent’s companion");
  await row.click();
  await expect(page.getByTestId("bubble-setup")).toContainText("Hi Chinni! Setup is done. Amma will choose their ParCare AI companion");

  // Finished users are sent home from /setup.
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/home$/);
});

test("setup: save and finish later, then log in again and carry on where you stopped", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo: start a new setup" }).click();
  await agreeToTerms(page);
  await expectStep(page, 1, "child");

  // A form step is saved before leaving: an incomplete page says what is missing.
  await page.getByRole("button", { name: "Save and finish later" }).click();
  await expect(page.getByText("Please fill this in.").first()).toBeVisible();
  await expectStep(page, 1, "child");
  await page.getByLabel("Your name").fill("Asha Rao");
  await page.getByLabel("Country").selectOption("United Kingdom");
  await page.getByLabel("City").fill("Leeds");
  await expect(page.getByLabel("Time zone")).toHaveValue("Europe/London");
  await page.getByRole("button", { name: "Save and finish later" }).click();
  await expect(page).toHaveURL(/\/setup\/paused$/);
  await expect(page.getByTestId("setup-paused")).toContainText("You stopped at step 2 of 9");
  await expect(page.getByTestId("setup-paused")).toContainText("there is no rush");

  // Log out, log in again: setup opens at the step after the saved one.
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("Email").fill("demo.newsetup@example.com");
  await page.getByLabel("Password").fill("ParCare-demo-2026");
  await page.getByRole("button", { name: "Log in" }).click();
  await expectStep(page, 2, "parent");

  // An information step: leaving keeps the earlier steps and comes back to this one.
  await page.getByTestId("parent-0").getByLabel("Name", { exact: true }).fill("Lakshmi Rao");
  await page.getByTestId("parent-0").getByLabel("What you call them").fill("Amma");
  await page.getByTestId("parent-0").getByLabel("Country").selectOption("India");
  await page.getByTestId("parent-0").getByLabel("City").fill("Pune");
  await next(page);
  await expectStep(page, 3, "howItWorks");
  await page.getByRole("button", { name: "Save and finish later" }).click();
  await expect(page.getByTestId("setup-paused")).toContainText("You stopped at step 3 of 9");
  await page.getByRole("link", { name: "Continue setup now" }).click();
  await expectStep(page, 3, "howItWorks");
});
