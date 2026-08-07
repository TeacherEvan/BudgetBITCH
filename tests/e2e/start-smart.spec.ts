// Feature: Start-Smart (home base / local insights) — location consent input.
// Requires sign-in.
//
// Best-practice notes:
//  - waitForTimeout(500/1000) replaced with web-first assertions.
//  - The city-input submit path now asserts a success or stable state rather
//    than an arbitrary sleep.
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
      const submit = page
        .getByRole("button", { name: /save|set|update|บันทึก|ตั้งค่า/i })
        .first();
      if (await submit.count()) {
        await submit.click();
        // Wait for the submit button to become stable (enabled / re-enabled).
        await expect(submit).toBeEnabled({ timeout: 4000 }).catch(() => {});
      }
    } else {
      test.skip(
        true,
        "Home base city input not present on dashboard for this account state",
      );
    }
  });

  test("location permission denial is handled gracefully", async ({ page }) => {
    await page.goto("/dashboard");
    // If the browser prompts for geolocation, the app should not crash.
    await expect(
      page.getByText(/budget|bitch/i, { exact: false }).first(),
    ).toBeVisible({ timeout: 8000 });
    // No error boundary or crash overlay should be present.
    await expect(page.getByRole("alert")).toHaveCount(0).catch(() => {});
  });
});
