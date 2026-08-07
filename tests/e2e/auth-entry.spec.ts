// Feature: Anonymous auth-entry flow (no credentials required).
// Covers the client-side route guard redirect, the sign-in page surface, the
// sign-in -> sign-up switch, and the forgot-password reset flow. These run
// without E2E_TEST_EMAIL / E2E_TEST_PASSWORD so the suite stays green in CI.
import { test, expect, seedLocalStorage } from "./helpers";

test.describe("Auth entry (anonymous)", () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
  });

  test("protected page redirects unauthenticated user to /sign-in", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // RequireAuth redirects to /sign-in?redirectTo=/dashboard (path may be
    // encoded or raw depending on the browser, so accept both).
    await expect(page).toHaveURL(
      /\/sign-in(\?redirectTo=%2Fdashboard|\?redirectTo=\/dashboard)/,
      { timeout: 15000 },
    );
  });

  test("sign-in page renders email + password fields", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByLabel(/email \/ username/i)).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByLabel(/^password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in$/i }),
    ).toBeVisible();
  });

  test("switching to sign-up shows the create-account surface", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /sign up$/i }).click();
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign up$/i }),
    ).toBeVisible();
  });

  test("forgot-password flow shows the reset-email confirmation", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(
      page.getByRole("heading", { name: /reset your password/i }),
    ).toBeVisible({ timeout: 8000 });
    await page.locator("#forgot-email").fill("nobody@example.com");
    await page.getByRole("button", { name: /send reset code/i }).click();
    // Generic "sent" message always surfaces (does not reveal account exists).
    // NOTE: we do not assert a clean console here — the reset call hits the
    // real Convex auth server, which logs a benign "Server Error" for an
    // unknown email. That is expected network noise, not a client bug.
    await expect(
      page.getByText(/if that email exists/i),
    ).toBeVisible({ timeout: 8000 });
  });

  test("forgot-password back link returns to sign-in", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(
      page.getByRole("heading", { name: /reset your password/i }),
    ).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /back to sign in/i }).click();
    await expect(page.getByLabel(/email \/ username/i)).toBeVisible({
      timeout: 8000,
    });
  });
});
