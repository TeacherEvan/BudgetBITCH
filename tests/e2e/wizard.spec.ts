// Feature: Onboarding Wizard (3 steps: income → location consent → receipt scan).
//
// Requires a real sign-in (client-only auth on this branch).
//
// Best-practice notes:
//  - Matches the CURRENT 3-step wizard in src/components/wizard/wizard-shell.tsx
//    (the previous 10-step spec was testing a wizard that no longer exists).
//  - All waits are web-first assertions; no waitForTimeout.
//  - Location step is completed via "Skip for now" so no geolocation prompt is
//    needed; the grant path is covered separately with a mocked geolocation.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function gotoWizard(page: import("@playwright/test").Page) {
  await page.goto("/wizard");
  await expect(
    page.getByRole("heading", { name: /setup your budget|ตั้งค่ากระเป๋าเงิน/i }),
  ).toBeVisible({ timeout: 10000 });
}

/** Step 1: fill monthly income and advance. */
async function completeIncomeStep(page: import("@playwright/test").Page, value = "35000") {
  const input = page.locator('input[type="number"]').first();
  await expect(input).toBeVisible();
  await input.fill(value);
  await page.getByRole("button", { name: /^(next|ถัดไป)$/i }).click();
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe("Wizard — 3-step onboarding", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("completes all 3 steps (skip location, skip receipt) and finishes", async ({ page }) => {
    await gotoWizard(page);

    // Step 1/3 — income.
    await expect(page.getByText(/step/i).first()).toBeVisible();
    await completeIncomeStep(page, "75000");

    // Step 2/3 — location consent; skip.
    await expect(
      page.getByRole("heading", { name: /location permission|ตำแหน่งที่ตั้ง/i }),
    ).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /skip for now|ข้ามขั้นตอนนี้/i }).click();
    await page.getByRole("button", { name: /^(next|ถัดไป)$/i }).click();

    // Step 3/3 — receipt scan; Finish without scanning.
    await expect(
      page.getByRole("button", { name: /^(finish|เสร็จสิ้น)$/i }),
    ).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /^(finish|เสร็จสิ้น)$/i }).click();

    // Wizard completes → dashboard (route or modal close).
    await expect(page).toHaveURL(/\/(dashboard|wizard)/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /setup your budget|ตั้งค่ากระเป๋าเงิน/i }),
    ).toHaveCount(0, { timeout: 15000 });
  });

  test("income quick-pick buttons prefill the slider value", async ({ page }) => {
    await gotoWizard(page);
    await page.getByRole("button", { name: /80,000/i }).click();
    const input = page.locator('input[type="number"]').first();
    await expect(input).toHaveValue("80000");
  });

  test("blocks advancing past income when empty and shows error", async ({ page }) => {
    await gotoWizard(page);
    const input = page.locator('input[type="number"]').first();
    await input.fill("");
    await page.getByRole("button", { name: /^(next|ถัดไป)$/i }).click();
    await expect(page.getByRole("alert")).toContainText(/please fill|กรุณา/i);
  });

  test("back button returns from location step to income step", async ({ page }) => {
    await gotoWizard(page);
    await completeIncomeStep(page, "50000");
    await expect(
      page.getByRole("heading", { name: /location permission|ตำแหน่งที่ตั้ง/i }),
    ).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: /^(back|ย้อนกลับ)$/i }).click();
    // Back on step 1: income heading visible, no Back button on first step.
    await expect(
      page.getByRole("heading", { name: /monthly income|รายได้ต่อเดือน/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^(back|ย้อนกลับ)$/i }),
    ).toHaveCount(0);
  });

  test("location grant path stores consent (mocked geolocation)", async ({ page }) => {
    await page.context().grantPermissions(["geolocation"], {
      origin: "http://127.0.0.1:3100",
    });
    await page.context().setGeolocation({ latitude: 13.7563, longitude: 100.5018 });

    await gotoWizard(page);
    await completeIncomeStep(page);

    await expect(
      page.getByRole("heading", { name: /location permission|ตำแหน่งที่ตั้ง/i }),
    ).toBeVisible({ timeout: 8000 });

    // Must acknowledge the privacy disclaimer before granting.
    await page
      .getByText(/i have read and understand|ฉันอ่านและเข้าใจ/i)
      .click();
    await page.getByRole("button", { name: /allow location|อนุญาตตำแหน่ง/i }).click();

    // Granted state appears.
    await expect(
      page.getByText(/location allowed|อนุญาตแล้ว/i).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("renders Thai labels when locale=th", async ({ page }) => {
    await seedLocalStorage(page, "th");
    await page.goto("/wizard");
    await expect(
      page.getByRole("button", { name: /^(ถัดไป|เสร็จสิ้น)$/i }),
    ).toBeVisible({ timeout: 8000 });
  });
});
