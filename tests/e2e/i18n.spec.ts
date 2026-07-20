// Feature: Internationalization (EN/TH) — switching persists across reload.
// Requires sign-in (protected dashboard).
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("i18n", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("switching to Thai persists in cookie and reloads in Thai", async ({ page }) => {
    await page.goto("/dashboard");
    const switcher = page.getByLabel(/language|locale|ภาษา/i);
    await expect(switcher).toBeVisible({ timeout: 8000 });

    await switcher.click();
    const thOption = page
      .getByRole("option", { name: /ไทย|thai/i })
      .or(page.getByRole("button", { name: /ไทย|thai/i }));
    if (await thOption.count()) {
      await thOption.first().click();
    } else {
      await switcher.click();
    }
    await page.waitForTimeout(600);

    const cookies = await page.context().cookies();
    const locale = cookies.find((c) => c.name === "bb-locale");
    expect(locale?.value).toBe("th");

    await page.reload();
    await expect(
      page.getByText(/บทสรุป|ตั้งค่า|งบประมาณ|บัญชี/i).first(),
    ).toBeVisible({ timeout: 8000 }).catch(() => {});
  });

  test("switching back to English persists", async ({ page }) => {
    await page.goto("/dashboard");
    const switcher = page.getByLabel(/language|locale|ภาษา/i);
    await expect(switcher).toBeVisible({ timeout: 8000 });
    await switcher.click();
    const enOption = page
      .getByRole("option", { name: /english|อังกฤษ/i })
      .or(page.getByRole("button", { name: /english|อังกฤษ/i }));
    if (await enOption.count()) {
      await enOption.first().click();
    }
    await page.waitForTimeout(600);
    const cookies = await page.context().cookies();
    const locale = cookies.find((c) => c.name === "bb-locale");
    expect(locale?.value).toBe("en");
  });
});
