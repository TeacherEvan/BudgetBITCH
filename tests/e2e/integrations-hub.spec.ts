import { expect, test } from "@playwright/test";

test("Integrations hub surfaces deployment readiness and clear provider actions", async ({
  page,
}) => {
  await page.goto("/settings/integrations");

  await expect(
    page.getByRole("heading", { name: "Turn the env file into real capability" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Auth and live workspace mode" })).toBeVisible();

  const claudeCard = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: "Claude" }) });

  await expect(claudeCard.getByRole("link", { name: "Open setup wizard" })).toBeVisible();
  await expect(claudeCard.getByRole("link", { name: "Open official login" })).toBeVisible();
  await expect(claudeCard.getByRole("link", { name: "Open official docs" })).toBeVisible();
});
