import { expect, test } from "@playwright/test";

test("Claude wizard is reachable from the hub", async ({ page }) => {
  await page.goto("/settings/integrations");

  await Promise.all([
    page.waitForURL(/\/settings\/integrations\/claude(?:[?#].*)?$/),
    page.locator('a[href="/settings/integrations/claude"]').click(),
  ]);

  await expect(
    page.getByRole("heading", { name: "Connect Claude" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to connection hub" }),
  ).toBeVisible();
});
