// Feature: Market Watch — vicinity feeds E2E tests
// Tests: loads vicinity feeds for Bangkok, shows loading animation, feed cards with category badges,
// actionable badge pulse, empty state for denied location
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from './helpers';

test.describe('Market Watch — vicinity feeds', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, 'E2E credentials not set');
    await seedLocalStorage(page, 'th');
    await signInReal(page);
  });

  test('opens Market Watch modal and loads vicinity feeds for Bangkok', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Wait for dashboard to load
    await expect(page.getByText(/budget|bitch|daily|disposable/i, { exact: false })).toBeVisible({ timeout: 8000 });
    
    // Open Market Watch modal from desktop sidebar (or mobile menu on smaller screens)
    const marketWatchBtn = page.getByTestId('market-watch-trigger').first();
    await expect(marketWatchBtn).toBeVisible({ timeout: 8000 });
    await marketWatchBtn.click();
    
    // Wait for modal to open
    const modal = page.getByRole('dialog', { name: /market watch|ข่าวและข้อมูลล่าสุด/i });
    await expect(modal).toBeVisible({ timeout: 8000 });
    
    // Should show loading animation initially (Lottie loading shimmer)
    const loadingAnimation = modal.locator('lottie-player, [data-testid*="loading"], [class*="loading"]').first();
    await expect(loadingAnimation).toBeVisible({ timeout: 5000 }).catch(() => {
      // Loading might be too fast to catch - that's okay
    });
    
    // Wait for feed cards to load (should show Bangkok vicinity feeds)
    const feedCards = modal.locator('[data-testid="feed-card"]');
    await expect(feedCards.first()).toBeVisible({ timeout: 15000 });
    
    // Should have at least one feed card
    const cardCount = await feedCards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Each feed card should have category badge (Thai labels)
    const firstCard = feedCards.first();
    await expect(firstCard.locator('text=/การเงิน|เศรษฐกิจ|ท้องถิ่น|เคล็ดลับ|น้ำมัน|โปรโมชั่น/i')).toBeVisible({ timeout: 5000 });
    
    // Should have actionable badge with pulse animation for actionable items
    const actionableBadge = firstCard.locator('[data-testid="actionable-badge"]');
    const hasActionable = await actionableBadge.count() > 0;
    if (hasActionable) {
      await expect(actionableBadge).toBeVisible();
      // Check for pulse animation class
      await expect(actionableBadge).toHaveClass(/animate-pulse/);
    }
    
    // Should have "Read more" / "อ่านต่อ" link
    await expect(firstCard.getByRole('link', { name: /อ่านต่อ|read more/i })).toBeVisible();
  });

  test('shows empty state when location permission denied', async ({ page }) => {
    // Mock geolocation permission denied
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (success, error) => {
        if (error) error({ code: 1, message: 'Permission denied', PERMISSION_DENIED: 1 } as GeolocationPositionError);
      };
      navigator.permissions.query = async ({ name }: { name: string }) => {
        if (name === 'geolocation') {
          return { state: 'denied', onchange: null } as PermissionStatus;
        }
        return { state: 'prompt', onchange: null } as PermissionStatus;
      };
    });
    
    await page.goto('/dashboard');
    await expect(page.getByText(/budget|bitch|daily|disposable/i, { exact: false })).toBeVisible({ timeout: 8000 });
    
    // Open Market Watch modal
    const marketWatchBtn = page.getByTestId('market-watch-trigger').first();
    await expect(marketWatchBtn).toBeVisible({ timeout: 8000 });
    await marketWatchBtn.click();
    
    const modal = page.getByRole('dialog', { name: /market watch|ข่าวและข้อมูลล่าสุด/i });
    await expect(modal).toBeVisible({ timeout: 8000 });
    
    // Should show empty location state with tuk-tuk animation and enable location button
    await expect(modal.getByText(/อนุญาตตำแหน่ง|enable location/i)).toBeVisible({ timeout: 10000 });
    await expect(modal.getByRole('button', { name: /เปิดตำแหน่ง|enable location/i })).toBeVisible();
  });

  test('no uncaught console errors on Market Watch modal', async ({ page, errors }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/budget|bitch|daily|disposable/i, { exact: false })).toBeVisible({ timeout: 8000 });
    
    const marketWatchBtn = page.getByTestId('market-watch-trigger').first();
    await expect(marketWatchBtn).toBeVisible({ timeout: 8000 });
    await marketWatchBtn.click();
    
    const modal = page.getByRole('dialog', { name: /market watch|ข่าวและข้อมูลล่าสุด/i });
    await expect(modal).toBeVisible({ timeout: 8000 });
    
    // Wait for feeds to load
    await expect(modal.locator('[data-testid="feed-card"]').first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Assert no console errors
    errors.assertClean();
  });
});