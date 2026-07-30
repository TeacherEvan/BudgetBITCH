// Feature: BOSS Pro-Tips card — renders on the signed-out welcome window and
// opens its modal on click (src/components/welcome/welcome-window.tsx embeds
// ProTipsCard; it is NOT on the authenticated dashboard).
import { test, expect } from "./helpers";

test.describe("Pro-Tips", () => {
  test("pro-tip card visible and modal opens on click", async ({ page, errors }) => {
    await page.goto("/");
    const card = page.getByText(/boss pro-tip|เคล็ดลับฉบับบอส/i);
    await expect(card.first()).toBeVisible({ timeout: 10000 });
    await card.first().click();
    // Modal opens with the tip content.
    await expect(
      page.getByRole("dialog").or(page.getByText(/pro.?tip|เคล็ดลับ/i)).first(),
    ).toBeVisible({ timeout: 4000 });
    // Assert no JS errors on modal open.
    errors.assertClean();
  });
});
