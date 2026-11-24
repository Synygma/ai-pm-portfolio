import { expect, test } from "@playwright/test";
import { demoLogin, openDemo } from "./helpers";

// P-038 (team test): after closing the app, the home-screen icon opened the start screen and
// "I am the child" showed the login form, so it looked like being signed out. Signed-in users now
// go straight in until they sign out.
test("signed in: the start screen and the login page go straight to the chats", async ({ page }) => {
  await demoLogin(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/login");
  await expect(page).toHaveURL(/\/home$/);
});

test("signed in as child and parent on one phone: the start screen keeps the choice", async ({ page }) => {
  await demoLogin(page);
  await openDemo(page);
  const [maa] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(maa).toHaveURL(/\/p$/, { timeout: 45_000 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "I am the parent" })).toBeVisible();
  await page.getByRole("link", { name: "I am the parent" }).click();
  await expect(page).toHaveURL(/\/p$/);
});
