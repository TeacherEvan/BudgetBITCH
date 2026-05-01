import { expect, test } from "@playwright/test";
import { expectGoogleOAuthSetupNotice } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";

test("OpenClaw hub redirects to sign-in when Google OAuth setup is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectGoogleOAuthSetupNotice(page);
});

test("authenticated user can open the OpenClaw provider page", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await page.goto("/settings/integrations/openclaw");

  await expect(page.getByRole("heading", { name: "Connect OpenClaw" })).toBeVisible();
  await expect(page.getByText("High-risk connection")).toBeVisible();
  await expect(page.getByText("Local reach")).toBeVisible();
  await expect(page.getByRole("heading", { name: "System access warning" })).toBeVisible();
  await expect(page.getByText("System reach", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official docs" })).toBeVisible();
});
