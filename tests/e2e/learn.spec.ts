import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Learn! and review the next lesson card", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await seedCompletedLaunchProfile(page);
  await page.goto("/learn");

  await expect(
    page.getByRole("heading", {
      name: "Comic-strip lessons for the money move that matters next.",
    }),
  ).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByText("Short lessons for the money move that matters next."),
  ).toBeVisible();
  await expect(
    page.getByText(
      "A budget is a decision made before the spending happens, not a post-chaos apology.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "List fixed bills first, then assign the remaining money to savings, food, and flexible spending.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText(
      "A raccoon CFO keeps approving snack subscriptions because nobody made a real plan.",
    ),
  ).toHaveCount(0);

  const budgetingBasicsLink = page.getByRole("link", {
    name: /review your essentials/i,
  });

  await expect(budgetingBasicsLink).toHaveAttribute("href", "/learn/budgeting-basics");
  await expect(budgetingBasicsLink).toBeVisible();
});

test("user can open Learn next from Start Smart results", async ({ page }) => {
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
  await page.getByLabel(/country/i).selectOption("SG");
  await page.getByLabel(/state/i).fill("01");
  await page.getByRole("button", { name: /open money snapshot/i }).click({ force: true });
  await page.getByRole("button", { name: /build my survival blueprint/i }).click({ force: true });

  const learnNextBlock = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Learn next" }),
  });
  const budgetingBasicsLink = learnNextBlock.getByRole("link", {
    name: /budgeting basics/i,
  });

  await expect(budgetingBasicsLink).toHaveAttribute("href", "/learn/budgeting-basics");
  await expect(budgetingBasicsLink).toBeVisible();
});
