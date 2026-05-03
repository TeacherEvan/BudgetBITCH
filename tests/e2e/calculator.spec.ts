import { expect, test } from "@playwright/test";
import { gotoWithCommit } from "./navigation";

test("calculator page renders and performs basic arithmetic", async ({ page }) => {
  test.slow();

  await gotoWithCommit(page, "/calculator");

  await expect(page.getByRole("heading", { level: 1, name: "Calculator" })).toBeVisible();
  await expect(page.getByText("Quick arithmetic for budget checks.")).toBeVisible();
  const status = page.getByRole("status");

  await expect(status).toHaveText("0");
  await page.waitForFunction(
    () => window.localStorage.getItem("bb-calculator-draft") !== null,
  );

  await page.getByRole("button", { name: "3" }).click();
  await expect(status).toHaveText("3");
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: "5" }).click();
  await expect(status).toHaveText("5");
  await page.getByRole("button", { name: "=" }).click();

  await expect(status).toHaveText("8");
});

test("calculator page has a working home nav link", async ({ page }) => {
  await gotoWithCommit(page, "/calculator");
  await expect(page.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
