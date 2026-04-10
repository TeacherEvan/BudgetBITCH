import { expect, test } from "@playwright/test";

test("home page shows the launch wizard before the landing board", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /launch your dashboard window/i })).toBeVisible();
  await expect(page.getByText(/no precise location data is collected/i)).toBeVisible();

  await page.getByLabel("City").fill("Dublin");
  await page.getByLabel("Visual style").selectOption("billboard");
  await page.getByLabel("Motion level").selectOption("cinematic");
  await page.getByLabel("Theme").selectOption("midnight");
  await page.getByLabel("Crypto platform placeholder").selectOption("later");
  await page.getByRole("button", { name: /save launch settings/i }).click();

  await expect(page.getByRole("heading", { name: "Plan first. Panic less." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /route lanes/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open dashboard", exact: true })).toBeVisible();
});

test("home page skips the launch wizard when a saved profile exists", async ({ page }) => {
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

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Plan first. Panic less." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /launch your dashboard window/i })).toHaveCount(0);
});
