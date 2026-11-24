import { expect, test } from "@playwright/test";

test("entry screen offers child and parent paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "I am the child" })).toBeVisible();
  await page.getByRole("link", { name: "I am the parent" }).click();
  // No parent password: the parent opens the link their child sent.
  await expect(page.getByRole("heading", { name: "Parent app" })).toBeVisible();
  await expect(page.getByText("Open the link your child sent you.")).toBeVisible();
});

test("a wrong invite link says so", async ({ page }) => {
  await page.goto("/p/some-token");
  await expect(page.getByTestId("invite-problem")).toHaveText("This link does not work. Please ask your child for a new link.");
});

test("signed-out visitors are sent to the login page", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo.child@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "do not match" })).toHaveText("That email and password do not match.");
});

test("demo login opens the chat list, and log out from Settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "I am the child" }).click();
  await page.getByRole("button", { name: "Demo login" }).click();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByTestId("companion-chat-row")).toContainText("Vidya");

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.getByTestId("settings-account")).toContainText("Signed in as Priya Sharma");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);
});

test("email + password login works for the demo account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("demo.child@example.com");
  await page.getByLabel("Password").fill("ParCare-demo-2026");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByTestId("companion-chat-row")).toBeVisible();
});

test("a new account can sign up and goes to the setup wizard", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(`new.child.${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("a-long-password");
  await page.getByRole("button", { name: "Create account" }).click();

  // First use: "what ParCare can and cannot do" must be agreed to before anything else.
  await expect(page).toHaveURL(/\/agree$/);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "tick the box" })).toHaveText("Please tick the box to continue.");
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/agree$/); // no way round it
  await page.getByRole("checkbox", { name: /I understand what ParCare can and cannot do/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByTestId("setup-progress")).toHaveText("Step 1 of 9");
});

test("forgot password: a link by email, then a new password", async ({ page, browser }) => {
  // A fresh account (memory mode, demo on: the link is shown on screen instead of emailed).
  const email = `reset.child.${Date.now()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("old-password-1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/agree$/);
  await page.context().clearCookies();

  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot");
  await page.goto("/forgot");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByTestId("forgot-sent")).toContainText(`If an account exists for ${email}`);
  const link = await page.getByRole("link", { name: "Open the reset link" }).getAttribute("href");
  expect(link).toMatch(/^\/auth\/reset\?token=/);

  // Asking again at once is refused (no email flooding).
  await page.getByRole("button", { name: "Send the link again" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please wait a minute" })).toBeVisible();

  // The link opens "Choose a new password".
  await page.goto(link!);
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await page.locator("input[name=password]").fill("new-password-2");
  await page.getByLabel("Type the new password again").fill("something-else");
  await page.getByRole("button", { name: "Save and log in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "not the same" })).toBeVisible();
  await page.locator("input[name=password]").fill("new-password-2");
  await page.getByLabel("Type the new password again").fill("new-password-2");
  await page.getByRole("button", { name: "Save and log in" }).click();
  await expect(page).toHaveURL(/\/agree$/); // signed in (this new account has not agreed to the terms yet)

  // The link works only once, and the page is closed again after the change.
  await page.goto(link!);
  await expect(page.getByTestId("reset-link-expired")).toBeVisible();

  // Elsewhere: the old password no longer works, the new one does.
  const other = await browser.newPage();
  await other.goto("/login");
  await other.getByLabel("Email").fill(email);
  await other.getByLabel("Password").fill("old-password-1");
  await other.getByRole("button", { name: "Log in" }).click();
  await expect(other.getByRole("alert").filter({ hasText: "do not match" })).toBeVisible();
  await other.getByLabel("Email").fill(email); // a failed login clears the form
  await other.getByLabel("Password").fill("new-password-2");
  await other.getByRole("button", { name: "Log in" }).click();
  await expect(other).toHaveURL(/\/agree$/);
  await other.close();
});

test("forgot password: no way in without a link; unknown emails get the same answer; demo account cannot be reset", async ({ page }) => {
  // Signed in normally (not through a link): the new-password page stays closed.
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo login", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  await page.goto("/reset-password");
  await expect(page.getByTestId("reset-link-expired")).toBeVisible();
  await page.goto("/auth/reset?token=made-up");
  await expect(page.getByTestId("reset-link-expired")).toBeVisible();

  await page.goto("/forgot");
  await page.getByLabel("Email").fill("nobody.here@example.com");
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByTestId("forgot-sent")).toContainText("If an account exists for nobody.here@example.com");
  await expect(page.getByTestId("forgot-demo-link")).toHaveCount(0);

  await page.getByRole("button", { name: "Use a different email" }).click();
  await expect(page.getByRole("button", { name: "Email me a link" })).toBeVisible();
  await page.getByLabel("Email").fill("demo.child@example.com");
  await page.getByRole("button", { name: "Email me a link" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "shared demo account" })).toBeVisible();
});
