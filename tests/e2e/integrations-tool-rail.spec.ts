import { expect, test } from "@playwright/test";

test("OpenAI setup page redirects to sign-in when local Clerk setup is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations/openai");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: /sign in is not ready yet/i })).toBeVisible();
});
