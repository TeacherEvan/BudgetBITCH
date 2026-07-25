// Feature: Quick Add — MANUAL amount+note entry only.
// EXCLUDED: receipt camera capture and parseReceipt (per directive). We never
// click the scan button, upload a file, or call the receipts action.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Quick Add — manual entry", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders manual input and Save (no receipt scan path)", async ({ page }) => {
    await page.goto("/quick-add");
    await expect(page.getByPlaceholder(/amount then note|จำนวนเงิน/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /save|บันทึก/i })).toBeVisible({ timeout: 8000 });
    // Scan button exists but we deliberately do NOT interact with it.
    await expect(page.getByRole("button", { name: /scan receipt|สแกนใบเสร็จ/i })).toBeVisible({ timeout: 4000 });
  });

  test("saves a manual expense and shows success toast", async ({ page }) => {
    await page.goto("/quick-add");
    const input = page.getByPlaceholder(/amount then note|จำนวนเงิน/i);
    await input.fill("120 lunch");
    await page.getByRole("button", { name: /save|บันทึก/i }).click();
    await expect(page.getByText(/recorded successfully|บันทึกค่าใช้จ่ายสำเร็จ/i)).toBeVisible({ timeout: 6000 });
  });

  test("shows validation error on empty submit", async ({ page }) => {
    await page.goto("/quick-add");
    await page.getByRole("button", { name: /save|บันทึก/i }).click();
    await expect(page.getByText(/valid amount|จำนวนเงินที่ถูกต้อง/i)).toBeVisible({ timeout: 4000 });
  });
});
