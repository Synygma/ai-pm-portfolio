import { expect, test } from "@playwright/test";

// Production build only: clicking the Settings link opens the demo tools.
test("settings link opens the demo tools (production build)", async ({ page }) => {
  test.skip(!process.env.CI, "Dev-server first compiles can swallow an early click; checked on the production build.");
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo login", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.getByRole("navigation", { name: "Main sections" }).getByRole("link", { name: "Settings" }).click();
  await page.getByTestId("demo-link").click();
  await expect(page.getByTestId("demo-clock")).toBeVisible();
});
