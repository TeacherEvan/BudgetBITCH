// Feature: Security page — static "how your data stays safe" page.
// Also: the live Content-Security-Policy response header (P0-C1 regression).
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

function scriptDirective(csp: string): string {
  return (
    csp
      .split(";")
      .map((directive) => directive.trim())
      .find((directive) => /^script-src\b/i.test(directive)) ?? ""
  );
}

async function fetchCsp(request: import("@playwright/test").APIRequestContext) {
  const response = await request.get("/");
  expect(response.ok(), "expected the root page to render").toBeTruthy();
  const csp = response.headers()["content-security-policy"] ?? "";
  expect(csp, "expected a Content-Security-Policy response header").not.toBe("");
  const scriptSrc = scriptDirective(csp);
  expect(scriptSrc, "expected a script-src directive").not.toBe("");
  return { csp, scriptSrc };
}

test.describe("Security page", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
  });

  test("renders architecture + encryption sections", async ({ page, errors }) => {
    await page.goto("/security");
    await expect(page.getByTestId("security-stack")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("security-encryption")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("security-five-year-old")).toBeVisible({ timeout: 8000 });
    errors.assertClean();
  });
});

test.describe("Content-Security-Policy header", () => {
  test("nonce-gates scripts and never allows inline scripts", async ({ request }) => {
    const { scriptSrc } = await fetchCsp(request);
    expect(scriptSrc).toMatch(/'nonce-[^']+'/);
    expect(scriptSrc).not.toMatch(/'unsafe-inline'/);

    // Next.js requires 'unsafe-eval' in DEVELOPMENT for React's enhanced error
    // stacks (see node_modules/next/dist/docs/.../content-security-policy.md).
    // The production branch of src/proxy.ts omits it, and
    // scripts/check-csp-hosts.mjs enforces that statically. Only assert its
    // absence here when targeting a deployed (production-build) URL.
    if (process.env.E2E_BASE_URL) {
      expect(scriptSrc).not.toMatch(/'unsafe-eval'/);
    }
  });

  test("generates a fresh nonce for every request", async ({ request }) => {
    const first = await fetchCsp(request);
    const second = await fetchCsp(request);
    const nonceA = /'nonce-([^']+)'/.exec(first.scriptSrc)?.[1];
    const nonceB = /'nonce-([^']+)'/.exec(second.scriptSrc)?.[1];
    expect(nonceA, "CSP must carry a nonce").toBeTruthy();
    expect(nonceB, "CSP must carry a nonce").toBeTruthy();
    expect(nonceA).not.toBe(nonceB);
  });
});
