import type { Page } from "@playwright/test";

const recoverableNavigationErrorPattern = /ERR_ABORTED|frame was detached/i;

export async function gotoWithCommit(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "commit", timeout: 45_000 });
    await page.waitForLoadState("load", { timeout: 45_000 });
    return;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !recoverableNavigationErrorPattern.test(error.message)
    ) {
      throw error;
    }

    if (page.isClosed()) {
      throw error;
    }
  }

  // Retry once with a less strict wait target for dev-server route compilation.
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForLoadState("load", { timeout: 45_000 });
}