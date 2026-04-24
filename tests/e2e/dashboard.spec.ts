import { expect, test } from "@playwright/test";

test("dashboard redirects to sign-in under the local no-Clerk harness", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/dashboard?workspaceId=workspace-2");

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: /sign in is not ready yet/i })).toBeVisible();
  await expect(page.getByText(/clerk authentication is not configured on the server/i)).toBeVisible();
});
