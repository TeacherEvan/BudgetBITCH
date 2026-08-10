import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/android/.gemini/antigravity-cli/brain/604ac026-bf63-4e39-bd56-309294a781a7';

async function main() {
  console.log('Testing Playwright Chromium with SwiftShader GL fallback...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--use-gl=swiftshader',
      '--enable-features=Vulkan,UseSkiaOutputDevice',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  // Bypass splash and language modal explicitly via storage
  await context.addInitScript(() => {
    window.sessionStorage.setItem('bb:splash-seen', 'true');
    window.localStorage.setItem('budgetbitch:locale', 'en-ZA');
  });

  await page.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const testPath = path.join(ARTIFACT_DIR, 'swiftshader_login_test.png');
  await page.screenshot({ path: testPath });
  console.log(`Saved screenshot to ${testPath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
