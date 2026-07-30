// Feature: Onboarding Wizard (10 steps) — full walkthrough + edge cases.
//
// Requires a real sign-in (client-only auth on this branch).
//
// Best-practice notes:
//  - fillNumericStep extracted to module scope so all describe blocks share it.
//  - All waitForTimeout calls removed; waits are web-first assertions.
//  - NUMERIC_ANSWERS typed as const for better DX.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// ─── Test data ───────────────────────────────────────────────────────────────
const NUMERIC_ANSWERS = {
  income: "75000",
  rent: "18000",
  transport: "4000",
  phoneInternet: "900",
  subscriptions: "1500",
  entertainment: "6000",
  healthcare: "2000",
  savingsRatePct: "20",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fill the current numeric-input step and advance with the Next button. */
async function fillNumericStep(page: import("@playwright/test").Page, value: string) {
  const input = page.locator('input[type="number"]').first();
  await expect(input).toBeVisible();
  await input.fill(value);
  await page.getByRole("button", { name: /^(next|ถัดไป)$/i }).click();
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe("Wizard", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("completes all 10 steps and lands on dashboard", async ({ page }) => {
    // Ensure we start at the wizard (sign-in may land on dashboard if already
    // completed; force wizard via direct navigation).
    await page.goto("/wizard");
    await expect(
      page.getByRole("heading", { name: /setup your budget/i }),
    ).toBeVisible({ timeout: 10000 });

    // Steps 1–7: numeric inputs (income → healthcare).
    for (const key of [
      "income",
      "rent",
      "transport",
      "phoneInternet",
      "subscriptions",
      "entertainment",
      "healthcare",
    ] as const) {
      await fillNumericStep(page, NUMERIC_ANSWERS[key]);
    }

    // Step 8: savings rate.
    await fillNumericStep(page, NUMERIC_ANSWERS.savingsRatePct);

    // Step 9: risk tolerance.
    await expect(page.getByText(/risk|เสี่ยง/i)).toBeVisible();
    await page.getByRole("button", { name: /medium|กลาง/i }).click();
    await page.getByRole("button", { name: /^(next|ถัดไป)$/i }).click();

    // Step 10: location permission.
    await expect(page.getByText(/location|ตำแหน่ง/i)).toBeVisible();
    await page.getByRole("button", { name: /allow|อนุญาต|yes/i }).first().click();
    await page.getByRole("button", { name: /^(finish|เสร็จสิ้น)$/i }).click();

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
  });

  test("blocks advancing on empty step and shows error", async ({ page }) => {
    await page.goto("/wizard");
    await expect(
      page.getByRole("heading", { name: /setup your budget/i }),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /^(next|ถัดไป)$/i }).click();
    await expect(page.getByRole("alert")).toContainText(/please fill|กรุณา/i);
  });

  test("back button returns to previous step", async ({ page }) => {
    await page.goto("/wizard");
    await expect(
      page.getByRole("heading", { name: /setup your budget/i }),
    ).toBeVisible({ timeout: 10000 });
    await fillNumericStep(page, "50000");
    await page.getByRole("button", { name: /^(back|ย้อนกลับ)$/i }).click();
    // Step 1 has no Back button.
    await expect(
      page.getByRole("button", { name: /^(back|ย้อนกลับ)$/i }),
    ).toHaveCount(0);
  });

  test("renders Thai labels when locale=th", async ({ page }) => {
    await seedLocalStorage(page, "th");
    await page.goto("/wizard");
    await expect(
      page.getByRole("button", { name: /^(ถัดไป|เสร็จสิ้น)$/i }),
    ).toBeVisible({ timeout: 8000 });
  });
});
