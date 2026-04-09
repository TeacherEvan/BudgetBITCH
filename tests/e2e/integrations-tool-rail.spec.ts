import { expect, test } from "@playwright/test";

test("OpenAI setup page shows explicit tool rail labels", async ({ page }) => {
  await page.goto("/settings/integrations/openai");

  await expect(page.getByRole("link", { name: "Open setup wizard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official docs" })).toBeVisible();
});
