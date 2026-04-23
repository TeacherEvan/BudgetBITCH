import { expect, test } from "@playwright/test";

test("OpenClaw wizard is reachable from the hub", async ({ page }) => {
  await page.goto("/settings/integrations");

  await Promise.all([
    page.waitForURL(/\/settings\/integrations\/openclaw(?:[?#].*)?$/),
    page.locator('a[href="/settings/integrations/openclaw"]').click(),
  ]);

  await expect(
    page.getByRole("heading", { name: "Connect OpenClaw" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to connection hub" }),
  ).toBeVisible();
});
