import { expect, test } from "@playwright/test";

test("OpenAI wizard is reachable from the hub", async ({ page }) => {
  await page.goto("/settings/integrations");
  await page.locator('a[href="/settings/integrations/openai"]').click();

  await expect(
    page.getByRole("heading", { name: "Connect OpenAI" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to connection hub" }),
  ).toBeVisible();
});
