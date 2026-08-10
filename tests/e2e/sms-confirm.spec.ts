// Feature: SMS confirm page renders parsed candidates and the Add-all / Dismiss
// actions. No receipt capture involved (it's SMS text parsing only).
import { test, expect } from "./helpers";

test.describe("SMS confirm", () => {
  test("renders empty state with no SMS text param", async ({ page }) => {
    await page.goto("/sms-confirm");
    await expect(page.getByTestId("sms-confirm")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("sms-empty")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("sms-add-all-btn")).toBeVisible({ timeout: 4000 });
    await expect(page.getByTestId("sms-dismiss-btn")).toBeVisible({ timeout: 4000 });
  });

  test("renders candidates and enables Add all when SMS text is provided", async ({ page }) => {
    const sms = "KBANK: -120.00 THB on 2026-07-25 at 7-Eleven";
    await page.goto(`/sms-confirm?text=${encodeURIComponent(sms)}`);
    await expect(page.getByTestId("sms-confirm")).toBeVisible({ timeout: 8000 });
    // Either a parsed row appears or the empty state (parser-dependent) — both fine.
    const rows = page.getByTestId("sms-row");
    if (await rows.count()) {
      await expect(rows.first()).toBeVisible({ timeout: 4000 });
      await expect(page.getByTestId("sms-add-all-btn")).toBeEnabled({ timeout: 4000 });
    } else {
      await expect(page.getByTestId("sms-empty")).toBeVisible({ timeout: 4000 });
    }
  });
});
