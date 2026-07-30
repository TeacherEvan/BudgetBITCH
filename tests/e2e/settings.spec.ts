// Feature: Settings page — locale label, theme toggle, accent, currency override.
//
// Best-practice notes:
//  - waitForTimeout(400/300) replaced with web-first assertions.
//  - Theme toggle asserts on a semantic state change (class diff) which is
//    already deterministic — no timing guard needed.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders settings shell with locale + theme controls", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /settings|ตั้งค่า/i }),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/language|ภาษา/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/theme|ธีมสี/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("theme toggle changes documentElement class", async ({ page }) => {
    await page.goto("/settings");
    // Pick a theme that is NOT currently active (default is Amber) so the
    // documentElement class provably changes.
    const goldTheme = page.getByRole("radio", { name: /^gold$/i });
    await expect(goldTheme).toBeVisible({ timeout: 8000 });
    const before = await page.evaluate(() => document.documentElement.className);
    await goldTheme.click();
    // Assert the class actually changed — no arbitrary wait needed.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.className))
      .not.toBe(before);
  });

  test("currency override button is selectable", async ({ page }) => {
    await page.goto("/settings");
    const thb = page.getByRole("button", { name: /Thai Baht|บาทไทย/i });
    await expect(thb).toBeVisible({ timeout: 8000 });
    await thb.click();
    // Assert selection state — border class is the existing product signal.
    await expect(thb).toHaveClass(/border-\[#C9960C\]/);
  });

  test("Export Data (JSON) triggers a .json download", async ({ page }) => {
    await page.goto("/settings");
    const exportBtn = page.getByRole("button", { name: /export data \(json\)/i }).last();
    await expect(exportBtn).toBeVisible({ timeout: 8000 });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/i);
  });

  test("Export CSV triggers a .csv download", async ({ page }) => {
    await page.goto("/settings");
    const exportBtn = page.getByRole("button", { name: /^export csv$/i });
    await expect(exportBtn).toBeVisible({ timeout: 8000 });
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

  test("Report Bug button composes a mailto without leaving the page", async ({ page }) => {
    await page.goto("/settings");
    const reportBtn = page.getByRole("button", {
      name: /report bug|แจ้งปัญหา/i,
    });
    await expect(reportBtn).toBeVisible({ timeout: 8000 });
    await reportBtn.click();
    // Headless Chromium ignores mailto: navigation; the page must survive.
    await expect(
      page.getByRole("heading", { name: /settings|ตั้งค่า/i }),
    ).toBeVisible();
  });

  test("Sync Now button runs without crashing", async ({ page }) => {
    await page.goto("/settings");
    const syncBtn = page.getByRole("button", { name: /^sync now$|ซิงค์ตอนนี้/i });
    await expect(syncBtn).toBeVisible({ timeout: 8000 });
    await syncBtn.click();
    // Status line updates (synced / syncing / error) — never a crash.
    await expect(
      page.getByRole("heading", { name: /settings|ตั้งค่า/i }),
    ).toBeVisible();
  });

  test("Change password form is reachable from Privacy section", async ({ page }) => {
    await page.goto("/settings");
    const changeBtn = page.getByRole("button", {
      name: /change password|เปลี่ยนรหัสผ่าน/i,
    });
    await expect(changeBtn).toBeVisible({ timeout: 8000 });
    await changeBtn.click();
    // Password form (current/new fields) or reset info appears.
    await expect(
      page.locator('input[type="password"]').first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("section anchor nav scrolls to Data section", async ({ page }) => {
    await page.goto("/settings");
    await page.getByRole("link", { name: /^data$/i }).click();
    await expect(
      page.getByRole("heading", { name: /storage integrity/i }),
    ).toBeInViewport({ timeout: 8000 });
  });
});
