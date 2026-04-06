import { expect, test } from "@playwright/test";

test("user can open Learn! from Start Smart results and view a lesson", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: /enter the magic/i }).click();
  await page.getByRole("link", { name: /start smart/i }).click();

  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).fill("US");
  await page.getByLabel(/state/i).fill("CA");
  await page.getByRole("button", { name: /build my survival blueprint/i }).click();

  await expect(
    page.getByText("Money Survival Blueprint", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /budgeting basics/i }).click();

  await expect(page.getByText("Learn!")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Budgeting Basics" }),
  ).toBeVisible();
  await expect(page.getByText("Plain-English breakdown")).toBeVisible();
});
