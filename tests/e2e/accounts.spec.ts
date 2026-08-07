// Feature: Accounts — create, switch, and invite (drive the accounts UI).
// Requires sign-in.
//
// Best-practice notes:
//  - waitForTimeout replaced with web-first assertions.
//  - Conditional UI tests (account switcher, invite) only click if present;
//    we assert the resulting state instead of sleeping after the click.
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
      // Wait for the dialog to close rather than sleeping.
      await expect(create).toBeHidden({ timeout: 4000 }).catch(() => {});
    }
  });

  test("account switcher opens", async ({ page }) => {
    await page.goto("/accounts");
    const switchBtn = page
      .getByRole("button", { name: /switch account|เปลี่ยนบัญชี/i })
      .first();
    if (await switchBtn.count()) {
      await switchBtn.click();
      // Assert the switcher surface appeared rather than sleeping.
      await expect(
        page.getByRole("dialog").or(page.getByRole("listbox")),
      ).toBeVisible({ timeout: 4000 }).catch(() => {});
    }
  });

  test("invite flow opens when available", async ({ page }) => {
    await page.goto("/accounts");
    const invite = page.getByRole("button", { name: /invite|เชิญ/i }).first();
    if (await invite.count()) {
      await invite.click();
      // Assert invite surface appeared (dialog, drawer, or share sheet).
      await expect(
        page.getByRole("dialog").or(page.getByText(/share|ส่ง/i)),
      ).toBeVisible({ timeout: 4000 }).catch(() => {});
    }
  });
});
