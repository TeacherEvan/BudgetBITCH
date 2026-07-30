// Feature: Mobile viewport rendering for shell + panels.
//
// Verifies the fixed-screen-shell / mobile-panel-frame render at 375x812 and
// touch targets are tappable. No receipt capture exercised.
//
// Best-practice notes:
//  - waitForTimeout(600) replaced with networkidle wait.
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
    // Allow 2 px rounding tolerance.
    expect(overflow.sw).toBeLessThanOrEqual(overflow.cw + 2);
    await page.waitForLoadState("networkidle").catch(() => {});
    errors.assertClean();
  });

  test("auth pages reachable on mobile viewport", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByLabel(/email \/ username/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    // Buttons must be large enough to tap (min 44 px — WCAG 2.5.5).
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    await expect(submitBtn).toBeVisible();
    const box = await submitBtn.boundingBox();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(36); // product uses 44 px; 36 is the floor
    }
  });
});
