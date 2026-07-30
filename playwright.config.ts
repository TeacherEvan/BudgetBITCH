import { defineConfig, devices } from "@playwright/test";

// E2E can run two ways:
//   1. Local / no E2E_BASE_URL set: start the real dev server (Convex env from
//      .env.local, NOT stripped) so the client-only auth provider has a URL.
//   2. CI / E2E_BASE_URL set: target that already-running deployment (e.g. a
//      Vercel preview) and skip starting a local server.
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const useLocalServer = !process.env.E2E_BASE_URL;

// CI may pass E2E_STRIP_AUTH=true to replicate the stripped pipeline; by
// default we keep the Convex env intact so client-only auth works.
const stripAuth = process.env.E2E_STRIP_AUTH === "true";
const devCommand = stripAuth
  ? "BUDGETBITCH_STRIP_AUTH_ENV=true node ./scripts/run-with-sanitized-env.mjs npm run dev -- --port 3100"
  : "node ./scripts/run-with-sanitized-env.mjs npm run dev -- --port 3100";

export default defineConfig({
  testDir: "./tests/e2e",
  // Serial execution (1 worker) prevents auth state collisions between tests.
  workers: process.env.CI ? 1 : 1,

  // Global timeout per test (ms). Keep generous for real network round-trips.
  timeout: 60_000,

  // Retry flaky tests once in CI to distinguish real failures from network noise.
  retries: process.env.CI ? 1 : 0,

  // Reporter: list in local, dot + HTML in CI for artifact uploads.
  reporter: process.env.CI
    ? [["dot"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"]],

  use: {
    baseURL,

    // Capture trace on the first retry so CI artifacts are always available.
    trace: process.env.CI ? "on-first-retry" : "off",

    // Screenshot only on failure to reduce noise.
    screenshot: "only-on-failure",

    // Short navigation timeout — web-first assertions have their own timeouts.
    navigationTimeout: 30_000,

    // Action timeout (clicks, fills) — keeps individual steps from hanging.
    actionTimeout: 15_000,
  },

  ...(useLocalServer
    ? {
        webServer: {
          command: devCommand,
          url: "http://127.0.0.1:3100",
          reuseExistingServer: process.env.CI ? false : true,
          timeout: 120_000,
        },
      }
    : {}),

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
