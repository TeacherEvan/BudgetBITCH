import { expect, test } from "@playwright/test";

test("dashboard visual slice renders", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "Workspace dashboard for Household budget" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Submit today's check-in" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Switch workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Watch the pressure points" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Open the next route with context" })).toBeVisible();
  await expect(
    page.getByText("Showing sample workspace context until live memberships are available."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit today's check-in" })).toBeDisabled();
});
