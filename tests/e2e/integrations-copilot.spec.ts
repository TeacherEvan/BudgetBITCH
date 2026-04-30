import { expect, test } from "@playwright/test";
import { expectGoogleOAuthSetupNotice } from "./auth-setup";

test("GitHub Copilot hub redirects to sign-in when Google OAuth setup is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectGoogleOAuthSetupNotice(page);
});
