import { expect, test } from "@playwright/test";
import { expectConvexPasswordAuthEntry } from "./auth-setup";
import { seedSignedInAuthOverride } from "./auth-state";
import { gotoWithCommit } from "./navigation";

async function waitForDashboardReady(page: Parameters<typeof test>[0]["page"]) {
  await expect(page.locator("main > section").first()).toHaveAttribute("aria-busy", "false", {
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: /save expense/i })).toBeEnabled();
}

async function clickAndWaitForPost(
  page: Parameters<typeof test>[0]["page"],
  buttonName: RegExp,
  responsePath: string,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes(responsePath) && response.request().method() === "POST",
        { timeout: 8_000 },
      )
      .catch(() => null);

    await page.getByRole("button", { name: buttonName }).click();

    const response = await responsePromise;

    if (response) {
      return response;
    }
  }

  throw new Error(`No POST response received for ${responsePath}.`);
}

test("dashboard redirects to sign-in under the local no-auth harness", async ({ page }) => {
  test.slow();

  await page.setViewportSize({ width: 1440, height: 980 });
  await gotoWithCommit(page, "/dashboard?workspaceId=workspace-2");
  await page.waitForURL(/\/sign-in\?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2/);

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
  await page.route("**/api/v1/accounting/expenses", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ expense: { id: "expense-1" } }),
    });
  });
  await page.route("**/api/v1/accounting/home-location", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ homeLocation: { id: "home-location-1" } }),
    });
  });
  await page.route("**/api/v1/personalization/job-preferences", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ jobPreference: { id: "job-preference-1" } }),
    });
  });
  await page.route("**/api/v1/personalization/profile", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ profile: { id: "profile-1" } }),
    });
  });
  await page.setViewportSize({ width: 1440, height: 980 });
  await gotoWithCommit(page, "/dashboard?workspaceId=workspace-household");

  await expect(page.getByRole("heading", { name: /money dashboard/i })).toBeVisible();
  await expect(page.getByText(/household budget/i)).toBeVisible();
  await waitForDashboardReady(page);

  const merchantInput = page.getByLabel(/merchant/i);
  const amountInput = page.getByLabel(/amount/i);
  const noteInput = page.getByLabel(/note/i);

  await merchantInput.fill("Corner Store");
  await expect(merchantInput).toHaveValue("Corner Store");
  await amountInput.fill("18.25");
  await expect(amountInput).toHaveValue("18.25");
  await noteInput.fill("Lunch after errands");
  await expect(noteInput).toHaveValue("Lunch after errands");

  const expenseResponse = await clickAndWaitForPost(
    page,
    /save expense/i,
    "/api/v1/accounting/expenses",
  );

  expect(expenseResponse.ok()).toBeTruthy();
  await expect(page.getByText(/expense saved to the money dashboard\./i)).toBeVisible();

  await page.getByRole("tab", { name: /local/i }).click();
  await page.getByLabel(/^city$/i).fill("Oakland");
  await page.getByLabel(/^state$/i).fill("CA");

  const homeLocationResponse = await clickAndWaitForPost(
    page,
    /save home area/i,
    "/api/v1/accounting/home-location",
  );

  expect(homeLocationResponse.ok()).toBeTruthy();
  await expect(page.getByText(/home area saved\. only city and state are kept\./i)).toBeVisible();

  await page.getByLabel(/requested roles/i).fill("teacher, dog walker");
  await page.getByLabel(/certifications/i).fill("RN");
  await page.getByRole("checkbox", { name: /teaching/i }).check();

  const jobPreferencesResponse = await clickAndWaitForPost(
    page,
    /save job signals/i,
    "/api/v1/personalization/job-preferences",
  );

  expect(jobPreferencesResponse.ok()).toBeTruthy();
  await expect(
    page.getByText(/job preference signals saved\. matches will refresh for your stated interests\./i),
  ).toBeVisible();

  await page.getByRole("tab", { name: /privacy/i }).click();
  await page.getByLabel(/pronouns/i).selectOption("they_them");
  await page.getByLabel(/communication style/i).selectOption("direct");

  const privacyResponse = await clickAndWaitForPost(
    page,
    /save privacy settings/i,
    "/api/v1/personalization/profile",
  );

  expect(privacyResponse.ok()).toBeTruthy();
  await expect(page.getByText(/privacy and personalization settings saved\./i)).toBeVisible();
});
