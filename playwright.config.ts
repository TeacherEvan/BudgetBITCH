import { defineConfig, devices } from "@playwright/test";

// Local dogfood: run the real dev server with the Convex env from .env.local
// intact (do NOT strip auth), so the client-only auth provider has a URL.
// CI may pass E2E_STRIP_AUTH=true to replicate the stripped pipeline.
const stripAuth = process.env.E2E_STRIP_AUTH === "true";
const devCommand = stripAuth
  ? "BUDGETBITCH_STRIP_AUTH_ENV=true node ./scripts/run-with-sanitized-env.mjs npm run dev -- --webpack --port 3100"
  : "node ./scripts/run-with-sanitized-env.mjs npm run dev -- --webpack --port 3100";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: process.env.CI ? undefined : 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: process.env.CI ? "on-first-retry" : "off",
    // Signed-in cookie helper + screenshots on failure
    screenshot: "only-on-failure",
  },
  webServer: {
    command: devCommand,
    url: "http://127.0.0.1:3100",
    reuseExistingServer: process.env.CI ? false : true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
