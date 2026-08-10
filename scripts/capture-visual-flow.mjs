import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/android/.gemini/antigravity-cli/brain/604ac026-bf63-4e39-bd56-309294a781a7';

async function main() {
  console.log('Starting visual flow capture...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // 1. Open app and clear sessionStorage so GoldenSplash runs
  await page.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait 3.0 seconds for phase to transition: reckoning (0-400ms) -> statement (400ms) -> invitation (1800ms) -> ready (2400ms)
  await page.waitForTimeout(3000);

  const splashPath = path.join(ARTIFACT_DIR, 'splash_screen.png');
  await page.screenshot({ path: splashPath });
  console.log(`Captured active GoldenSplash screen at ${splashPath}`);

  // 2. Click [ ENTER BOSS MODE ] button
  const enterBtn = page.getByRole('button', { name: /ENTER BOSS MODE/i });
  if (await enterBtn.isVisible()) {
    await enterBtn.click();
  } else {
    console.warn('Enter button not found via role, trying text filter...');
    await page.locator('button').filter({ hasText: /BOSS MODE/i }).click();
  }

  // 3. Wait for CleanAuthCard heading "Welcome back" to appear
  await page.getByRole('heading', { name: /Welcome back/i }).waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(600);

  const loginPath = path.join(ARTIFACT_DIR, 'login_screen_after_splash.png');
  await page.screenshot({ path: loginPath });
  console.log(`Captured post-splash Login Card screen at ${loginPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error('Visual capture failed:', err);
  process.exit(1);
});
