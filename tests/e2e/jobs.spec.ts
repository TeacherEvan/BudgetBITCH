import { expect, test } from "@playwright/test";
import { seedSignedInAuthOverride } from "./auth-state";
import { seedCompletedLaunchProfile } from "./launch-profile";

test("user can open Jobs and review a blueprint-aware listing", async ({ page }) => {
  test.slow();

  await seedSignedInAuthOverride(page);
  await seedCompletedLaunchProfile(page);
  await page.goto("/");

  const jobsLink = page.getByRole("link", { name: "Explore jobs" });

  await expect(jobsLink).toHaveAttribute("href", "/jobs");
  await page.goto("/jobs");

  await expect(
    page.getByRole("heading", {
      name: "Quick job routes for real-life pressure.",
    }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Scan by relief type, then open the full brief.")).toBeVisible();
  await expect(page).toHaveURL(/\/jobs(?:[?#].*)?$/);
  await expect(page.getByText("Remote Customer Support Specialist")).toBeVisible();
  await expect(page.getByText("Posted 4 days ago")).toBeVisible();
  await expect(
    page.locator("article").filter({
      has: page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
    }).getByText("Best for"),
  ).toBeVisible();
  await expect(page.getByText("Steady remote support role with a solid base salary and clear hours.")).toHaveCount(0);

  const targetCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  });
  const detailLink = targetCard.getByRole("link", { name: /open job details/i });

  await expect(detailLink).toHaveAttribute("href", "/jobs/remote-customer-support-specialist");
  await detailLink.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(/\/jobs\/remote-customer-support-specialist(?:[?#].*)?$/, {
      waitUntil: "commit",
    }),
    detailLink.click({ force: true }),
  ]);

  await expect(
    page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why this fits" })).toBeVisible();
  await expect(
    page.getByText(/^Strong fit /),
  ).toBeVisible();
  await expect(page.getByText("Steady remote support role with a solid base salary and clear hours.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Benefits" })).toBeVisible();
});

test("jobs board stays usable inside the mobile shell", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedSignedInAuthOverride(page);
  await seedCompletedLaunchProfile(page);
  await page.goto("/jobs");

  await expect(page.locator('[data-slot="mobile-shell-content"]')).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mobile app navigation" })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Quick job routes for real-life pressure.",
    }),
  ).toBeVisible();

  const targetCard = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  });
  const detailLink = targetCard.getByRole("link", { name: /open job details/i });

  await expect(detailLink).toHaveAttribute("href", "/jobs/remote-customer-support-specialist");
  await detailLink.scrollIntoViewIfNeeded();
  await Promise.all([
    page.waitForURL(/\/jobs\/remote-customer-support-specialist(?:[?#].*)?$/, {
      waitUntil: "commit",
    }),
    detailLink.click({ force: true }),
  ]);
});
