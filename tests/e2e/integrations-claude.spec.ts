import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";
import { gotoWithCommit } from "./navigation";

test("Claude hub redirects to sign-in when auth is unavailable", async ({ page }) => {
  await gotoWithCommit(page, "/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectConvexPasswordAuthEntry(page);
});

test("authenticated user can open the Claude provider page", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await gotoWithCommit(page, "/settings/integrations/claude");

  await expect(page.getByRole("heading", { name: "Connect Claude" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to connection hub" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
    "href",
    "/settings/integrations/claude",
  );
  await expect(page.getByRole("heading", { name: "Privacy Shield" })).toBeVisible();
});
