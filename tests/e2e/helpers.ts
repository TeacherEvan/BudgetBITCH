// Shared E2E helpers for BudgetBITCH.
//
// AUTH MODEL (webview-localStorage-auth branch): Convex Auth tokens live in
// localStorage (client-only). The server/middleware cannot read them, so
// protected pages are gated client-side by <RequireAuth /> via
// useConvexAuth().isAuthenticated. There is NO server-readable session, so the
// old E2E signed-in *cookie* no longer authenticates on this branch.
//
// Therefore authenticated E2E flows must perform a REAL sign-in. Supply
// credentials via E2E_TEST_EMAIL / E2E_TEST_PASSWORD. Tests that require auth
// SKIP cleanly when those vars are unset (so the suite is green in CI without
// secrets). The unauthenticated flows (sign-in page, route guard, password
// reset pages) run without credentials.

import { test as base, expect, type Page } from "@playwright/test";

export const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;
export const HAS_CREDS = Boolean(TEST_EMAIL && TEST_PASSWORD);

// Console / page error collector. Network noise (RSS CORS, favicon) is ignored.
export class ErrorCollector {
  readonly errors: string[] = [];
  private pageErrors: string[] = [];

  attach(page: Page) {
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (this.isIgnorable(text)) return;
      this.errors.push(`[console] ${text}`);
    });
    page.on("pageerror", (err) => {
      if (this.isIgnorable(err.message)) return;
      this.pageErrors.push(`[pageerror] ${err.message}`);
    });
  }

  private isIgnorable(text: string): boolean {
    const t = text.toLowerCase();
    return (
      t.includes("cors") ||
      t.includes("failed to fetch") ||
      t.includes("failed to load resource") ||
      t.includes("rss") ||
      t.includes("favicon") ||
      t.includes("net::err") ||
      t.includes("the user aborted a request") ||
      t.includes("aborterror") ||
      t.includes("hydration") // pre-existing SSR/CSR mismatch warnings
    );
  }

  assertClean() {
    expect(this.errors, `Console errors:\n${this.errors.join("\n")}`).toEqual([]);
    expect(this.pageErrors, `Page errors:\n${this.pageErrors.join("\n")}`).toEqual([]);
  }
}

// Perform a real sign-in via the password form. Skips the calling test if no
// credentials are configured.
export async function signInReal(page: Page) {
  if (!HAS_CREDS) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
  }
  await page.goto("/sign-in");
  await page.getByLabel(/email address/i).fill(TEST_EMAIL!);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in$/i }).click();
  // Land on dashboard or wizard once authenticated.
  await expect(page).toHaveURL(/\/(dashboard|wizard)/, { timeout: 20000 });
}

// Seed localStorage so the locale picker and manifesto gate resolve
// deterministically (manifesto marked seen to avoid blocking the dashboard).
export async function seedLocalStorage(page: Page, locale: "en" | "th" = "en") {
  await page.addInitScript(
    ({ locale }) => {
      localStorage.setItem("budgetbitch:locale", locale);
      localStorage.setItem("bb:manifesto-v1", "1");
    },
    { locale },
  );
}

// Race-safe consent dismissal: seeds storage AND installs an in-page observer
// that auto-clicks the privacy "Got it" and cookie "Essential only" buttons
// whenever they appear (including the one-frame hydration flash). This keeps
// E2E from being gated by real product overlays.
export async function setupConsentDismissal(page: Page) {
  await page.addInitScript(() => {
    const tryDismiss = () => {
      const gotIt = document.querySelector<HTMLButtonElement>(
        '[data-testid="privacy-gotit-btn"]',
      );
      if (gotIt) gotIt.click();
      const essential = Array.from(document.querySelectorAll("button")).find(
        (b) => /essential only/i.test(b.textContent ?? ""),
      );
      if (essential) (essential as HTMLButtonElement).click();
    };

    try {
      const d = new Date();
      const date = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      );
      const dayNum = (date.getUTCDay() + 6) % 7;
      date.setUTCDate(date.getUTCDate() - dayNum + 3);
      const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
      const week =
        1 +
        Math.round(
          ((date.getTime() - firstThursday.getTime()) / 86400000 -
            3 +
            ((firstThursday.getUTCDay() + 6) % 7)) /
            7,
        );
      const isoWeek = `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
      localStorage.setItem("budgetbitch:privacyDisclaimerWeek", isoWeek);
    } catch {
      /* ignore */
    }

    // Test-only backstop: guarantee the global privacy + cookie overlays never
    // intercept pointer events during E2E. (Unit tests cover the modal's real
    // visibility logic; this CSS exists only in the test browser.)
    const style = document.createElement("style");
    style.textContent =
      '[data-testid="privacy-disclaimer"],[aria-label="Cookies"]{display:none!important;}';
    document.documentElement.appendChild(style);

    const obs = new MutationObserver(tryDismiss);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    // Best-effort immediate pass once DOM is ready.
    if (document.readyState !== "loading") tryDismiss();
    else document.addEventListener("DOMContentLoaded", tryDismiss);
  });
}

// Custom fixtures.
export const test = base.extend<{
  errors: ErrorCollector;
}>({
  errors: async ({ page }, use) => {
    const collector = new ErrorCollector();
    collector.attach(page);
    // Playwright fixture `use` (not React's use hook) — disable the rule.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(collector);
  },
});

// Dismiss the global weekly privacy modal + cookie banner in every test so
// overlays never block clicks (they're real product surfaces, but E2E
// shouldn't be gated by them). Race-safe via in-page observer.
test.beforeEach(async ({ page }) => {
  await setupConsentDismissal(page);
});

export { expect };
