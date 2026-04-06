import { expect, test } from "@playwright/test";

test("GitHub Copilot wizard is reachable from the hub", async ({ page }) => {
  await page.goto("/settings/integrations");
  await page.locator('a[href="/settings/integrations/copilot"]').click();

  await expect(
    page.getByRole("heading", { name: "Connect GitHub Copilot" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to connection hub" }),
  ).toBeVisible();
});
