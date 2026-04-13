import { defineConfig, devices } from "@playwright/test";

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
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    cwd: "/home/leandi-duplessis/Documents/BudgetBITCH/BudgetBITCH",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env: {
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
