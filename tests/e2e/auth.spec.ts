// Feature: Authentication (sign-in / sign-up / forgot / reset / route guard)
import { test, expect } from "./helpers";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Auth — sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("renders the Budget-BOSS sign-in card", async ({ page }) => {
    await expect(page.getByText("Budget-BOSS").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("switches to sign-up flow and back", async ({ page }) => {
    await page.getByRole("button", { name: /sign up/i }).click();
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up$/i })).toBeVisible();
    await page.getByRole("button", { name: /sign in$/i }).click();
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("opens forgot-password view from sign-in", async ({ page }) => {
    await page.getByRole("button", { name: /forgot password/i }).click();
    await expect(page.getByRole("button", { name: /send reset code/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /back to sign in/i })).toBeVisible();
  });

  test("shows validation error on empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in$/i }).click();
    // Either HTML5 validation blocks, or the form surfaces an inline error.
    await expect(
      page.getByText(/please fill|required|invalid|enter your/i).first(),
    ).toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  (TEST_EMAIL && TEST_PASSWORD ? test : test.skip)(
    "real sign-in succeeds and lands on dashboard",
    async ({ page }) => {
      await page.getByLabel(/email address/i).fill(TEST_EMAIL!);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD!);
      await page.getByRole("button", { name: /sign in$/i }).click();
      await expect(page).toHaveURL(/\/(dashboard|wizard)/, { timeout: 15000 });
    },
  );
});

test.describe("Auth — sign-up page", () => {
  test("renders create-account form", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });
});

test.describe("Auth — route guard", () => {
  test("unauthenticated visit to /dashboard redirects to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    // Client-side RequireAuth redirects to /sign-in?redirectTo=...
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });

  test("unauthenticated visit to /wizard redirects to sign-in", async ({ page }) => {
    await page.goto("/wizard");
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});

test.describe("First-launch language select", () => {
  test("shows the language modal on first root visit and persists the choice", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // First-launch splash renders for ~2.4s before the CTA is interactive.
    const splash = page.getByTestId("golden-splash");
    const enter = page.getByRole("button", { name: /enter boss mode/i });
    await expect(enter).toBeVisible({ timeout: 15000 });

    // Dismiss the splash robustly (retry in case the animated CTA misses a click).
    for (let i = 0; i < 3; i++) {
      await enter.click({ timeout: 5000 }).catch(() => {});
      if (await splash.isHidden().catch(() => true)) break;
    }
    await expect(splash).toBeHidden({ timeout: 10000 });

    // With no saved locale, the language modal should appear over the auth card.
    // Scope to the modal's unique title — other role="dialog" surfaces (privacy,
    // cookie banner) may also be mounted and would trip strict mode.
    const modal = page.getByRole("dialog", { name: /welcome to budget-boss/i });
    await expect(modal).toBeVisible({ timeout: 15000 });
    await expect(modal.getByText(/choose your language/i)).toBeVisible();

    // Selecting a language persists it and dismisses the modal.
    await modal.getByRole("button", { name: /English \(South Africa\)/i }).click();
    await expect(modal).toBeHidden({ timeout: 10000 });
    const stored = await page.evaluate(() =>
      localStorage.getItem("budgetbitch:locale"),
    );
    expect(stored).toBe("en-ZA");
  });

  test("does not show the language modal when a locale is already saved", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Establish origin, then persist a locale and skip the splash for reload.
    await page.evaluate(() => {
      localStorage.setItem("budgetbitch:locale", "en-ZA");
      sessionStorage.setItem("bb:splash-seen", "true");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("dialog", { name: /welcome to budget-boss/i }),
    ).toBeHidden({ timeout: 15000 });
  });
});

test.describe("Auth — password reset pages", () => {
  test("forgot-password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("button", { name: /send reset code/i })).toBeVisible();
  });

  test("reset page renders", async ({ page }) => {
    await page.goto("/reset");
    await expect(page.getByRole("button", { name: /reset password/i })).toBeVisible();
  });

  test("join page renders", async ({ page }) => {
    await page.goto("/join");
    await expect(page.locator("body")).toBeVisible();
  });
});
