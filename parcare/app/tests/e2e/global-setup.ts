import { chromium, type FullConfig } from "@playwright/test";

// Safety check before any test runs: the tests sign up, delete data and move the demo clock, so
// they must only ever run against the built-in sample database, never a real Supabase project.
// (Found the hard way: a production build once carried the project's address into a test run.)
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:3100";
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseURL}/login`, { timeout: 120_000 });
    await page.getByRole("button", { name: "Demo login", exact: true }).click();
    await page.waitForURL(/\/home$/, { timeout: 120_000 });
    await page.goto(`${baseURL}/settings`);
    const account = await page.getByTestId("settings-account").innerText({ timeout: 60_000 });
    if (!account.includes("built-in sample data")) {
      throw new Error("Stopping: the test server is connected to a real database (Supabase). Tests only run on the built-in sample data.");
    }
  } finally {
    await browser.close();
  }
}
