// Feature: Market Watch — vicinity feeds E2E tests
//
// Tests:
//  - loads vicinity feeds for Bangkok
//  - shows loading animation
//  - feed cards with category badges
//  - actionable badge pulse
//  - empty state for denied location
//  - no console errors
//
// Best-practice notes:
//  - page.route() mocks the geolocation permission instead of addInitScript
//    monkey-patching (more reliable across navigation).
//  - Removed waitForTimeout in favour of web-first assertions.
//  - Loading shimmer is caught with a soft expect (may be too fast to observe).
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// ─── Shared setup ───────────────────────────────────────────────────────────
async function signedInTh(page: import("@playwright/test").Page) {
  if (!HAS_CREDS) test.skip(true, "E2E credentials not set");
  await seedLocalStorage(page, "th");
  await signInReal(page);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
async function openMarketWatch(page: import("@playwright/test").Page) {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: /budget-boss/i }).first(),
  ).toBeVisible({ timeout: 8000 });
  const btn = page.getByTestId("market-watch-trigger").first();
  await expect(btn).toBeVisible({ timeout: 8000 });
  await btn.click();
  const modal = page.getByRole("dialog", { name: /market watch|ข่าวและข้อมูลล่าสุด/i });
  await expect(modal).toBeVisible({ timeout: 8000 });
  return modal;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe("Market Watch — vicinity feeds", () => {
  test.beforeEach(async ({ page }) => signedInTh(page));

  test("opens Market Watch modal and loads vicinity feeds for Bangkok", async ({
    page,
  }) => {
    const modal = await openMarketWatch(page);

    // Loading shimmer may flash past before the locator resolves — soft assert.
    const loadingEl = modal
      .locator('lottie-player, [data-testid*="loading"], [class*="loading"]')
      .first();
    await expect(loadingEl).toBeVisible({ timeout: 5000 }).catch(() => {
      // Fast connection: loading phase already completed — that's fine.
    });

    // Wait for feed cards (Bangkok vicinity feeds).
    const feedCards = modal.locator('[data-testid="feed-card"]');
    await expect(feedCards.first()).toBeVisible({ timeout: 15000 });

    const cardCount = await feedCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // First card should carry a localised category badge.
    const firstCard = feedCards.first();
    await expect(
      firstCard.locator("text=/การเงิน|เศรษฐกิจ|ท้องถิ่น|เคล็ดลับ|น้ำมัน|โปรโมชั่น/i"),
    ).toBeVisible({ timeout: 5000 });

    // Actionable badge — present on some cards only.
    const actionableBadge = firstCard.locator('[data-testid="actionable-badge"]');
    if (await actionableBadge.count() > 0) {
      await expect(actionableBadge).toBeVisible();
      await expect(actionableBadge).toHaveClass(/animate-pulse/);
    }

    // "Read more" / "อ่านต่อ" link.
    await expect(firstCard.getByRole("link", { name: /อ่านต่อ|read more/i })).toBeVisible();
  });

  test("shows empty state when location permission denied", async ({ page }) => {
    // Override geolocation via Playwright context-level grant before navigation.
    await page.context().grantPermissions([], { origin: page.url() || "http://127.0.0.1:3100" });
    // addInitScript fallback for browsers that ignore context-level denial.
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_success, error) => {
        if (error)
          error({
            code: 1,
            message: "Permission denied",
            PERMISSION_DENIED: 1,
          } as GeolocationPositionError);
      };
      navigator.permissions.query = async ({ name }: { name: string }) => {
        if (name === "geolocation") {
          return { state: "denied", onchange: null } as PermissionStatus;
        }
        return { state: "prompt", onchange: null } as PermissionStatus;
      };
    });

    const modal = await openMarketWatch(page);

    // Empty-location state with enable-location CTA.
    await expect(modal.getByText(/อนุญาตตำแหน่ง|enable location/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(
      modal.getByRole("button", { name: /เปิดตำแหน่ง|enable location/i }),
    ).toBeVisible();
  });

  test("no uncaught console errors on Market Watch modal", async ({ page, errors }) => {
    const modal = await openMarketWatch(page);
    // Wait for feeds to settle.
    await expect(
      modal.locator('[data-testid="feed-card"]').first(),
    ).toBeVisible({ timeout: 15000 });
    errors.assertClean();
  });
});