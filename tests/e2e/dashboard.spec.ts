import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";

test("dashboard redirects to sign-in under the local no-auth harness", async ({ page }) => {
  test.slow();

  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/dashboard?workspaceId=workspace-2");

  await expect(page.getByRole("heading", { name: /open your budget board/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open sign-up" })).toHaveAttribute(
    "href",
    "/sign-up?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
  );
  await expectConvexPasswordAuthEntry(page);
});

test("dashboard signed-in local harness submits record, local, privacy, and job preference flows", async ({ page }) => {
  test.slow();

  await seedSignedInAuthOverride(page);
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/dashboard?workspaceId=workspace-household");

  await expect(page.getByRole("heading", { name: /money dashboard/i })).toBeVisible();
  await expect(page.getByText(/household budget/i)).toBeVisible();

  await page.getByLabel(/merchant/i).fill("Corner Store");
  await page.getByLabel(/amount/i).fill("18.25");
  await page.getByLabel(/note/i).fill("Lunch after errands");

  const expenseResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/accounting/expenses") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /save expense/i }).click();
  const expenseResponse = await expenseResponsePromise;

  expect(expenseResponse.ok()).toBeTruthy();
  await expect(page.getByText(/expense saved to the money dashboard\./i)).toBeVisible();

  await page.getByRole("tab", { name: /local/i }).click();
  await page.getByLabel(/^city$/i).fill("Oakland");
  await page.getByLabel(/^state$/i).fill("CA");

  const homeLocationResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/accounting/home-location") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /save home area/i }).click();
  const homeLocationResponse = await homeLocationResponsePromise;

  expect(homeLocationResponse.ok()).toBeTruthy();
  await expect(page.getByText(/home area saved\. only city and state are kept\./i)).toBeVisible();

  await page.getByLabel(/requested roles/i).fill("teacher, dog walker");
  await page.getByLabel(/certifications/i).fill("RN");
  await page.getByRole("checkbox", { name: /teaching/i }).check();

  const jobPreferencesResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/personalization/job-preferences") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /save job signals/i }).click();
  const jobPreferencesResponse = await jobPreferencesResponsePromise;

  expect(jobPreferencesResponse.ok()).toBeTruthy();
  await expect(
    page.getByText(/job preference signals saved\. matches will refresh for your stated interests\./i),
  ).toBeVisible();

  await page.getByRole("tab", { name: /privacy/i }).click();
  await page.getByLabel(/pronouns/i).selectOption("they_them");
  await page.getByLabel(/communication style/i).selectOption("direct");

  const privacyResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/personalization/profile") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /save privacy settings/i }).click();
  const privacyResponse = await privacyResponsePromise;

  expect(privacyResponse.ok()).toBeTruthy();
  await expect(page.getByText(/privacy and personalization settings saved\./i)).toBeVisible();
});
