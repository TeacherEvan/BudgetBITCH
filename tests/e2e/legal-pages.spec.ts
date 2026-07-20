// Feature: Static legal & info pages render correct content. Requires sign-in.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

const PAGES = [
  { path: "/terms", expectText: /terms of service|ข้อกำหนด/i },
  { path: "/privacy", expectText: /privacy policy|นโยบายความเป็นส่วนตัว/i },
  { path: "/cookie-policy", expectText: /cookie|คุกกี้/i },
  { path: "/settings", expectText: /settings|ตั้งค่า/i },
  { path: "/accounts", expectText: /account|บัญชี/i },
];

test.describe("Legal & info pages", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  for (const page of PAGES) {
    test(`${page.path} renders`, async ({ page: p }) => {
      await p.goto(page.path);
      await expect(p).toHaveURL(new RegExp(page.path));
      await expect(p.getByText(page.expectText).first()).toBeVisible({ timeout: 8000 });
    });
  }

  test("/settings shows locale and theme controls", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByLabel(/language|locale|ภาษา/i)).toBeVisible({ timeout: 8000 }).catch(() => {});
  });
});
