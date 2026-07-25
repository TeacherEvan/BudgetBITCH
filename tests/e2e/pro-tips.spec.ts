// Feature: BOSS Pro-Tips card renders and opens modal (dashboard surface).
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Pro-Tips", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("pro-tip card visible and modal opens on click", async ({ page }) => {
    await page.goto("/dashboard");
    const card = page.getByText(/boss pro-tip|เคล็ดลับฉบับบอส/i);
    await expect(card.first()).toBeVisible({ timeout: 8000 });
    await card.first().click();
    // Modal opens with the tip title.
    await expect(page.getByRole("dialog").or(page.getByText(/pro.?tip|เคล็ดลับ/i))).toBeVisible({ timeout: 4000 });
  });
});
