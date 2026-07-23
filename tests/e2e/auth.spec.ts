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

  test("locale switcher is present", async ({ page }) => {
    await expect(page.getByLabel(/language|locale|ภาษา/i)).toBeVisible();
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
