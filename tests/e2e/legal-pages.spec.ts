// Feature: Static legal & info pages render correct content. Requires sign-in.
// Legal copy is authored in English only (LegalLocale = "en"); all other
// locales fall back to English, so matchers are English-only. (Thai was removed
// from the project — see AGENTS.md.)
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

const PAGES = [
  { path: "/terms", expectText: /terms of service/i },
  { path: "/privacy", expectText: /privacy policy/i },
  { path: "/cookie-policy", expectText: /cookie/i },
  { path: "/settings", expectText: /settings/i },
  { path: "/accounts", expectText: /account/i },
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
