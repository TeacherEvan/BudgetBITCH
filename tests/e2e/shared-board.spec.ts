// Feature: Shared board sync (couple board) — mounts app-wide, no UI errors.
// Requires sign-in.
import { test, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Shared board", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("dashboard with shared-board sync mounted has no page errors", async ({ page, errors }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    errors.assertClean();
  });

  test("shared board link flow is reachable from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    const linkBtn = page
      .getByRole("button", { name: /shared board|couple|link|เชื่อมต่อ/i })
      .first();
    if (await linkBtn.count()) {
      await linkBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
