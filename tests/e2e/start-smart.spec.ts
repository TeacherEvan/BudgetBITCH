import { expect, test } from "@playwright/test";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("protected Start Smart journey creates a visible blueprint", async ({
  page,
}) => {
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await page.getByRole("link", { name: /start smart/i }).click();

  await expect(
    page.getByRole("heading", { name: /build your survival blueprint in one quick pass/i }),
  ).toBeVisible();
  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).fill("US");
  await page.getByLabel(/state/i).fill("CA");
  await page
    .getByRole("button", { name: /build my survival blueprint/i })
    .click();

  await expect(page.getByText("Money Survival Blueprint", { exact: true })).toBeVisible();
  await expect(page.getByText(/what must i cover first\?/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /next 7 days/i })).toBeVisible();
  await expect(page.getByText("List all fixed bills")).toBeVisible();
});
