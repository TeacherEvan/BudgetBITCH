import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";
import { gotoWithCommit } from "./navigation";

test("OpenClaw hub redirects to sign-in when auth is unavailable", async ({ page }) => {
  await gotoWithCommit(page, "/settings/integrations");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectConvexPasswordAuthEntry(page);
});

test("authenticated user can open the OpenClaw provider page", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await gotoWithCommit(page, "/settings/integrations/openclaw");

  await expect(page.getByRole("heading", { name: "Connect OpenClaw" })).toBeVisible();
  await expect(page.getByText("High-risk connection")).toBeVisible();
  await expect(page.getByText("Local reach")).toBeVisible();
  await expect(page.getByRole("heading", { name: "System access warning" })).toBeVisible();
  await expect(page.getByText("System reach", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open official docs" })).toBeVisible();
});
