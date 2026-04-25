import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Learn! from Start Smart results and view a lesson", async ({
  page,
}) => {
  test.slow();

  await seedSignedInAuthOverride(page);
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  const startSmartLink = page.getByRole("link", { name: /start smart/i });

  await expect(startSmartLink).toHaveAttribute("href", "/start-smart");
  await page.goto("/start-smart");

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

  const blueprintResult = page.locator("section").filter({
    has: page.getByRole("heading", { name: "What must I cover first?" }),
  });
  const learnNextBlock = blueprintResult.locator("article").filter({
    has: page.getByRole("heading", { name: "Learn next" }),
  });
  const budgetingBasicsLink = learnNextBlock.getByRole("link", {
    name: /budgeting basics/i,
  });

  await expect(budgetingBasicsLink).toHaveAttribute("href", "/learn/budgeting-basics");
  await expect(budgetingBasicsLink).toBeVisible();

  await Promise.all([
    page.waitForURL("**/learn/budgeting-basics", { waitUntil: "commit" }),
    budgetingBasicsLink.click(),
  ]);

  await expect(
    page.getByRole("heading", { name: "Budgeting Basics" }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/learn\/budgeting-basics$/);
  await expect(page.getByText("Plain-English breakdown")).toBeVisible();
});
