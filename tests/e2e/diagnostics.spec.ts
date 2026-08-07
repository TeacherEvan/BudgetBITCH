// Feature: Storage Diagnostics & Recovery ("debug" feature).
//
// Covers the Settings → Data → "Diagnostics & Recovery" modal:
//  - modal opens and renders storage quota/usage
//  - "Run Integrity Scan" produces audit logs
//  - "+ Create Checkpoint Now" creates a local checkpoint that appears in the list
//  - "Request Protection" appears only when storage is unpersisted
//  - modal closes cleanly
//
// Requires real sign-in (skips cleanly without E2E_TEST_EMAIL/PASSWORD).
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Storage Diagnostics & Recovery", () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /settings|ตั้งค่า/i }),
    ).toBeVisible({ timeout: 8000 });
  });

  async function openDiagnostics(page: import("@playwright/test").Page) {
    await page
      .getByRole("button", { name: /diagnostics & recovery|การวิเคราะห์และกู้คืน/i })
      .click();
    const dialog = page.getByRole("dialog", {
      name: /database diagnostics|การวิเคราะห์และกู้คืนฐานข้อมูล/i,
    });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    return dialog;
  }

  test("opens the modal and renders storage quota & usage", async ({ page }) => {
    const dialog = await openDiagnostics(page);
    await expect(
      dialog.getByRole("heading", { name: /storage quota/i }),
    ).toBeVisible();
    // Usage text loads asynchronously from navigator.storage.estimate().
    await expect(dialog.getByText(/used:\s*\d/i)).toBeVisible({ timeout: 8000 });
    await expect(dialog.getByText(/total:\s*\d/i)).toBeVisible();
    // Persistence badge renders one of the two states.
    await expect(
      dialog.getByText(/yes \(secure\)|no \(at risk of browser eviction\)/i),
    ).toBeVisible();
  });

  test("Run Integrity Scan streams audit logs and finishes", async ({ page }) => {
    const dialog = await openDiagnostics(page);
    await dialog.getByRole("button", { name: /run integrity scan/i }).click();
    // Log console appears with the audit trail.
    await expect(
      dialog.getByText(/starting comprehensive database health audit/i),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      dialog.getByText(/all database stores are healthy|repaired \d+/i),
    ).toBeVisible({ timeout: 8000 });
    // Button returns to idle state (scan completed, not stuck on "Scanning...").
    await expect(
      dialog.getByRole("button", { name: /run integrity scan/i }),
    ).toBeEnabled({ timeout: 8000 });
  });

  test("Create Checkpoint Now adds a local checkpoint to the list", async ({ page }) => {
    const dialog = await openDiagnostics(page);
    await expect(dialog.getByTestId("create-checkpoint-btn")).toBeVisible();
    await dialog.getByTestId("create-checkpoint-btn").click();
    await expect(dialog.getByText(/manual checkpoint/i)).toBeVisible({
      timeout: 8000,
    });
    // A Restore action is now offered for the new checkpoint.
    await expect(
      dialog.getByRole("button", { name: /^restore$/i }).first(),
    ).toBeVisible();
  });

  test("Request Protection button is only present when storage is unpersisted", async ({ page }) => {
    const dialog = await openDiagnostics(page);
    // Wait for the async storage estimate to resolve first.
    await expect(dialog.getByText(/used:\s*\d/i)).toBeVisible({ timeout: 8000 });
    const persisted = await dialog.getByText(/yes \(secure\)/i).isVisible();
    const requestBtn = dialog.getByTestId("request-persistence-btn");
    if (persisted) {
      await expect(requestBtn).toHaveCount(0);
    } else {
      await expect(requestBtn).toBeVisible();
      // Clicking must not throw; state either flips to persisted or stays.
      await requestBtn.click();
      await expect(
        dialog.getByText(/yes \(secure\)|no \(at risk of browser eviction\)/i),
      ).toBeVisible({ timeout: 8000 });
    }
  });

  test("modal closes via the Close button", async ({ page }) => {
    const dialog = await openDiagnostics(page);
    await dialog.getByRole("button", { name: /^close$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 4000 });
  });
});
