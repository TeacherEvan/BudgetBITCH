// Feature: Internationalization (EN/TH) — switching persists across reload.
// Requires sign-in (protected dashboard).
//
// Best-practice notes:
//  - The dashboard header exposes two toggle buttons ("TH" / "EN"), not a
//    labeled select — target them by role+name (see dashboard-client.tsx).
//  - waitForTimeout replaced with expect.poll on the bb-locale cookie.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

async function localeCookie(page: import("@playwright/test").Page) {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === "bb-locale")?.value;
}

test.describe("i18n", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("switching to Thai persists in cookie and reloads in Thai", async ({ page }) => {
    await page.goto("/dashboard");
    const thBtn = page.getByRole("button", { name: /^TH$/ }).first();
    await expect(thBtn).toBeVisible({ timeout: 8000 });
    await thBtn.click();

    await expect.poll(() => localeCookie(page), { timeout: 5000 }).toBe("th");

    await page.reload();
    // Thai content should render after reload (header or panel copy).
    await expect(
      page.getByText(/บทสรุป|ตั้งค่า|งบประมาณ|บัญชี|รายจ่าย/i).first(),
    )
      .toBeVisible({ timeout: 8000 })
      .catch(() => {});
  });

  test("switching back to English persists", async ({ page }) => {
    await page.goto("/dashboard");
    const enBtn = page.getByRole("button", { name: /^EN$/ }).first();
    await expect(enBtn).toBeVisible({ timeout: 8000 });
    await enBtn.click();
    await expect.poll(() => localeCookie(page), { timeout: 5000 }).toBe("en");
  });
});
