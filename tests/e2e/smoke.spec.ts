import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("home page shows the launch wizard before the landing board for the signed-in root flow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await seedSignedInAuthOverride(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /launch your dashboard window/i }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(/notes, calculator, and launch settings stay available on this device/i),
  ).toBeVisible();
  await expect(
    page.getByText(/dashboard, jobs, integrations, and other sync-required routes still need a live connection/i),
  ).toBeVisible();
  await expect(page.getByText(/no precise location data is collected/i)).toBeVisible();

  await expect.poll(
    () =>
      page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight),
    { timeout: 2_000 },
  ).toBeLessThanOrEqual(16);

  await expect.poll(
    () =>
      page.evaluate(() => document.body.scrollHeight - window.innerHeight),
    { timeout: 2_000 },
  ).toBeLessThanOrEqual(16);

  await expect.poll(
    () =>
      page.evaluate(() => {
        const pageShell = document.querySelector(".bb-page-shell");
        return pageShell ? pageShell.getBoundingClientRect().bottom - window.innerHeight : 0;
      }),
    { timeout: 2_000 },
  ).toBeLessThanOrEqual(16);

  await page.getByRole("combobox", { name: "City" }).click();
  await page.getByRole("combobox", { name: "City" }).fill("Dub");
  await page.getByRole("option", { name: /dublin/i }).click();
  await page.getByLabel("Visual style").selectOption("billboard");
  await page.getByLabel("Motion level").selectOption("cinematic");
  await page.getByLabel("Theme").selectOption("midnight");
  await page.getByLabel("Crypto platform placeholder").selectOption("later");
  await page.getByRole("button", { name: /save launch settings/i }).click();

  await expect(page.getByRole("heading", { name: "Plan first. Panic less." })).toBeVisible();
  await expect(page.getByRole("heading", { name: /route lanes/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open dashboard", exact: true })).toBeVisible();
});

test("home page skips the launch wizard when a signed-in root flow already has a saved profile", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Plan first. Panic less." }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /launch your dashboard window/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /route lanes/i })).toBeVisible();
});
