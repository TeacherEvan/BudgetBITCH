import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";

test("Gemini hub redirects to sign-in when auth is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectConvexPasswordAuthEntry(page);
});

test("authenticated user can open the Gemini provider page", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await page.goto("/settings/integrations/gemini");

  await expect(page.getByRole("heading", { name: "Connect Gemini" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
    "href",
    "/settings/integrations/gemini",
  );
  await expect(page.getByRole("heading", { name: "Privacy Shield" })).toBeVisible();
});