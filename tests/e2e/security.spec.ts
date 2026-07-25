// Feature: Security page — static "how your data stays safe" page.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Security page", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders architecture + encryption sections", async ({ page, errors }) => {
    await page.goto("/security");
    await expect(page.getByTestId("security-stack")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("security-encryption")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("security-five-year-old")).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(600);
    errors.assertClean();
  });
});
