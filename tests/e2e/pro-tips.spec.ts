// Feature: BOSS Pro-Tips card — renders on the signed-out auth surface
// (src/components/auth/clean-auth-card.tsx embeds ProTipsCard) and opens its
// modal on click. Targets /sign-in because that route renders CleanAuthCard
// directly, without the "/" first-launch splash + language-modal gates.
import { test, expect, seedLocalStorage } from "./helpers";

test.describe("Pro-Tips", () => {
  test.beforeEach(async ({ page }) => {
    await seedLocalStorage(page);
  });

  test("pro-tip card visible and modal opens on click", async ({ page, errors }) => {
    await page.goto("/sign-in");
    const card = page.getByText(/boss pro-tip/i);
    await expect(card.first()).toBeVisible({ timeout: 10000 });
    await card.first().click();
    // Modal opens with the tip content.
    await expect(
      page.getByRole("dialog").or(page.getByText(/pro.?tip/i)).first(),
    ).toBeVisible({ timeout: 4000 });
    // Assert no JS errors on modal open.
    errors.assertClean();
  });
});
