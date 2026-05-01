import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";

test("OpenAI hub redirects to sign-in when auth is unavailable", async ({ page }) => {
  await page.goto("/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectConvexPasswordAuthEntry(page);
});

test("authenticated user can open the OpenAI provider page", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await page.goto("/settings/integrations/openai");

  await expect(page.getByRole("heading", { name: "Connect OpenAI" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to connection hub" })).toHaveAttribute(
    "href",
    "/settings/integrations",
  );
  await expect(page.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
    "href",
    "/settings/integrations/openai",
  );
  await expect(page.getByRole("heading", { name: "Privacy Shield" })).toBeVisible();
  await expect(page.getByText("Minimum data")).toBeVisible();
});
