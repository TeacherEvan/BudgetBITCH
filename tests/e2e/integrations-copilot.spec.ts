import { expect, test } from "@playwright/test";
import { expectGoogleOAuthSetupNotice } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";

test("GitHub Copilot hub redirects to sign-in when Google OAuth setup is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectGoogleOAuthSetupNotice(page);
});

test("authenticated user can open the GitHub Copilot provider page", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await page.goto("/settings/integrations/copilot");

  await expect(page.getByRole("heading", { name: "Connect GitHub Copilot" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "System access warning" })).toBeVisible();
  await expect(page.getByText("System reach")).toBeVisible();
  await expect(page.getByText("Risk checklist")).toBeVisible();
  await expect(page.getByText("Repository reach")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official docs" })).toBeVisible();
});
