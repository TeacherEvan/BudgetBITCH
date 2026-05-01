import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("home page shows the launch wizard before the landing board for the signed-in root flow", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await seedSignedInAuthOverride(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "Ballpark expenses" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText(/startup questionnaire/i),
  ).toBeVisible();
  await expect(
    page.getByText(/Add rough recurring costs first so BudgetBITCH can open with a practical money baseline/i),
  ).toBeVisible();
  await expect(page.getByText(/This first popup stays lightweight/i).first()).toBeVisible();

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

  await page.getByRole("textbox", { name: "Custom expense title" }).fill("Rent");
  await page.getByRole("spinbutton", { name: "Rough monthly amount" }).fill("1200");
  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByRole("button", { name: "Finish startup" }).click();

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
