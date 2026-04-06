import { expect, test } from "@playwright/test";

test("home page renders the landing message", async ({ page }) => {
  await page.goto("/");

  const enterButton = page.getByRole("button", { name: /enter the magic/i });

  await expect(enterButton).toBeVisible({ timeout: 10000 });
  await enterButton.click();

  await expect(
    page.getByRole("heading", { name: "The storybook spectacle starts here." }),
  ).toBeVisible();
});
