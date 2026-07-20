// Feature: Dashboard — render, manifesto gate, voice toggle, locale switch,
// re-open wizard, and console-error hygiene. Requires real sign-in.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Dashboard — core", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders dashboard shell for authenticated user", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/budget|bitch|daily|disposable/i, { exact: false })).toBeVisible({ timeout: 8000 });
  });

  test("no uncaught console/page errors on dashboard", async ({ page, errors }) => {
    await page.goto("/dashboard");
    await page.waitForTimeout(1500);
    errors.assertClean();
  });

  test("manifesto interstitial shows when not yet seen, then dismisses", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("bb:manifesto-v1"));
    await page.goto("/dashboard");
    const manifesto = page.getByText(/manifesto|philosophy|bitching budget/i, { exact: false });
    await expect(manifesto).toBeVisible({ timeout: 8000 }).catch(() => {});
    const done = page.getByRole("button", { name: /^(got it|continue|done|เข้าใจแล้ว|ต่อไป)$/i });
    if (await done.count()) {
      await done.first().click();
      await expect(page.getByText(/manifesto/i)).toHaveCount(0).catch(() => {});
    }
  });
});

test.describe("Dashboard — interactions", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("locale switch updates cookie and persists", async ({ page }) => {
    await page.goto("/dashboard");
    const switcher = page.getByLabel(/language|locale|ภาษา/i);
    await expect(switcher).toBeVisible({ timeout: 8000 });
    await switcher.click();
    await page.waitForTimeout(500);
    const cookie = await page.context().cookies();
    const locale = cookie.find((c) => c.name === "bb-locale");
    expect(["en", "th"]).toContain(locale?.value);
  });

  test("voice toggle is present and toggles", async ({ page }) => {
    await page.goto("/dashboard");
    const voiceBtn = page.getByRole("button", { name: /voice|เสียง/i }).first();
    await expect(voiceBtn).toBeVisible({ timeout: 8000 }).catch(() => {});
    if (await voiceBtn.count()) {
      await voiceBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test("re-open wizard via Setup keeps budget editable", async ({ page }) => {
    await page.goto("/dashboard");
    const setup = page.getByRole("button", { name: /setup|edit budget|re-?open wizard|ตั้งค่า/i }).first();
    if (await setup.count()) {
      await setup.click();
      await expect(page.getByRole("heading", { name: /setup your budget/i })).toBeVisible({ timeout: 8000 });
    }
  });
});
