import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";

test("dashboard redirects to sign-in under the local no-auth harness", async ({ page }) => {
  test.slow();

  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/dashboard?workspaceId=workspace-2");

  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open sign-up" })).toHaveAttribute(
    "href",
    "/sign-up?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
  );
  await expectConvexPasswordAuthEntry(page);
});
