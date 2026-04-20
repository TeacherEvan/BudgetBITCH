# Playwright Root CWD Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Playwright dev server launch from the nested BudgetBITCH app root without relying on a shell `cd`, so E2E smoke tests stop resolving modules from the outer workspace.

**Architecture:** Keep the fix focused on launch orchestration, not application code. The Playwright config should derive the nested app root from its own file location and pass that directory to the web server process explicitly. Existing smoke coverage stays in place and becomes the regression guard for this boundary.

**Tech Stack:** TypeScript, Playwright, Next.js, Vitest, Node.js path/url utilities

---

## File Map

- Modify `playwright.config.ts`: replace the hard-coded shell `cd` with an explicit `cwd` derived from the config file location.
- Reuse `tests/e2e/smoke.spec.ts` as the regression test: it already exercises the launch flow that fails when the dev server starts in the wrong workspace.
- Leave app routes, UI components, and Prisma code untouched.

### Task 1: Prove the launch boundary fails from the wrong cwd

**Files:**
- Test: `tests/e2e/smoke.spec.ts`
- Inspect: `playwright.config.ts`

- [x] **Step 1: Reproduce the failure before changing code**

Run:
```bash
cd /home/leandi-duplessis/Documents/BudgetBITCH/BudgetBITCH && npm run test:e2e -- tests/e2e/smoke.spec.ts
```
Expected: the Playwright webServer times out after repeated `Can't resolve 'tailwindcss' in '/home/leandi-duplessis/Documents/BudgetBITCH'` errors, proving the server is starting from the outer workspace root.

- [x] **Step 2: Confirm the current launch command is the brittle part**

Inspect `playwright.config.ts` and verify the current webServer block still shells out through a hard-coded path. The command should be the only launch-site change in scope for this refactor; no UI or API code should be edited for this task.

### Task 2: Refactor Playwright to launch from the nested app root

**Files:**
- Modify: `playwright.config.ts`

- [x] **Step 1: Add explicit app-root resolution**

Replace the shell `cd` with a `cwd` derived from the config file location:

```ts
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const appRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    cwd: appRoot,
    command: "npm run dev",
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
```

- [x] **Step 2: Remove the shell-specific launch path**

Delete the hard-coded `cd /home/leandi-duplessis/Documents/BudgetBITCH/BudgetBITCH &&` prefix so the config no longer depends on the current shell workspace.

- [x] **Step 3: Keep the config root-relative and portable**

Make sure the new `cwd` is derived from the config file itself, not from `process.cwd()` and not from an absolute path. That keeps the refactor stable across worktrees, editor launches, and CI.

### Task 3: Validate the refactor with the existing smoke path

**Files:**
- Test: `tests/e2e/smoke.spec.ts`
- Modify: `playwright.config.ts` if validation exposes a regression

- [x] **Step 1: Re-run the smoke test after the config change**

Run:
```bash
cd /home/leandi-duplessis/Documents/BudgetBITCH/BudgetBITCH && npm run test:e2e -- tests/e2e/smoke.spec.ts
```
Expected: the web server starts inside the nested app root, the smoke test reaches the launch wizard, and the test completes without tailwind resolution errors.

- [x] **Step 2: Run the production build as a final guardrail**

Run:
```bash
cd /home/leandi-duplessis/Documents/BudgetBITCH/BudgetBITCH && npm run build
```
Expected: the Next.js build completes successfully, confirming the refactor did not disturb production compilation.

- [x] **Step 3: Commit the refactor after verification**

Suggested commit:
```bash
git add playwright.config.ts docs/superpowers/plans/2026-04-20-playwright-root-cwd-refactor.md
git commit -m "refactor: launch Playwright from the app root"
```

## Self-Review Checklist

- [x] The plan addresses the actual root cause: the dev server launch cwd, not the app pages or tests.
- [x] The plan does not introduce any unrelated UI, route, or Prisma changes.
- [x] The smoke test remains the regression guard for the launch boundary.
- [x] No step depends on a hard-coded absolute path after the refactor.
