import { expect, type Page } from "@playwright/test";

export async function expectConvexPasswordAuthEntry(page: Page, submitName = /sign in/i) {
  await expect(page.getByText(/no google oauth client or user-managed env file/i)).toBeVisible();
  await expect(page.getByRole("button", { name: submitName })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
}