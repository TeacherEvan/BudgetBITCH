import { expect, test } from "@playwright/test";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Learn! from Start Smart results and view a lesson", async ({
  page,
}) => {
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  await Promise.all([
    page.waitForURL(/\/start-smart(?:[?#].*)?$/, { waitUntil: "commit" }),
    page.getByRole("link", { name: /start smart/i }).click(),
  ]);

  const youngAdultTemplate = page.getByRole("button", { name: /young adult/i });

  await youngAdultTemplate.click();
  await expect(
    page.locator("aside").getByRole("heading", { name: "Young adult", exact: true }),
  ).toBeVisible();
  await page.getByLabel(/country/i).selectOption("US");
  await page.getByLabel(/state/i).fill("CA");

  const buildBlueprintButton = page.getByRole("button", {
    name: /build my survival blueprint/i,
  });

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/start-smart/blueprint") &&
        response.request().method() === "POST" &&
        response.ok(),
    ),
    buildBlueprintButton.click(),
  ]);

  await expect(
    page.getByText("Money Survival Blueprint", { exact: true }),
  ).toBeVisible({ timeout: 15000 });

  const budgetingBasicsLink = page.getByRole("link", { name: /budgeting basics/i });

  await Promise.all([
    page.waitForURL(/\/learn\/budgeting-basics(?:[?#].*)?$/, { waitUntil: "commit" }),
    budgetingBasicsLink.click(),
  ]);

  await expect(
    page.getByRole("heading", { name: "Budgeting Basics" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Plain-English breakdown")).toBeVisible();
});
