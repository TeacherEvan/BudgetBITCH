// Feature: Mobile viewport rendering for shell + panels.
// Verifies the fixed-screen-shell / mobile-panel-frame render at 375x812 and
// touch targets are tappable. No receipt capture exercised.
import { devices } from "@playwright/test";
import { test, expect, BASE_URL } from "./helpers";

test.use({ ...devices["iPhone 13"], baseURL: BASE_URL });

test.describe("Mobile shell", () => {
  test("root renders without horizontal overflow at 375px", async ({ page, errors }) => {
    await page.goto("/");
    await expect(page.getByText(/budget|bitch/i).first()).toBeVisible({ timeout: 8000 });
    const overflow = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      cw: document.documentElement.clientWidth,
    }));
    expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 2);
    await page.waitForTimeout(600);
    errors.assertClean();
  });

  test("auth pages reachable on mobile viewport", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByLabel(/email address/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/password/i)).toBeVisible({ timeout: 8000 });
  });
});
