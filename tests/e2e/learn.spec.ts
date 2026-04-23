import { expect, test } from "@playwright/test";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Learn! from Start Smart results and view a lesson", async ({
  page,
}) => {
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await page.getByRole("link", { name: /start smart/i }).click();

  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).selectOption("US");
  await page.getByLabel(/state/i).fill("CA");
  await page.getByRole("button", { name: /build my survival blueprint/i }).click();

  await expect(
    page.getByText("Money Survival Blueprint", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /budgeting basics/i }).click();

  await page.waitForURL(/\/learn\//);

  await expect(
    page.getByRole("heading", { name: "Budgeting Basics" }),
  ).toBeVisible();
  await expect(page.getByText("Plain-English breakdown")).toBeVisible();
});
