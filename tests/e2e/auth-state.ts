import type { Page } from "@playwright/test";

export async function seedSignedInAuthOverride(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("budgetbitch:e2e-auth-state", "signed-in");
  });
}