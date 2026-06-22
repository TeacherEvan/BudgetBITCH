import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('BudgetBITCH Dogfood Audit E2E Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Inject auth state cookie to bypass Convex authentication in middleware
    // and set locale cookie to default to English
    await context.addCookies([
      {
        name: 'budgetbitch:e2e-auth-state',
        value: 'signed-in',
        domain: '127.0.0.1',
        path: '/',
      },
      {
        name: 'bb-locale',
        value: 'en',
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
  });

  test('walks through onboarding wizard and explores the dashboard', async ({ page }) => {
    const screenshotsDir = path.resolve(__dirname, '../../dogfood-output/screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Monitor for console errors and logs
    const consoleErrors: string[] = [];
    const consoleLogs: string[] = [];
    
    page.on('console', (msg) => {
      const text = `[${msg.type()}] ${msg.text()}`;
      if (msg.type() === 'error') {
        const isRssNetworkError = text.toLowerCase().includes('cors') || 
                                  text.toLowerCase().includes('failed to fetch') || 
                                  text.toLowerCase().includes('failed to load resource') ||
                                  text.toLowerCase().includes('rss');
        if (!isRssNetworkError) {
          consoleErrors.push(text);
        }
      }
      consoleLogs.push(text);
      console.log(text);
    });

    page.on('pageerror', (err) => {
      const text = `[pageerror] ${err.message}`;
      consoleErrors.push(text);
      console.error(text);
    });

    // 1. Visit wizard page directly
    console.log('Navigating to wizard page...');
    await page.goto('/wizard');
    
    // Set localStorage locale
    await page.evaluate(() => {
      localStorage.setItem('budgetbitch:locale', 'en');
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '02_wizard_start_income.png') });

    // Assert we are on the onboarding wizard
    await expect(page).toHaveURL(/.*wizard/);

    // Q1: Income
    console.log('Completing wizard Q1: Income...');
    const incomeInput = page.locator('input[type="number"]');
    await expect(incomeInput).toBeVisible();
    await incomeInput.fill('75000');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '03_wizard_rent.png') });

    // Q2: Rent
    console.log('Completing wizard Q2: Rent...');
    const rentInput = page.locator('input[type="number"]');
    await rentInput.fill('18000');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '04_wizard_transport.png') });

    // Q3: Transport
    console.log('Completing wizard Q3: Transport...');
    const transportInput = page.locator('input[type="number"]');
    await transportInput.fill('4000');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '05_wizard_phone.png') });

    // Q4: Phone/Internet
    console.log('Completing wizard Q4: Phone/Internet...');
    const phoneInput = page.locator('input[type="number"]');
    await phoneInput.fill('900');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '06_wizard_subscriptions.png') });

    // Q5: Subscriptions
    console.log('Completing wizard Q5: Subscriptions...');
    const subInput = page.locator('input[type="number"]');
    await subInput.fill('1500');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '07_wizard_entertainment.png') });

    // Q6: Entertainment
    console.log('Completing wizard Q6: Entertainment...');
    const entInput = page.locator('input[type="number"]');
    await entInput.fill('6000');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '08_wizard_healthcare.png') });

    // Q7: Healthcare
    console.log('Completing wizard Q7: Healthcare...');
    const healthInput = page.locator('input[type="number"]');
    await healthInput.fill('2000');
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '09_wizard_savings_rate.png') });

    // Q8: Savings Rate
    console.log('Completing wizard Q8: Savings Rate...');
    const savingsBtn = page.getByRole('button', { name: /20%/ });
    await expect(savingsBtn).toBeVisible();
    await savingsBtn.click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '10_wizard_risk_tolerance.png') });

    // Q9: Risk Tolerance
    console.log('Completing wizard Q9: Risk Tolerance...');
    const riskBtn = page.getByRole('button', { name: 'Medium' });
    await expect(riskBtn).toBeVisible();
    await riskBtn.click();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '11_wizard_location.png') });

    // Q10: Location Permission (Skip for now to avoid browser prompt blocking)
    console.log('Completing wizard Q10: Location Permission...');
    const skipBtn = page.getByRole('button', { name: 'Skip for now' });
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '12_wizard_finish.png') });

    // Click Finish to save and enter dashboard
    console.log('Submitting wizard details...');
    const finishBtn = page.getByRole('button', { name: 'Finish' });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    // 3. Landing on Dashboard
    console.log('Waiting for dashboard load...');
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/.*dashboard/);
    await page.screenshot({ path: path.join(screenshotsDir, '13_dashboard_home.png') });

    // 4. Explore dashboard panels
    console.log('Interacting with dashboard panels...');
    
    // Toggle a dashboard panel (e.g. net worth or savings goals)
    const netWorthBtn = page.getByRole('button', { name: /💰 Net Worth/ });
    if (await netWorthBtn.isVisible()) {
      console.log('Clicking Net Worth toggle in sidebar...');
      await netWorthBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '14_dashboard_networth_panel.png') });
    }

    // Toggle critical expenses modal
    const cutExpenseBtn = page.getByRole('button', { name: /Pick 1 to cut/i });
    if (await cutExpenseBtn.isVisible()) {
      console.log('Opening Cut One Expense modal...');
      await cutExpenseBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '15_dashboard_critical_expense_modal.png') });
      
      // Close modal
      const closeModalBtn = page.locator('button:has-text("Close"), button:has(svg)');
      if (await closeModalBtn.first().isVisible()) {
        await closeModalBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    console.log('Finished E2E exploratory QA.');
    
    // Save console logs to reports directory if there were any errors
    const logsDir = path.resolve(__dirname, '../../dogfood-output');
    fs.writeFileSync(path.join(logsDir, 'console-logs.json'), JSON.stringify({ logs: consoleLogs, errors: consoleErrors }, null, 2));

    // Confirm that there are no critical JS console errors during navigation
    expect(consoleErrors.length).toBeLessThanOrEqual(5); // Adjust threshold as needed
  });
});
