import { expect, test } from "@playwright/test";

test("notes page renders empty state on first visit", async ({ page }) => {
  await page.goto("/notes");
  await expect(page.getByRole("heading", { level: 1, name: "Notes" })).toBeVisible();
  await expect(page.getByText(/no notes yet/i)).toBeVisible();
});

test("notes page — add and delete a note", async ({ page }) => {
  await page.goto("/notes");

  await page.getByRole("textbox", { name: /new note/i }).fill("Buy oat milk");
  await page.getByRole("button", { name: /add note/i }).click();

  await expect(page.getByText("Buy oat milk")).toBeVisible();

  await page.getByRole("button", { name: /delete buy oat milk/i }).click();

  await expect(page.getByText("Buy oat milk")).not.toBeVisible();
  await expect(page.getByText(/no notes yet/i)).toBeVisible();
});

test("notes page has a working home nav link", async ({ page }) => {
  await page.goto("/notes");
  await expect(page.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
