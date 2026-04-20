import { expect, test } from "@playwright/test";

test("home page renders the AuthKit landing page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /convex \+ next\.js \+ workos/i,
    }),
  ).toBeVisible({ timeout: 10000 });

  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});
