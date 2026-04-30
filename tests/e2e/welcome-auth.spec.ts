import { expect, test } from "@playwright/test";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("signed-out visitors see the welcome auth surface at root", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /open your budgetbitch board/i }),
  ).toBeVisible({ timeout: 15000 });

  const signInLink = page.getByRole("link", { name: /open sign in/i });
  const signUpLink = page.getByRole("link", { name: /open sign-up/i });

  await expect(signInLink).toHaveAttribute("href", "/sign-in?redirectTo=%2F");
  await expect(signUpLink).toHaveAttribute("href", "/sign-up?redirectTo=%2F");
  await expect(page.getByRole("heading", { name: /plan first\. panic less\./i })).toHaveCount(0);
});

test("signed-out visitors still see welcome when a launch profile is already saved", async ({ page }) => {
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /open your budgetbitch board/i }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("heading", { name: /route lanes/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /plan first\. panic less\./i })).toHaveCount(0);
});

test("dashboard redirects to sign-in when local Clerk setup is unavailable", async ({ page }) => {
  await page.goto("/dashboard?workspaceId=workspace-2");

  await expect(page).toHaveURL(
    /\/sign-in\?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2$/,
  );
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
});

for (const authEntry of [
  {
    label: "sign in",
    linkName: /open sign in/i,
    finalUrl: /\/sign-in\?redirectTo=%2F$/,
  },
  {
    label: "sign up",
    linkName: /open sign-up/i,
    finalUrl: /\/sign-in\?redirectTo=%2F$/,
  },
] as const) {
  test(`welcome ${authEntry.label} link keeps redirectTo in the URL without local Clerk setup`, async ({ page }) => {
    await page.goto("/");

    await Promise.all([
      page.waitForURL(authEntry.finalUrl, {
        waitUntil: "commit",
      }),
      page.getByRole("link", { name: authEntry.linkName }).click(),
    ]);

    await expect(page).toHaveURL(authEntry.finalUrl);
    await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });
}