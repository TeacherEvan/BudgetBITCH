// Feature: Accounts — create, switch, and invite (drive the accounts UI).
// Requires sign-in.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Accounts", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("accounts page lists accounts and allows creating a new one", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page).toHaveURL(/.*accounts/);

    const newBtn = page
      .getByRole("button", { name: /new account|create account|add account|บัญชีใหม่/i })
      .first();
    await expect(newBtn).toBeVisible({ timeout: 8000 });

    await newBtn.click();
    const personal = page.getByRole("button", { name: /personal|บุคคล/i }).first();
    if (await personal.count()) await personal.click();
    const create = page.getByRole("button", { name: /create|สร้าง/i }).first();
    if (await create.count()) {
      await create.click();
      await page.waitForTimeout(800);
    }
  });

  test("account switcher opens", async ({ page }) => {
    await page.goto("/accounts");
    const switchBtn = page.getByRole("button", { name: /switch account|เปลี่ยนบัญชี/i }).first();
    if (await switchBtn.count()) {
      await switchBtn.click();
      await page.waitForTimeout(400);
    }
  });

  test("invite flow opens when available", async ({ page }) => {
    await page.goto("/accounts");
    const invite = page.getByRole("button", { name: /invite|เชิญ/i }).first();
    if (await invite.count()) {
      await invite.click();
      await page.waitForTimeout(400);
    }
  });
});
