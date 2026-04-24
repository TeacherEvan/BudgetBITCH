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

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByRole("heading", { name: /sign in is not ready yet/i })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText(/clerk authentication is not configured on the server/i)).toBeVisible();
});

for (const authEntry of [
  {
    label: "sign in",
    linkName: /open sign in/i,
    pathname: "/sign-in",
    heading: /sign in is not ready yet/i,
  },
  {
    label: "sign up",
    linkName: /open sign-up/i,
    pathname: "/sign-up",
    heading: /sign up is not ready yet/i,
  },
] as const) {
  test(`welcome ${authEntry.label} link keeps redirectTo in the URL without local Clerk setup`, async ({ page }) => {
    await page.goto("/");

    await Promise.all([
      page.waitForURL(new RegExp(`${authEntry.pathname.replace("/", "\\/")}\\?redirectTo=%2F$`), {
        waitUntil: "commit",
      }),
      page.getByRole("link", { name: authEntry.linkName }).click(),
    ]);

    await expect(page).toHaveURL(new RegExp(`${authEntry.pathname.replace("/", "\\/")}\\?redirectTo=%2F$`));
    await expect(page.getByRole("heading", { name: authEntry.heading })).toBeVisible({
      timeout: 15000,
    });
  });
}