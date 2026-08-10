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

// ---------------------------------------------------------------------------
// Console / page error collector.
// Network noise (RSS CORS, favicon, known benign messages) is filtered out.
// ---------------------------------------------------------------------------
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
      t.includes("hydration") || // pre-existing SSR/CSR mismatch warnings
      t.includes("sw registration failed") ||
      t.includes("server functions") ||
      t.includes("failed to load clerk")
    );
  }

  assertClean() {
    expect(this.errors, `Console errors:\n${this.errors.join("\n")}`).toEqual([]);
    expect(this.pageErrors, `Page errors:\n${this.pageErrors.join("\n")}`).toEqual([]);
  }
}

// ---------------------------------------------------------------------------
// Real sign-in via the password form.
// Skips the calling test if no credentials are configured.
// ---------------------------------------------------------------------------
export async function signInReal(page: Page) {
  if (!HAS_CREDS) {
    test.skip(true, "E2E_TEST_EMAIL / E2E_TEST_PASSWORD not set");
  }
  await page.goto("/sign-in");
  // Label on the live form is "Email / Username" (clean-auth-card.tsx).
  await page.getByLabel(/email/i).fill(TEST_EMAIL!);
  await page.getByLabel(/^password/i).fill(TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in$/i }).click();
  // Land on dashboard or wizard once authenticated.
  await expect(page).toHaveURL(/\/(dashboard|wizard)/, { timeout: 20000 });
}

// ---------------------------------------------------------------------------
// Seed localStorage so the manifesto gate, privacy disclaimer,
// and push-permission gate resolve deterministically.
// Does NOT seed locale (tests that need "first launch" behavior
// must NOT have a locale pre-set).
// ---------------------------------------------------------------------------
export async function seedLocalStorage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("bb:manifesto-v1", "1");
    // Suppress the push-notification permission gate (asked-once flag).
    localStorage.setItem("budgetbitch:pushAsked", "1");
    // Suppress the PWA install prompt for this session.
    sessionStorage.setItem("budgetbitch:pwaDismissed", "true");
    // Suppress the weekly privacy disclaimer by pre-seeding the current ISO week.
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
  });
}

// ---------------------------------------------------------------------------
// Race-safe consent dismissal.
// Seeds storage AND installs an in-page observer that auto-clicks the privacy
// "Got it" and cookie "Essential only" buttons whenever they appear (including
// the one-frame hydration flash). Keeps E2E from being gated by product
// overlays without altering the real overlay logic.
// ---------------------------------------------------------------------------
export async function setupConsentDismissal(page: Page) {
  await page.addInitScript(() => {
    // Suppress push-permission gate + PWA install prompt in every test.
    try {
      localStorage.setItem("budgetbitch:pushAsked", "1");
      sessionStorage.setItem("budgetbitch:pwaDismissed", "true");
    } catch {
      /* ignore */
    }
    let clickedPrivacy = false;
    let clickedCookie = false;
    const tryDismiss = () => {
      if (!clickedPrivacy) {
        const gotIt = document.querySelector<HTMLButtonElement>(
          '[data-testid="privacy-gotit-btn"]',
        );
        if (gotIt) {
          gotIt.click();
          clickedPrivacy = true;
        }
      }
      if (!clickedCookie) {
        const essential = Array.from(document.querySelectorAll("button")).find(
          (b) => /essential only/i.test(b.textContent ?? ""),
        );
        if (essential) {
          (essential as HTMLButtonElement).click();
          clickedCookie = true;
        }
      }
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
    //
    // Robustness note: under the Next.js dev server, first paint + HMR can race
    // the style insertion, letting the fullscreen privacy disclaimer (z-70)
    // flash in and swallow a click before suppression lands. So we (a) attach
    // synchronously when possible (documentElement exists at document-start for
    // real navigations), (b) fall back to DOMContentLoaded, and (c) re-heal via
    // the MutationObserver below if the style is ever missing from the DOM.
    const STYLE_ID = "e2e-overlay-suppressor";
    const ensureStyle = () => {
      if (!document.documentElement) return;
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent =
        '[data-testid="privacy-disclaimer"],[aria-label="Cookies"],[data-testid="push-permission"]{display:none!important;pointer-events:none!important;}';
      document.documentElement.appendChild(style);
    };

    ensureStyle();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureStyle, { once: true });
    }

    const obs = new MutationObserver(() => {
      ensureStyle();
      tryDismiss();
    });
    obs.observe(document, { childList: true, subtree: true });
    // Best-effort immediate pass once DOM is ready.
    if (document.readyState !== "loading") {
      ensureStyle();
      tryDismiss();
    } else {
      document.addEventListener("DOMContentLoaded", tryDismiss);
    }
  });
}

// ---------------------------------------------------------------------------
// Custom fixtures.
// ---------------------------------------------------------------------------
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
