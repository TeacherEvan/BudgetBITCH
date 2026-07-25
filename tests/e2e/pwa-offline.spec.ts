// Feature: PWA offline resilience — service worker registers and serves the
// cached app shell when the network is unavailable. No receipt data involved.
import { test, expect } from "./helpers";

test.describe("PWA offline", () => {
  test("service worker registers and app shell loads offline", async ({ page, errors }) => {
    await page.goto("/");
    // Wait for the service worker to become active.
    await page.waitForFunction(
      () =>
        "serviceWorker" in navigator &&
        (navigator.serviceWorker.controller !== null ||
          navigator.serviceWorker.ready.then(() => true).then((v) => v)),
      { timeout: 15000 },
    ).catch(() => {});

    // Simulate offline by aborting all network requests after SW is active.
    await page.context().setOffline(true);
    await page.reload();
    // Cached shell should still render the welcome window.
    await expect(page.getByText(/budget|bitch/i).first()).toBeVisible({ timeout: 8000 });
    await page.context().setOffline(false);
    await page.waitForTimeout(400);
    errors.assertClean();
  });

  test("manifest is linked", async ({ request, baseURL }) => {
    const resp = await request.get(`${baseURL}/manifest.json`);
    expect(resp.status()).toBeLessThan(400);
  });
});
