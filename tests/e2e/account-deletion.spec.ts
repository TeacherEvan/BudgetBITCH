// Feature: Account deletion (owner).
//
// Drives the Accounts screen: owners get a destructive "Delete" action behind a
// confirmation modal; members and Personal do not. Deleting the active account
// must fall back to Personal. Requires real sign-in (skips without creds).
//
// Best-practice notes:
//  - Repeated account-creation steps extracted into createAccount() helper.
//  - All waitForTimeout calls replaced with web-first assertions.
//  - Locators use semantic roles; the brittle .rounded-2xl class selector is
//    kept as a scoping mechanism but is intentionally narrow.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return the card element for a named account. */
function accountCard(page: import("@playwright/test").Page, name: string) {
  return page.locator(".rounded-2xl", { hasText: name });
}

/**
 * Create a fresh Family account with the given name and wait for its card to
 * appear. Reusable across deletion tests that each need an isolated account.
 */
async function createAccount(
  page: import("@playwright/test").Page,
  name: string,
) {
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
  await expect(accountCard(page, name)).toBeVisible({ timeout: 8000 });
}

/** Open the delete dialog for an account card. */
async function openDeleteDialog(
  page: import("@playwright/test").Page,
  name: string,
) {
  await accountCard(page, name)
    .getByRole("button", { name: /delete|ลบ/i })
    .first()
    .click();
  // Scope to the delete-confirmation dialog by its accessible name so other
  // dialogs (push gate, install prompt) can never cause a strict-mode clash.
  const dialog = page.getByRole("dialog", { name: /delete account|ลบบัญชี/i });
  await expect(dialog).toBeVisible({ timeout: 4000 });
  return dialog;
}

// ─── Tests ───────────────────────────────────────────────────────────────────
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
      accountCard(page, "Personal").getByRole("button", { name: /delete|ลบ/i }),
    ).toHaveCount(0);
  });

  test("owner Delete button opens a confirmation modal", async ({ page }) => {
    const name = `Delete Me ${Date.now()}`;
    await createAccount(page, name);
    const dialog = await openDeleteDialog(page, name);
    await expect(dialog.getByText(/permanently deletes|ลบ.*ถาวร/i)).toBeVisible();
  });

  test("cancelling the confirm modal keeps the account", async ({ page }) => {
    const name = `Keep Me ${Date.now()}`;
    await createAccount(page, name);
    const dialog = await openDeleteDialog(page, name);
    await dialog.getByRole("button", { name: /cancel|ยกเลิก/i }).click();
    await expect(dialog).toHaveCount(0, { timeout: 4000 });
    // Account still present.
    await expect(accountCard(page, name)).toHaveCount(1);
  });

  test("confirming deletion removes the account from the list", async ({
    page,
  }) => {
    const name = `Gone ${Date.now()}`;
    await createAccount(page, name);
    const dialog = await openDeleteDialog(page, name);
    await dialog.getByRole("button", { name: /delete|ลบ/i }).first().click();
    await expect(accountCard(page, name)).toHaveCount(0, { timeout: 8000 });
  });

  test("no console or page errors during the delete flow", async ({
    page,
    errors,
  }) => {
    const name = `Clean ${Date.now()}`;
    await createAccount(page, name);
    const dialog = await openDeleteDialog(page, name);
    await dialog.getByRole("button", { name: /delete|ลบ/i }).first().click();
    await expect(accountCard(page, name)).toHaveCount(0, { timeout: 8000 });
    errors.assertClean();
  });
});
