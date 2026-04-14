import { expect, test } from "@playwright/test";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Jobs and review a blueprint-aware listing", async ({ page }) => {
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await page.getByRole("link", { name: "Explore jobs" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Quick job routes for real-life pressure.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Remote Customer Support Specialist")).toBeVisible();
  await expect(page.getByText("Posted 4 days ago")).toBeVisible();

  const targetCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  });

  await targetCard.getByRole("link", { name: /open job details/i }).click();

  await page.waitForURL(/\/jobs\//);

  await expect(
    page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why this fits" })).toBeVisible();
});
