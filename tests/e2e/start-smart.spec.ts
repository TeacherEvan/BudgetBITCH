import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";
import { gotoWithCommit } from "./navigation";
import { buildBlueprint, openHomeBasePanel, openMoneySnapshotPanel } from "./start-smart-helpers";

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
  await gotoWithCommit(page, "/start-smart");

  await openHomeBasePanel(page);
  await page.getByLabel(/country/i).selectOption("SG");
  await page.getByLabel(/state or region/i).fill("01");
  await openMoneySnapshotPanel(page);
  await buildBlueprint(page);

  await expect(page.getByText("Money Survival Blueprint")).toBeVisible();
  await expect(page.getByRole("heading", { name: /first moves/i })).toBeVisible();
  await expect(page.getByText("Build starter emergency buffer")).toBeVisible();
});
