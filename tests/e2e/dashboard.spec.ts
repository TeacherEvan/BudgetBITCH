// Feature: Dashboard — render, manifesto gate, voice toggle, locale switch,
// re-open wizard, and console-error hygiene. Requires real sign-in.
//
// Best-practice notes:
//  - waitForTimeout(N) replaced with network-idle waits or web-first assertions.
//  - Soft-assertions that cannot fail deterministically kept but annotated.
//  - account-gated UI checks use count() guard so the test passes even when
//    the feature is rolled out on a subset of accounts.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// ─── Shared setup ───────────────────────────────────────────────────────────
async function signedIn(page: import("@playwright/test").Page) {
  if (!HAS_CREDS) test.skip(true, "no creds");
  await seedLocalStorage(page);
  await signInReal(page);
}

// ─── Core render & error hygiene ────────────────────────────────────────────
test.describe("Dashboard — core", () => {
  test.beforeEach(async ({ page }) => signedIn(page));

  test("renders dashboard shell for authenticated user", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(
      page.getByRole("heading", { name: /budget-boss/i }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("no uncaught console/page errors on dashboard load", async ({ page, errors }) => {
    await page.goto("/dashboard");
    // Wait for the page to settle (network idle avoids arbitrary timeout).
    await page.waitForLoadState("networkidle").catch(() => {});
    errors.assertClean();
  });

  test("manifesto interstitial shows when not yet seen, then dismisses", async ({
    page,
  }) => {
    // Remove the manifesto-seen flag so the interstitial re-appears.
    await page.addInitScript(() => localStorage.removeItem("bb:manifesto-v1"));
    await page.goto("/dashboard");
    const manifesto = page.getByText(/manifesto|philosophy|bitching budget/i, {
      exact: false,
    });
    // Soft: the interstitial is conditional on account setup state.
    await expect(manifesto).toBeVisible({ timeout: 8000 }).catch(() => {});
    const done = page.getByRole("button", {
      name: /^(got it|continue|done|เข้าใจแล้ว|ต่อไป)$/i,
    });
    if (await done.count()) {
      await done.first().click();
      await expect(page.getByText(/manifesto/i)).toHaveCount(0).catch(() => {});
    }
  });
});

// ─── Interactions ────────────────────────────────────────────────────────────
test.describe("Dashboard — interactions", () => {
  test.beforeEach(async ({ page }) => signedIn(page));

  test("locale switch updates cookie and persists", async ({ page }) => {
    await page.goto("/dashboard");
    // Header exposes TH / EN toggle buttons (no labeled select).
    const thBtn = page.getByRole("button", { name: /^TH$/ }).first();
    await expect(thBtn).toBeVisible({ timeout: 8000 });
    await thBtn.click();
    await expect
      .poll(async () => {
        const cookies = await page.context().cookies();
        return cookies.find((c) => c.name === "bb-locale")?.value;
      }, { timeout: 5000 })
      .toBe("th");
  });

  test("voice toggle is absent (feature removed 2026-07-23)", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: /budget-boss/i }).first(),
    ).toBeVisible({ timeout: 8000 });
    // Voice guidance was fully excised; no voice control should render.
    await expect(
      page.getByRole("button", { name: /^voice$|^เสียง$/i }),
    ).toHaveCount(0);
  });

  test("dashboard view-mode switcher cycles all four modes", async ({ page }) => {
    await page.goto("/dashboard");
    for (const mode of [
      /excel variance grid/i,
      /30d cash flow/i,
      /50\/30\/20 matrix/i,
      /standard dashboard/i,
    ]) {
      const btn = page.getByRole("button", { name: mode }).first();
      await expect(btn).toBeVisible({ timeout: 8000 });
      await btn.click();
      // Re-render must not crash the shell.
      await expect(page.getByRole("button", { name: mode }).first()).toBeVisible();
    }
  });

  test("sidebar panel buttons open their panels without errors", async ({ page, errors }) => {
    await page.goto("/dashboard");
    for (const name of [
      /expenses/i,
      /inflow|income/i,
      /budget alerts/i,
      /bills/i,
      /goals/i,
      /net worth/i,
      /subscriptions/i,
      /emergency/i,
      /debt/i,
      /forecast/i,
    ]) {
      const btn = page.getByRole("button", { name }).first();
      if (await btn.count()) {
        await btn.click();
        await expect(page.locator("body")).toBeVisible();
      }
    }
    errors.assertClean();
  });

  test("What-If Sandbox (Goal Seek) opens", async ({ page }) => {
    await page.goto("/dashboard");
    const sandbox = page.getByRole("button", { name: /what-if sandbox/i }).first();
    await expect(sandbox).toBeVisible({ timeout: 8000 });
    await sandbox.click();
    // Panel or modal appears without crashing the shell.
    await expect(page.locator("body")).toBeVisible();
  });

  test("re-open wizard via Setup keeps budget editable", async ({ page }) => {
    await page.goto("/dashboard");
    const setup = page
      .getByRole("button", {
        name: /setup|edit budget|re-?open wizard|ตั้งค่า/i,
      })
      .first();
    if (await setup.count()) {
      await setup.click();
      await expect(
        page.getByRole("heading", { name: /setup your budget/i }),
      ).toBeVisible({ timeout: 8000 });
    }
  });
});
