import { expect, test } from "@playwright/test";

test("dashboard visual slice renders", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Treasure Map" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Luck Meter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bills Due Soon" })).toBeVisible();
});
