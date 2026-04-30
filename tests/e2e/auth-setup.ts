import { expect, type Page } from "@playwright/test";

export async function expectGoogleOAuthSetupNotice(page: Page) {
  await expect(page.getByText(/google sign-in is not configured/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with google/i })).toHaveCount(0);
}