import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/android/.gemini/antigravity-cli/brain/604ac026-bf63-4e39-bd56-309294a781a7';

async function main() {
  console.log('Capturing login card directly...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  
  // Seed sessionStorage so splash is bypassed
  await context.addInitScript(() => {
    sessionStorage.setItem('bb:splash-seen', 'true');
    localStorage.setItem('budgetbitch:locale', 'en');
    localStorage.setItem('bb:manifesto-v1', '1');
  });

  const page = await context.newPage();
  await page.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });

  await page.getByRole('heading', { name: /Welcome back/i }).waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);

  const loginPath = path.join(ARTIFACT_DIR, 'login_card_direct.png');
  await page.screenshot({ path: loginPath });
  console.log(`Saved direct login card screenshot to ${loginPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
