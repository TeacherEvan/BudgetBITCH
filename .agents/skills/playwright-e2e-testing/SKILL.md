---
name: playwright-e2e-testing
description: >-
  Provides best practices, locator strategies, and debugging steps for writing robust, non-flaky Playwright E2E tests. Activate when writing, updating, or debugging Playwright end-to-end tests or CI test failures.
---

# Playwright E2E Testing Best Practices

Guidelines for creating fast, resilient, and reliable end-to-end tests with Playwright.

## Key Rules

### 1. Use User-Facing Locators
- Prefer `getByRole`, `getByText`, `getByLabel`, and `getByTestId` over brittle CSS/XPath selectors.

```typescript
// Good
await page.getByRole("button", { name: "Submit Budget" }).click();
await expect(page.getByText("Budget saved successfully")).toBeVisible();

// Avoid
await page.locator("div > div.btn-primary:nth-child(2)").click();
```

### 2. Leverage Auto-Waiting & Assertions
- Rely on web-first assertions (`expect(locator).toBeVisible()`, `expect(locator).toHaveText()`) which automatically poll until condition is met or timeout occurs.
- Avoid hardcoded `page.waitForTimeout(3000)`.

### 3. Isolated State & Mocking
- Test specs should be independent and run in isolation.
- Use `page.route()` to mock network calls or third-party APIs when testing offline/error states.

```typescript
await page.route("**/api/rates", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ USD: 1.0, EUR: 0.92 }),
  });
});
```

## Reference Guide

- Read [references/e2e-patterns.md](./references/e2e-patterns.md) for trace debugging, authentication state reuse, and CI artifact management.
