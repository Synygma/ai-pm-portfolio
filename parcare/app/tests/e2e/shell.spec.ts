import { expect, type Page, test } from "@playwright/test";

async function demoLogin(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo login" }).click();
  await expect(page).toHaveURL(/\/home$/);
}

test("chat list pins the companion chat with preview and unread count; opening it marks it read", async ({ page }) => {
  await demoLogin(page);
  const row = page.getByTestId("companion-chat-row");
  await expect(row).toContainText("Vidya");
  await expect(row).toContainText("Daily digest for Maa");
  // Yesterday's digest is unread (and today's too once it is past 19:00 in London).
  await expect(row.getByTestId("unread-badge")).toHaveText(/^[12]$/);

  await row.click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("heading", { name: "Vidya" })).toBeVisible();
  await expect(page.getByText("Maa’s ParCare AI companion", { exact: true })).toBeVisible();

  const chat = page.getByTestId("chat-messages");
  await expect(chat.getByTestId("bubble-setup")).toContainText("I am an AI voice, not a person.");
  await expect(chat.getByTestId("bubble-alert").filter({ hasText: "I checked in with Maa twice and did not hear back." })).toHaveCount(1);
  await expect(chat.getByTestId("bubble-alert").filter({ hasText: "Check with Maa that all is OK" })).toHaveCount(1);
  await expect.poll(() => chat.getByTestId("bubble-digest").count()).toBeGreaterThanOrEqual(7);
  await expect(chat.getByRole("separator", { name: "Yesterday" })).toBeVisible();
  await expect(page.getByText(/Only Vidya writes here/)).toBeVisible();

  await page.getByRole("link", { name: "Back to chats" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByTestId("companion-chat-row").getByTestId("unread-badge")).toHaveCount(0);
});

test("bottom tabs switch between the five sections", async ({ page }) => {
  await demoLogin(page);
  const tabs = page.getByRole("navigation", { name: "Main sections" });
  for (const [name, path, testId] of [
    ["Digest", "/digest", "digest-list"],
    ["Helper", "/helper", "helper-list"],
    ["Reminders", "/reminders", "reminder-list"],
    ["Settings", "/settings", "settings-account"],
  ] as const) {
    await tabs.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByTestId(testId)).toBeVisible();
    await expect(tabs.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
  }
  await tabs.getByRole("link", { name: "Chats" }).click();
  await expect(page.getByTestId("companion-chat-row")).toBeVisible();
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

  test("shows the app in a centred phone-width column", async ({ page }) => {
    await page.goto("/");
    const column = page.getByTestId("app-column");
    const box = await column.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(430);
    expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThan(2);
  });
});
