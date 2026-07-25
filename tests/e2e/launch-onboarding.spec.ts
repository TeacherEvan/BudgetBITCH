// Feature: Launch / onboarding surfaces — golden splash, manifesto interstitial,
// and locale selection. REGRESSION GUARD: selecting en-ZA / en-TH / th must NOT
// throw next-intl IntlError (MISSING_MESSAGE for localeSwitcher.options.*).
import { test, expect } from "./helpers";

test.describe("Launch & onboarding", () => {
  test("golden splash shows on first load with ENTER button", async ({ page, errors }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.removeItem("bb:manifesto-v1");
    });
    await page.goto("/");
    await expect(page.getByTestId("golden-splash")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /enter boss mode/i })).toBeVisible({ timeout: 8000 });
    await page.waitForTimeout(800);
    errors.assertClean();
  });

  test("locale select en-ZA / en-TH / th does not throw IntlError", async ({ page, errors }) => {
    // Force a locale that previously triggered MISSING_MESSAGE, then reload.
    for (const loc of ["en-ZA", "en-TH", "th"] as const) {
      await page.addInitScript(
        ([l]) => {
          localStorage.setItem("budgetbitch:locale", l);
        },
        [loc],
      );
      await page.goto("/");
      await page.waitForTimeout(1200);
      // No IntlError (MISSING_MESSAGE) should appear in console.
      errors.assertClean();
    }
  });
});
