import type { Page } from "@playwright/test";

const recoverableNavigationErrorPattern = /ERR_ABORTED|frame was detached/i;
const navigationTimeout = 45_000;

function isRecoverableNavigationError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    (recoverableNavigationErrorPattern.test(error.message) || error.name === "TimeoutError")
  );
}

export async function gotoWithCommit(page: Page, url: string) {
  let recoverableError: Error | undefined;

  for (const waitUntil of ["commit"] as const) {
    if (page.isClosed()) {
      throw recoverableError ?? new Error("Page was closed before navigation completed.");
    }

    try {
      await page.goto(url, { waitUntil, timeout: navigationTimeout });

      return;
    } catch (error) {
      if (!isRecoverableNavigationError(error)) {
        throw error;
      }

      recoverableError = error;
    }
  }

  throw recoverableError ?? new Error(`Navigation failed for ${url}.`);
}