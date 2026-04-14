import type { Page } from "@playwright/test";

export async function seedCompletedLaunchProfile(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "budgetbitch:launch-profile",
      JSON.stringify({
        completed: true,
        completedAt: "2026-04-10T12:00:00.000Z",
        city: "Dublin",
        layoutPreset: "launcher_grid",
        motionPreset: "cinematic",
        themePreset: "midnight",
        cryptoPlatform: "later",
      }),
    );
  });
}