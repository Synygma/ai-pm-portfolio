import { expect, type Page, test } from "@playwright/test";
import { agreeToTerms } from "./helpers";

// The required end-to-end flow (CLAUDE.md section 8): demo login -> setup wizard (typed fallback)
// -> home -> /demo missed check-in -> alarm -> switch off -> digest -> "Matched".

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true }).click();
const step = (page: Page, n: number) => expect(page.getByTestId("setup-progress")).toHaveText(`Step ${n} of 9`);

test("full flow: new setup, parent agrees, a check-in goes unanswered, alarm, switch off, digest, Matched", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo: start a new setup" }).click();
  await agreeToTerms(page);
  await expect(page).toHaveURL(/\/setup$/, { timeout: 45_000 });

  // a-b. About you, about your parent
  await step(page, 1);
  await page.getByLabel("Your name").fill("Asha Rao");
  await page.getByLabel(/Pet name your parents use/).fill("Chinni");
  await page.getByLabel("Country").selectOption("United Kingdom");
  await page.getByLabel("City").fill("Leeds");
  await expect(page.getByLabel("Time zone")).toHaveValue("Europe/London");
  await next(page);
  await step(page, 2);
  const p1 = page.getByTestId("parent-0");
  await p1.getByLabel("Name", { exact: true }).fill("Lakshmi Rao");
  await p1.getByLabel("What you call them").fill("Amma");
  await p1.getByLabel("City").fill("Pune");
  await expect(p1.getByLabel("Time zone")).toHaveValue("Asia/Kolkata");
  await next(page);
  // c-d. Info steps
  await step(page, 3);
  await next(page);
  await step(page, 4);
  await next(page);

  // e. Typed fallback -> AI (mock) check-in list
  await step(page, 5);
  await page.getByLabel("Description").fill("Amma wakes up at 6. She takes her BP tablet at 8:30 and 8:30 pm. She sleeps by 9:30.");
  await page.getByRole("button", { name: "Make the check-in list" }).click();
  await expect(page.getByTestId("meta-item")).toHaveCount(4);
  await next(page);

  // f. Emergency contact: Yes, the neighbour knows (G7)
  await step(page, 6);
  await page.getByLabel("Name").fill("Mrs. Iyer");
  await page.getByLabel("Phone number").fill("+91 00000 11111");
  await page.getByRole("radio", { name: "Yes" }).check();
  await page.getByRole("button", { name: "Save and continue" }).click();

  // g-h. Invite link, call your parent
  await step(page, 7);
  await page.getByRole("button", { name: "Create invite link" }).click();
  await expect(page.getByTestId("invite-url")).toContainText("/p/");
  await next(page);
  await step(page, 8);
  await next(page);

  // i. Can / cannot + T&C
  await step(page, 9);
  await page.getByRole("checkbox", { name: "I have read this and agree" }).check();
  await page.getByRole("button", { name: "Finish setup" }).click();

  // Home: nothing is checked until Amma agrees (G1).
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByTestId("consent-banner")).toHaveText(/Nothing is checked yet\. Amma chooses the check-ins in their app\./);

  // Demo: Amma agrees in her app (simulated), then lets the next check-in go unanswered.
  await page.goto("/demo");
  await expect(page.getByTestId("demo-clock")).toBeVisible({ timeout: 45_000 });
  await page.getByRole("button", { name: "Parent agrees to all check-ins" }).click();
  await expect(page.getByTestId("demo-consents")).toContainText("4 of 4");
  await page.getByRole("button", { name: "Let the next check-in go unanswered" }).click();

  // Alarm: factual wording, the confirmed contact, keeps ringing until switched off.
  await expect(page).toHaveURL(/\/alarm$/);
  await expect(page.locator("#alarm-text")).toHaveText("I checked in with Amma twice and did not hear back.");
  await expect(page.getByTestId("alarm-contact")).toContainText("Mrs. Iyer");
  await page.getByRole("button", { name: "Switch off", exact: true }).click();
  await expect(page).toHaveURL(/\/alerts$/);
  await expect(page.getByTestId("alert-missed_checkin").first()).toContainText("Switched off:");

  // Amma answers the next check-in in her own words; a day later the digest quotes her.
  await page.goto("/demo");
  const words = "Took my BP tablet with warm water.";
  await page.getByLabel("Answer the next check-in").fill(words);
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(page.getByTestId("demo-notice")).toHaveText("Answer saved in the parent’s own words.");
  await page.getByRole("button", { name: "+1 day" }).click();
  await expect(page.getByText(/ahead of real time/)).toBeVisible();

  await page.goto("/digest");
  const quoted = page.getByTestId("digest-row").filter({ hasText: "1 update" }).first();
  await quoted.click();
  await expect(page.getByTestId("digest-quote").filter({ hasText: words })).toHaveCount(1);
  await page.getByRole("button", { name: "Matched what my parent told me" }).click();
  await expect(page.getByTestId("feedback-saved")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Matched what my parent told me" })).toHaveAttribute("aria-pressed", "true");
});
