import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('./dogfood-output');
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const consoleLogs = [];
const networkErrors = [];

async function runQA() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text, location: msg.location() });
    if (type === 'error') {
      console.log(`[Browser Console Error]: ${text}`);
    }
  });

  page.on('requestfailed', (req) => {
    networkErrors.push({
      url: req.url(),
      failure: req.failure()?.errorText,
    });
  });

  console.log('--- Phase 2: Exploration ---');

  // 1. Dashboard Page
  console.log('Navigating to http://localhost:3000/dashboard...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png'), fullPage: true });

  // 2. Accounts View / Account Switcher
  console.log('Navigating to http://localhost:3000/accounts...');
  await page.goto('http://localhost:3000/accounts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_accounts_view.png'), fullPage: true });

  // Try clicking Create Account button if present
  const createBtn = page.locator('button:has-text("Create"), button:has-text("New Account")');
  if (await createBtn.count() > 0) {
    await createBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_create_account_modal.png') });
    // Close or cancel modal if present
    const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")');
    if (await cancelBtn.count() > 0) {
      await cancelBtn.first().click();
    }
  }

  // 3. Settings Page
  console.log('Navigating to http://localhost:3000/settings...');
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_settings_page.png'), fullPage: true });

  // 4. Join Page
  console.log('Navigating to http://localhost:3000/join?code=TEST12...');
  await page.goto('http://localhost:3000/join?code=TEST12', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_join_page.png'), fullPage: true });

  await browser.close();

  // Save telemetry
  fs.writeFileSync(path.join(OUTPUT_DIR, 'console_logs.json'), JSON.stringify(consoleLogs, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'network_errors.json'), JSON.stringify(networkErrors, null, 2));

  console.log('QA run completed successfully.');
}

runQA().catch((err) => {
  console.error('QA run failed:', err);
  process.exit(1);
});
