import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: process.env.CI ? undefined : 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: process.env.CI ? "on-first-retry" : "off",
  },
  webServer: {
    command:
      "BUDGETBITCH_STRIP_AUTH_ENV=true node ./scripts/run-with-sanitized-env.mjs npm run dev -- --webpack --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: process.env.CI ? false : true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
