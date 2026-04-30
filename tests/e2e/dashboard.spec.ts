import { expect, test } from "@playwright/test";
import { expectGoogleOAuthSetupNotice } from "./auth-setup";

test("dashboard redirects to sign-in under the local no-Google-OAuth harness", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/dashboard?workspaceId=workspace-2");

  await expect(page).toHaveURL(
    /\/sign-in\?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2$/,
  );
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectGoogleOAuthSetupNotice(page);
});
