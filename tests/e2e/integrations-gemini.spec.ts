import { expect, test } from "@playwright/test";

test("Gemini wizard is reachable from the hub", async ({ page }) => {
  await page.goto("/settings/integrations");
  await page.locator('a[href="/settings/integrations/gemini"]').click();
  await page.waitForURL("**/settings/integrations/gemini");

  await expect(
    page.getByRole("heading", { name: "Connect Gemini" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to connection hub" }),
  ).toBeVisible();
});