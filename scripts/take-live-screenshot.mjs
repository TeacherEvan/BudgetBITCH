import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = '/home/android/.gemini/antigravity-cli/brain/604ac026-bf63-4e39-bd56-309294a781a7';

async function main() {
  console.log('Launching browser to capture screenshots...');
  const browser = await chromium.launch({ headless: true });
  
  // Desktop Screenshot
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });
  const desktopPath = path.join(ARTIFACT_DIR, 'budget_bitch_desktop.png');
  await desktopPage.screenshot({ path: desktopPath, fullPage: false });
  console.log(`Saved desktop screenshot to ${desktopPath}`);

  // Mobile Screenshot
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://budget-bitch-green.vercel.app/', { waitUntil: 'networkidle' });
  const mobilePath = path.join(ARTIFACT_DIR, 'budget_bitch_mobile.png');
  await mobilePage.screenshot({ path: mobilePath, fullPage: false });
  console.log(`Saved mobile screenshot to ${mobilePath}`);

  await browser.close();
}

main().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
