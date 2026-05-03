import { expect, test } from "@playwright/test";
import { gotoWithCommit } from "./navigation";

async function addNote(page: Parameters<typeof test>[0]["page"], text: string) {
  const input = page.getByRole("textbox", { name: /new note/i });
  const addButton = page.getByRole("button", { name: /add note/i });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await input.fill(text);
    await expect(input).toHaveValue(text);
    await input.press("Enter");

    try {
      await expect(page.getByText(text)).toBeVisible({ timeout: 3_000 });
      return;
    } catch {
      await addButton.click();

      try {
        await expect(page.getByText(text)).toBeVisible({ timeout: 3_000 });
        return;
      } catch {
        // Retry if the first submit landed before client hydration finished wiring handlers.
      }
    }
  }

  await expect(page.getByText(text)).toBeVisible();
}

test("notes page renders empty state on first visit", async ({ page }) => {
  await gotoWithCommit(page, "/notes");
  await expect(page.getByRole("heading", { level: 1, name: "Notes" })).toBeVisible();
  await expect(page.getByText("A quick place for reminders and rough budget thoughts.")).toBeVisible();
  await expect(page.getByText("No notes yet. Add one above.")).toBeVisible();
});

test("notes page — add and delete a note", async ({ page }) => {
  await gotoWithCommit(page, "/notes");

  await addNote(page, "Buy oat milk");

  await page.getByRole("button", { name: /delete buy oat milk/i }).click();

  await expect(page.getByText("Buy oat milk")).not.toBeVisible();
  await expect(page.getByText("No notes yet. Add one above.")).toBeVisible();
});

test("notes page has a working home nav link", async ({ page }) => {
  await gotoWithCommit(page, "/notes");
  await expect(page.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
