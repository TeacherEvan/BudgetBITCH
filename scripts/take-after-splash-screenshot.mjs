import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/android/.gemini/antigravity-cli/brain/604ac026-bf63-4e39-bd56-309294a781a7';

async function main() {
  console.log('Launching browser with animation controls...');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  
  // Navigate to live Vercel site
  await page.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });

  // Disable CSS animations & Framer Motion transitions for deterministic crisp screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01s !important;
      }
    `,
  });

  // 1. Capture Splash Screen
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const splashPath = path.join(ARTIFACT_DIR, 'splash_screen.png');
  await page.screenshot({ path: splashPath, animations: 'disabled' });
  console.log(`Saved splash screenshot to ${splashPath}`);

  // 2. Dismiss Splash to show Login Card
  await page.evaluate(() => {
    sessionStorage.setItem('bb:splash-seen', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // Re-inject animation disable style
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.01s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01s !important;
      }
    `,
  });

  // Wait for login heading & inputs
  await page.locator('h1').waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);

  const loginPath = path.join(ARTIFACT_DIR, 'login_screen_after_splash.png');
  await page.screenshot({ path: loginPath, animations: 'disabled' });
  console.log(`Saved login screen screenshot to ${loginPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
