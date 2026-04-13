import { expect, test } from "@playwright/test";

test("mobile integrations hub stays within the shell and anchors categories", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings/integrations");

  await expect(page.getByRole("heading", { name: "Integrations" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Integration categories" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Jump to AI copilots" })).toHaveAttribute(
    "href",
    "#category-ai",
  );

  await page.getByRole("link", { name: "Jump to Finance operations" }).click();
  await expect(page.locator("#category-finance_ops")).toBeInViewport();

  const shellMetrics = await page.locator(".bb-app-shell").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  expect(shellMetrics.scrollWidth).toBeLessThanOrEqual(shellMetrics.clientWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});

test("desktop provider wizards still point back to the settings hub", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto("/settings/integrations/openai");

  await expect(page.getByRole("heading", { name: "Connect OpenAI" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to connection hub" })).toHaveAttribute(
    "href",
    "/settings/integrations",
  );
});
