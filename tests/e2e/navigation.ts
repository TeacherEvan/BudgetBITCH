import type { Page } from "@playwright/test";

export async function gotoWithCommit(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "commit" });
  } catch (error) {
    if (!(error instanceof Error) || !/ERR_ABORTED|frame was detached/i.test(error.message)) {
      throw error;
    }
  }
}