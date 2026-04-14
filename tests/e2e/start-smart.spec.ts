import { expect, test } from "@playwright/test";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Start Smart and generate a survival blueprint", async ({
  page,
}) => {
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await page.getByRole("link", { name: /start smart/i }).click();

  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).fill("US");
  await page.getByLabel(/state/i).fill("CA");
  await page
    .getByRole("button", { name: /build my survival blueprint/i })
    .click();

  await expect(page.getByText("Money Survival Blueprint")).toBeVisible();
  await expect(page.getByText(/what must i cover first/i)).toBeVisible();
});
