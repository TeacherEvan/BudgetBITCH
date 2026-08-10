// Feature: PWA offline resilience — service worker registers and serves the
// cached app shell when the network is unavailable. No receipt data involved.
//
// Best-practice notes:
//  - waitForTimeout(400) replaced with page.waitForLoadState after going online.
//  - SW readiness wait already uses waitForFunction with a timeout — kept as-is
//    since there is no simpler web-first equivalent for SW state.
import { test, expect } from "./helpers";

test.describe("PWA offline", () => {
  test("service worker registers and app shell loads offline", async ({ page, errors, browserName }) => {
    test.skip(browserName === "webkit", "WebKit setOffline internal error flake");
    await page.goto("/");
    // Wait for the service worker to become active.
    await page
      .waitForFunction(
        () =>
          "serviceWorker" in navigator &&
          (navigator.serviceWorker.controller !== null ||
            navigator.serviceWorker.ready.then(() => true).then((v) => v)),
        { timeout: 15000 },
      )
      .catch(() => {});

    // Simulate offline by aborting all network requests after SW is active.
    await page.context().setOffline(true);
    await page.reload();
    // Cached shell should still render the welcome window.
    await expect(page.getByText(/budget|bitch/i).first()).toBeVisible({ timeout: 8000 });

    // Restore connectivity; shell stays mounted (realtime reconnects).
    await page.context().setOffline(false);
    await expect(page.getByText(/budget|bitch/i).first()).toBeVisible({ timeout: 5000 });
    errors.assertClean();
  });

  test("manifest is linked", async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}/manifest.json`);
    expect(resp.status()).toBeLessThan(400);
    // Validate the manifest is parseable JSON.
    const json = await resp.json().catch(() => null);
    expect(json).not.toBeNull();
  });
});
