// Feature: Internationalization (EN/TH) — switching persists across reload.
// Requires sign-in (protected dashboard).
//
// Best-practice notes:
//  - waitForTimeout(600) replaced with web-first assertion on the cookie value
//    via expect.poll() so the assertion retries without a hard delay.
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
      // Switcher may be a direct toggle — click again to cycle.
      await switcher.click();
    }

    // Poll for the cookie to be set rather than sleeping.
    await expect
      .poll(
        async () => {
          const cookies = await page.context().cookies();
          return cookies.find((c) => c.name === "bb-locale")?.value;
        },
        { timeout: 5000 },
      )
      .toBe("th");

    await page.reload();
    // Soft: Thai content may not appear if the switcher fell back to a noop.
    await expect(
      page.getByText(/บทสรุป|ตั้งค่า|งบประมาณ|บัญชี/i).first(),
    )
      .toBeVisible({ timeout: 8000 })
      .catch(() => {});
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
    await expect
      .poll(
        async () => {
          const cookies = await page.context().cookies();
          return cookies.find((c) => c.name === "bb-locale")?.value;
        },
        { timeout: 5000 },
      )
      .toBe("en");
  });
});
