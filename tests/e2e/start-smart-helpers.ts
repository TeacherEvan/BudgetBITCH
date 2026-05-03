import { expect, type Page } from "@playwright/test";

export async function openHomeBasePanel(page: Page) {
  const button = page.getByRole("button", { name: /set home base/i });
  const countryField = page.getByLabel(/country/i);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.click();

    try {
      await expect(countryField).toBeVisible({ timeout: 8_000 });
      return;
    } catch {
      // Retry once if the first click landed before client hydration finished wiring handlers.
    }
  }

  await expect(countryField).toBeVisible();
}

export async function openMoneySnapshotPanel(page: Page) {
  const button = page.getByRole("button", { name: /open money snapshot/i });
  const heading = page.getByRole("heading", { name: /only the core survival inputs/i });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.click({ force: true });

    try {
      await expect(heading).toBeVisible({ timeout: 8_000 });
      return;
    } catch {
      // Retry once if the first click landed before client hydration finished wiring handlers.
    }
  }

  await expect(heading).toBeVisible();
}

export async function buildBlueprint(page: Page) {
  const button = page.getByRole("button", { name: /build my survival blueprint/i });
  const title = page.getByText("Money Survival Blueprint");

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.click({ force: true });

    try {
      await expect(title).toBeVisible({ timeout: 8_000 });
      return;
    } catch {
      // Retry once if the first click landed before client hydration finished wiring handlers.
    }
  }

  await expect(title).toBeVisible();
}