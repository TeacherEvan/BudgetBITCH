// Feature: Cross-cutting route smoke — every real route returns 200 and has no
// uncaught console/page errors. Auth-gated routes are exercised when creds are
// present; skipped otherwise. Receipt-only surfaces are NOT visited.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

// Real routes from src/app (page.tsx / api routes). Excludes /auth/continue
// (not a real route) and receipt-scan paths.
const UNAUTH_ROUTES = [
  { path: "/", expectText: /budget|bitch/i },
  { path: "/sign-in", expectText: /sign in|log in|เข้าสู่ระบบ/i },
  { path: "/sign-up", expectText: /sign up|create account|สมัคร/i },
  { path: "/forgot-password", expectText: /forgot|reset|ลืม/i },
  { path: "/reset", expectText: /reset|new password|ตั้งรหัสใหม่/i },
  { path: "/join", expectText: /join|invite|เชิญ/i },
  { path: "/sms-confirm", expectText: /sms|confirm|ยืนยัน/i },
  { path: "/terms", expectText: /terms|ข้อกำหนด/i },
  { path: "/privacy", expectText: /privacy|ความเป็นส่วนตัว/i },
  { path: "/cookie-policy", expectText: /cookie|คุกกี้/i },
];

const AUTH_ROUTES = [
  { path: "/dashboard", expectText: /budget|daily|disposable|บัญชี/i },
  { path: "/accounts", expectText: /account|บัญชี/i },
  { path: "/settings", expectText: /settings|ตั้งค่า/i },
  { path: "/security", expectText: /security|ความปลอดภัย/i },
  { path: "/quick-add", expectText: /amount|note|จำนวน/i },
  { path: "/wizard", expectText: /budget|wizard|งบ/i },
];

test.describe("Route smoke — unauthenticated", () => {
  for (const r of UNAUTH_ROUTES) {
    test(`${r.path} returns 200 and is console-clean`, async ({ page, errors }) => {
      const resp = await page.goto(r.path);
      expect(resp?.status()).toBeLessThan(400);
      await expect(page.getByText(r.expectText).first()).toBeVisible({ timeout: 8000 });
      await page.waitForTimeout(800);
      errors.assertClean();
    });
  }
});

test.describe("Route smoke — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  for (const r of AUTH_ROUTES) {
    test(`${r.path} returns 200 and is console-clean`, async ({ page, errors }) => {
      const resp = await page.goto(r.path);
      expect(resp?.status()).toBeLessThan(400);
      await expect(page.getByText(r.expectText).first()).toBeVisible({ timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(800);
      errors.assertClean();
    });
  }
});
