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
  ? "BUDGETBITCH_STRIP_AUTH_ENV=true node ./scripts/run-with-sanitized-env.mjs npm run dev -- --webpack --port 3100"
  : "node ./scripts/run-with-sanitized-env.mjs npm run dev -- --webpack --port 3100";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: process.env.CI ? 1 : 1,
  use: {
    baseURL,
    trace: process.env.CI ? "on-first-retry" : "off",
    screenshot: "only-on-failure",
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
  ],
});
