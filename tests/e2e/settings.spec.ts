// Feature: Settings page — locale label, theme toggle, accent, currency override.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders settings shell with locale + theme controls", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings|ตั้งค่า/i })).toBeVisible({ timeout: 8000 });
    // Language label present.
    await expect(page.getByText(/language|ภาษา/i).first()).toBeVisible({ timeout: 8000 });
    // Theme toggle present.
    await expect(page.getByText(/theme|ธีมสี/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("theme toggle changes documentElement class", async ({ page }) => {
    await page.goto("/settings");
    const themeBtn = page.getByRole("button", { name: /theme|dark|light|gold|amber/i }).first();
    await expect(themeBtn).toBeVisible({ timeout: 8000 });
    const before = await page.evaluate(() => document.documentElement.className);
    await themeBtn.click();
    await expect.poll(async () => page.evaluate(() => document.documentElement.className)).not.toEqual(before);
  });

  test("currency override button is selectable", async ({ page }) => {
    await page.goto("/settings");
    const thb = page.getByRole("button", { name: /Thai Baht|บาทไทย/i });
    await expect(thb).toBeVisible({ timeout: 8000 });
    await thb.click();
    await expect(thb).toHaveClass(/border-\[#C9960C\]/);
  });
});
