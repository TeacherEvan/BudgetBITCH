import type { Page } from "@playwright/test";

export async function seedSignedInAuthOverride(page: Page) {
  await page.context().addCookies([
    {
      name: "budgetbitch:e2e-auth-state",
      value: "signed-in",
      url: "http://127.0.0.1:3100",
      sameSite: "Lax",
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem("budgetbitch:e2e-auth-state", "signed-in");
  });
}