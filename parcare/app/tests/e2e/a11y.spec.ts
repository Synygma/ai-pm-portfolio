import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { demoLogin, openDemo, resetDemoData } from "./helpers";

// Capstone check (P-038): an automatic accessibility scan (axe-core, WCAG 2.1 A/AA rules) of the
// main screens of both apps. Fails on "serious" or "critical" problems.
test.afterAll(async ({ browser }) => resetDemoData(browser));
test.describe.configure({ timeout: 180_000 });

async function scan(page: Page, path: string) {
  await page.goto(path);
  // Not "networkidle": the apps check for news every 10 s, so the network is never quiet.
  await page.waitForLoadState("load");
  await page.waitForTimeout(500);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const report = bad.map((v) => `${path}: [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length}x) e.g. ${v.nodes[0]?.target.join(" ")} | ${(v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220)}`);
  return report;
}

test("public pages have no serious accessibility problems", async ({ page }) => {
  const problems: string[] = [];
  for (const path of ["/", "/login", "/signup", "/terms", "/parent", "/forgot"]) problems.push(...(await scan(page, path)));
  expect(problems, problems.join("\n")).toEqual([]);
});

test("child app screens have no serious accessibility problems", async ({ page }) => {
  await demoLogin(page);
  const problems: string[] = [];
  for (const path of ["/home", "/chat", "/digest", "/helper", "/reminders", "/reminders/new", "/settings", "/alerts", "/demo"]) problems.push(...(await scan(page, path)));
  expect(problems, problems.join("\n")).toEqual([]);
});

test("parent app screens have no serious accessibility problems", async ({ page }) => {
  await demoLogin(page);
  await openDemo(page);
  const [maa] = await Promise.all([page.context().waitForEvent("page"), page.getByTestId("open-parent-app").click()]);
  await expect(maa).toHaveURL(/\/p$/, { timeout: 45_000 });
  const problems: string[] = [];
  for (const path of ["/p", "/p/help", "/p/settings", "/p/sos"]) problems.push(...(await scan(maa, path)));
  expect(problems, problems.join("\n")).toEqual([]);
});
