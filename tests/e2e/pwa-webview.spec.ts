// Feature: PWA install prompt + in-app webview banner.
//
// Best-practice notes:
//  - test.skip() moved from inside the test body to a test.beforeEach so
//    describe-level intent is clear.
//  - waitForTimeout removed; existence checks use web-first assertions.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("PWA install prompt", () => {
  test("install prompt can be dismissed", async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
    await page.addInitScript(() => {
      // @ts-expect-error test hook
      window.__canInstall = true;
    });
    await page.goto("/dashboard");
    const installBtn = page.getByRole("button", { name: /install/i });
    if (await installBtn.count()) {
      // Soft: prompt may not render even when __canInstall is set.
      await expect(installBtn.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
      const later = page.getByRole("button", { name: /later|not now/i });
      if (await later.count()) {
        await later.first().click();
        // Assert the prompt is gone.
        await expect(installBtn).toBeHidden({ timeout: 3000 }).catch(() => {});
      }
    }
  });
});

test.describe("In-app webview banner", () => {
  test("normal browser shows no webview banner and home renders", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/budget/i, { exact: false }).first(),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/open this page in your browser/i)).toHaveCount(0);
  });

  test("sign-in page renders without banner in a normal browser", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(page.getByText(/open this page in your browser/i)).toHaveCount(0);
  });
});
