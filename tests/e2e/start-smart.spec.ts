import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Start Smart and generate a survival blueprint", async ({
  page,
}) => {
  await seedSignedInAuthOverride(page);
  await seedCompletedLaunchProfile(page);
  await page.route("**/api/v1/start-smart/blueprint", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        blueprint: {
          priorityStack: ["cover_essentials"],
          riskWarnings: ["income_volatility_risk"],
          next7Days: ["List all fixed bills"],
          next30Days: ["Build starter emergency buffer"],
          learnModuleKeys: ["budgeting_basics"],
          recommendedIntegrations: ["openai"],
        },
        regional: {
          housing: { confidence: "verified" },
        },
      }),
    });
  });
  await page.goto("/start-smart");

  await page.getByRole("button", { name: /set home base/i }).click();
  await expect(page.getByRole("heading", { name: /set one sticky region/i })).toBeVisible();
  await page.getByLabel(/country/i).selectOption("SG");
  await page.getByLabel(/state/i).fill("01");
  const openMoneySnapshotButton = page.getByRole("button", {
    name: /open money snapshot/i,
  });
  await openMoneySnapshotButton.click({ force: true });
  await expect(page.getByRole("heading", { name: /only the core survival inputs/i })).toBeVisible();
  const buildBlueprintButton = page.getByRole("button", {
    name: /build my survival blueprint/i,
  });
  await buildBlueprintButton.click({ force: true });

  await expect(page.getByText("Money Survival Blueprint")).toBeVisible();
  await expect(page.getByRole("heading", { name: /first moves/i })).toBeVisible();
  await expect(page.getByText("Build starter emergency buffer")).toBeVisible();
});
