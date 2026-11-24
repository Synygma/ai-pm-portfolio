import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  // Refuses to run if the app under test is connected to a real Supabase project.
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  // One worker: tests share one server and the demo data (the alarm test moves the demo clock).
  workers: 1,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  // The dev server compiles each page on first visit, so local runs wait longer.
  expect: { timeout: isCI ? 5_000 : 15_000 },
  timeout: isCI ? 30_000 : 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    // Chromium's built-in fake microphone (a tone), so the voice-reminder recording can be tested.
    launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] },
  },
  // Mobile viewport, Chromium only (Pixel 7 runs on Chromium).
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: {
    // CI tests the production build (built in an earlier CI step); locally we use the dev server.
    command: isCI ? `npm run start -- -p ${PORT}` : `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
    // Demo login on; fresh in-memory sample data per run (does not touch .data/dev-db.json).
    // The Supabase keys are blanked so tests never write to a real project, even when
    // .env.local has them (Next.js does not override variables that are already set).
    env: {
      DEMO_MODE: "true",
      DEV_DB_FILE: "off",
      CRON_SECRET: "e2e-only-cron-secret",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      GEMINI_API_KEY: "",
      // A made-up admin login for the admin tests only.
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "e2e-only-admin-password",
    },
  },
});
