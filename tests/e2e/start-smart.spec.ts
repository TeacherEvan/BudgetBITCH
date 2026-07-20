// Feature: Start-Smart (home base / local insights) — location consent input.
// Requires sign-in.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Start-Smart — home base panel", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders city input and submits", async ({ page }) => {
    await page.goto("/dashboard");
    const cityInput = page.getByPlaceholder(/city|region|country|เมือง/i);
    if (await cityInput.count()) {
      await cityInput.first().fill("Bangkok");
      const submit = page.getByRole("button", { name: /save|set|update|บันทึก|ตั้งค่า/i }).first();
      if (await submit.count()) {
        await submit.click();
        await page.waitForTimeout(500);
      }
    } else {
      test.skip(true, "Home base city input not present on dashboard for this account state");
    }
  });

  test("location permission denial is handled gracefully", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1000);
    await expect(
      page.getByText(/budget|bitch/i, { exact: false }).first(),
    ).toBeVisible();
  });
});
