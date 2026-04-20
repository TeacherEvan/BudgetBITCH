import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "budgetbitch");

const playwrightAuthEnv = {
  E2E_BYPASS_AUTH: "true",
  E2E_BYPASS_AUTH_SOURCE: "playwright",
  E2E_TEST_CLERK_USER_ID: "clerk_e2e_user",
  E2E_TEST_EMAIL: "start-smart-e2e@example.com",
  E2E_TEST_NAME: "Start Smart E2E",
};

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: {
    cwd: appRoot,
    command: "npm run dev:frontend -- . --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    env: {
      CONVEX_AGENT_MODE: "anonymous",
      NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3210",
      NEXT_PUBLIC_CONVEX_SITE_URL: "http://127.0.0.1:3211",
      WORKOS_CLIENT_ID: "client_e2e",
      NEXT_PUBLIC_WORKOS_REDIRECT_URI: "http://127.0.0.1:3001/callback",
      WORKOS_COOKIE_PASSWORD: "e2e-auth-cookie-password-32-chars!!",
      NODE_ENV: "test",
      ...playwrightAuthEnv,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});