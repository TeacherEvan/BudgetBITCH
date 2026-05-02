import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";
import { gotoWithCommit } from "./navigation";

test("OpenAI setup page redirects to sign-in when auth is unavailable", async ({ page }) => {
  await gotoWithCommit(page, "/settings/integrations/openai");

  await expect(page).toHaveURL(/\/sign-in\?redirectTo=%2Fsettings%2Fintegrations%2Fopenai$/);
  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expectConvexPasswordAuthEntry(page);
});

test("authenticated user can scan the integrations hub and explicit provider actions", async ({ page }) => {
  await seedSignedInAuthOverride(page);
  await gotoWithCommit(page, "/settings/integrations");

  await expect(
    page.getByRole("heading", { name: /connect only the providers you can scan and trust fast/i }),
  ).toBeVisible();
  await expect(page.getByText("Official routes")).toBeVisible();
  await expect(
    page.getByTitle("Only providers you explicitly connect receive the minimum required data."),
  ).toBeVisible();

  const openAiCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "OpenAI" }),
  });

  await expect(openAiCard.getByText("Medium risk")).toBeVisible();
  await expect(openAiCard.getByText("No silent sharing")).toBeVisible();
  await expect(openAiCard.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
    "href",
    "/settings/integrations/openai",
  );
  await expect(openAiCard.getByRole("link", { name: "Open official login" })).toBeVisible();
  await expect(openAiCard.getByRole("link", { name: "Open official docs" })).toBeVisible();
});
