import { expect, test } from "@playwright/test";

test("user can open Jobs and review a blueprint-aware listing", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /enter the magic/i }).click();
  await page.getByRole("link", { name: "Jobs that fit the plan" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Income options that match real-life pressure.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Remote Customer Support Specialist"),
  ).toBeVisible();
  await page.getByRole("link", { name: /open job/i }).first().click();

  await expect(
    page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  ).toBeVisible();
  await expect(page.getByText("Why this fits")).toBeVisible();
});
