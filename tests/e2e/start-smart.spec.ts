import { expect, test } from "@playwright/test";

test("user can open Start Smart and generate a survival blueprint", async ({
  page,
}) => {
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
          locationKey: "us-ca-los-angeles",
          housing: { confidence: "verified" },
        },
      }),
    });
  });

  await page.goto("/start-smart");

  await page.getByText("Young adult").click();
  await page.getByLabel(/^Country$/i).selectOption("US");
  await page.getByLabel(/^Province or state$/i).selectOption("CA");
  await page.getByLabel(/^City$/i).selectOption("los-angeles");
  await page
    .getByRole("button", { name: /build my survival blueprint/i })
    .click();

  await expect(page.getByText("Build starter emergency buffer")).toBeVisible();
  await expect(page.getByText("openai")).toBeVisible();
});
