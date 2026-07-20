// Feature: Account deletion (owner).
// Drives the Accounts screen: owners get a destructive "Delete" action behind a
// confirmation modal; members and Personal do not. Deleting the active account
// must fall back to Personal. Requires real sign-in (skips without creds).
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// Locate a single account card by its exact name (cards use `.rounded-2xl`).
function card(page: import("@playwright/test").Page, name: string) {
  return page.locator(".rounded-2xl", { hasText: name });
}

test.describe("Account deletion — owner", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
    await page.goto("/accounts");
    await expect(
      page.getByRole("heading", { name: /accounts|บัญชี/i }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("Personal account has no Delete action", async ({ page }) => {
    await expect(
      card(page, "Personal").getByRole("button", { name: /delete|ลบ/i }),
    ).toHaveCount(0);
  });

  test("owner Delete button opens a confirmation modal", async ({ page }) => {
    const name = `Delete Me ${Date.now()}`;
    // Create a fresh owned account to target.
    await page
      .getByRole("button", { name: /new account|บัญชีใหม่/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /family|ครอบครัว/i })
      .first()
      .click();
    await page.getByPlaceholder(/account name|ชื่อบัญชี/i).fill(name);
    await page
      .getByRole("button", { name: /create|สร้าง/i })
      .first()
      .click();
    await expect(card(page, name)).toBeVisible({ timeout: 8000 });

    // Open the confirm modal.
    await card(page, name)
      .getByRole("button", { name: /delete|ลบ/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });
    await expect(
      dialog.getByText(/permanently deletes|ลบ.*ถาวร/i),
    ).toBeVisible();
  });

  test("cancelling the confirm modal keeps the account", async ({ page }) => {
    const name = `Keep Me ${Date.now()}`;
    await page
      .getByRole("button", { name: /new account|บัญชีใหม่/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /family|ครอบครัว/i })
      .first()
      .click();
    await page.getByPlaceholder(/account name|ชื่อบัญชี/i).fill(name);
    await page
      .getByRole("button", { name: /create|สร้าง/i })
      .first()
      .click();
    await expect(card(page, name)).toBeVisible({ timeout: 8000 });

    await card(page, name)
      .getByRole("button", { name: /delete|ลบ/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });
    await dialog
      .getByRole("button", { name: /cancel|ยกเลิก/i })
      .click();
    await expect(dialog).toHaveCount(0, { timeout: 4000 });
    // Account still present.
    await expect(card(page, name)).toHaveCount(1);
  });

  test("confirming deletion removes the account from the list", async ({
    page,
  }) => {
    const name = `Gone ${Date.now()}`;
    await page
      .getByRole("button", { name: /new account|บัญชีใหม่/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /family|ครอบครัว/i })
      .first()
      .click();
    await page.getByPlaceholder(/account name|ชื่อบัญชี/i).fill(name);
    await page
      .getByRole("button", { name: /create|สร้าง/i })
      .first()
      .click();
    await expect(card(page, name)).toBeVisible({ timeout: 8000 });

    await card(page, name)
      .getByRole("button", { name: /delete|ลบ/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });
    await dialog
      .getByRole("button", { name: /delete|ลบ/i })
      .first()
      .click();

    // Account card disappears from the list.
    await expect(card(page, name)).toHaveCount(0, { timeout: 8000 });
  });

  test("no console or page errors during the delete flow", async ({
    page,
    errors,
  }) => {
    const name = `Clean ${Date.now()}`;
    await page
      .getByRole("button", { name: /new account|บัญชีใหม่/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /family|ครอบครัว/i })
      .first()
      .click();
    await page.getByPlaceholder(/account name|ชื่อบัญชี/i).fill(name);
    await page
      .getByRole("button", { name: /create|สร้าง/i })
      .first()
      .click();
    await expect(card(page, name)).toBeVisible({ timeout: 8000 });

    await card(page, name)
      .getByRole("button", { name: /delete|ลบ/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 4000 });
    await dialog
      .getByRole("button", { name: /delete|ลบ/i })
      .first()
      .click();
    await expect(card(page, name)).toHaveCount(0, { timeout: 8000 });
    errors.assertClean();
  });
});
