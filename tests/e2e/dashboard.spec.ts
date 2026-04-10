import { expect, test } from "@playwright/test";

test("dashboard billboard fits in one window and shows the live surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 980 });
  await page.goto("/dashboard?workspaceId=workspace-2");

  await expect(page.getByRole("heading", { name: /interactive billboard/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /local area/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /popular budgeting tools/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /live briefing/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open setup wizard/i })).toBeVisible();

  const bodyOverflows = await page.evaluate(() => document.body.scrollHeight > window.innerHeight);
  expect(bodyOverflows).toBe(false);
});
