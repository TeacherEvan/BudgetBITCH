import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/android/.gemini/antigravity-cli/brain/604ac026-bf63-4e39-bd56-309294a781a7';

async function main() {
  console.log('Capturing user journey screenshots...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // Clear storage & cookies for fresh initial state
  await page.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle' });

  // 1. Language Modal or Splash
  await page.waitForTimeout(1000);
  const initialPath = path.join(ARTIFACT_DIR, 'fresh_startup_modal.png');
  await page.screenshot({ path: initialPath });
  console.log(`Saved initial startup screen to ${initialPath}`);

  // Click English (South Africa) or any visible language button
  const langBtn = page.getByRole('button', { name: /English/i }).first();
  if (await langBtn.isVisible()) {
    await langBtn.click();
    console.log('Clicked language selection button.');
  } else {
    // If GoldenSplash is showing, click ENTER BOSS MODE
    const bossBtn = page.locator('button').filter({ hasText: /BOSS MODE/i }).first();
    if (await bossBtn.isVisible()) {
      await bossBtn.click();
    }
  }

  // Wait 1s
  await page.waitForTimeout(1000);

  // 2. Post-selection Login Card
  const loginPath = path.join(ARTIFACT_DIR, 'post_selection_login_card.png');
  await page.screenshot({ path: loginPath });
  console.log(`Saved post-selection login card to ${loginPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
