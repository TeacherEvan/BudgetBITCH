import { expect, test } from "@playwright/test";

test("OpenAI hub redirects to sign-in when local Clerk setup is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
});
