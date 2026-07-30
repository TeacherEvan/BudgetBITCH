// Feature: BudgetBITCH dogfood / exploratory QA audit flow.
//
// NOTE: This legacy dogfood audit flow assumes the old cookie-based E2E
// signed-in override. On the webview-localStorage-auth branch auth is
// client-only, so we perform a REAL sign-in. It skips cleanly when
// E2E_TEST_EMAIL / E2E_TEST_PASSWORD are not set.
//
// Best-practice notes:
//  - Imports the shared helpers.ts signInReal() instead of duplicating the
//    sign-in steps.
//  - Removed console.log() calls from test body (use Playwright trace/video
//    instead; console.log clutters CI output and is a best-practice smell).
//  - waitForTimeout(N) replaced with web-first assertions where possible.
//  - consoleErrors threshold changed from ≤5 to 0 — tests should assert
//    clean, not tolerate a hard-coded noise budget. If specific known errors
//    are acceptable, add them to the ErrorCollector.isIgnorable() allowlist.
//  - Screenshots still written to dogfood-output/ for audit record-keeping.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS, ErrorCollector } from "./helpers";
import fs from "fs";
import path from "path";

test.describe("BudgetBITCH Dogfood Audit E2E Flow", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
    // Real sign-in (client-only auth).
    await signInReal(page);
    // Seed locale + manifesto-seen so the audit sees the dashboard directly.
    await page.evaluate(() => {
      localStorage.setItem("budgetbitch:locale", "en");
      localStorage.setItem("bb:manifesto-v1", "1");
    });
  });

  test("walks through onboarding wizard and explores the dashboard", async ({ page }) => {
    const screenshotsDir = path.resolve(__dirname, "../../dogfood-output/screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Attach error collector for this test.
    const errors = new ErrorCollector();
    errors.attach(page);

    // ── 1. Wizard ────────────────────────────────────────────────────────────
    await page.goto("/wizard");
    await page.evaluate(() => localStorage.setItem("budgetbitch:locale", "en"));
    await expect(page).toHaveURL(/.*wizard/);
    await page.screenshot({ path: path.join(screenshotsDir, "02_wizard_start_income.png") });

    // Q1: Income
    const incomeInput = page.locator('input[type="number"]');
    await expect(incomeInput).toBeVisible();
    await incomeInput.fill("75000");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "03_wizard_rent.png") });

    // Q2: Rent
    const rentInput = page.locator('input[type="number"]');
    await expect(rentInput).toBeVisible();
    await rentInput.fill("18000");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "04_wizard_transport.png") });

    // Q3: Transport
    const transportInput = page.locator('input[type="number"]');
    await expect(transportInput).toBeVisible();
    await transportInput.fill("4000");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "05_wizard_phone.png") });

    // Q4: Phone/Internet
    const phoneInput = page.locator('input[type="number"]');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill("900");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "06_wizard_subscriptions.png") });

    // Q5: Subscriptions
    const subInput = page.locator('input[type="number"]');
    await expect(subInput).toBeVisible();
    await subInput.fill("1500");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "07_wizard_entertainment.png") });

    // Q6: Entertainment
    const entInput = page.locator('input[type="number"]');
    await expect(entInput).toBeVisible();
    await entInput.fill("6000");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "08_wizard_healthcare.png") });

    // Q7: Healthcare
    const healthInput = page.locator('input[type="number"]');
    await expect(healthInput).toBeVisible();
    await healthInput.fill("2000");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "09_wizard_savings_rate.png") });

    // Q8: Savings Rate
    const savingsBtn = page.getByRole("button", { name: /20%/ });
    await expect(savingsBtn).toBeVisible();
    await savingsBtn.click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "10_wizard_risk_tolerance.png") });

    // Q9: Risk Tolerance
    const riskBtn = page.getByRole("button", { name: "Medium" });
    await expect(riskBtn).toBeVisible();
    await riskBtn.click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.screenshot({ path: path.join(screenshotsDir, "11_wizard_location.png") });

    // Q10: Location Permission — skip to avoid a blocking browser prompt.
    const skipBtn = page.getByRole("button", { name: "Skip for now" });
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    await page.screenshot({ path: path.join(screenshotsDir, "12_wizard_finish.png") });

    // Finish & land on dashboard.
    const finishBtn = page.getByRole("button", { name: "Finish" });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // ── 2. Dashboard ─────────────────────────────────────────────────────────
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, "13_dashboard_home.png") });

    // Net Worth toggle — optional, may not be in this account state.
    const netWorthBtn = page.getByRole("button", { name: /💰 Net Worth/ });
    if (await netWorthBtn.isVisible()) {
      await netWorthBtn.click();
      await expect(netWorthBtn).toBeVisible(); // re-renders without crash
      await page.screenshot({ path: path.join(screenshotsDir, "14_dashboard_networth_panel.png") });
    }

    // Critical expenses modal — optional.
    const cutExpenseBtn = page.getByRole("button", { name: /Pick 1 to cut/i });
    if (await cutExpenseBtn.isVisible()) {
      await cutExpenseBtn.click();
      await page.screenshot({
        path: path.join(screenshotsDir, "15_dashboard_critical_expense_modal.png"),
      });
      const closeModalBtn = page.getByRole("button", { name: /close/i });
      if (await closeModalBtn.first().isVisible()) {
        await closeModalBtn.first().click();
      }
    }

    // ── 3. Save audit log ────────────────────────────────────────────────────
    const logsDir = path.resolve(__dirname, "../../dogfood-output");
    fs.writeFileSync(
      path.join(logsDir, "console-logs.json"),
      JSON.stringify({ errors: errors.errors }, null, 2),
    );

    // Zero tolerance: all JS errors should be in ErrorCollector.isIgnorable().
    errors.assertClean();
  });
});
