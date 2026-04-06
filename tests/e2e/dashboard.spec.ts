import { expect, test } from "@playwright/test";

test("dashboard visual slice renders", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByText("Treasure Map")).toBeVisible();
  await expect(page.getByText("Luck Meter")).toBeVisible();
  await expect(page.getByText("Bills Due Soon")).toBeVisible();
});
