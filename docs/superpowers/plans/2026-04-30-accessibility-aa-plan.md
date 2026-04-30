# WCAG 2.2 AA Accessibility Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring BudgetBITCH's user-facing routes and shared interaction patterns to WCAG 2.2 AA using the existing test stack and route-level acceptance checks.

**Architecture:** Harden shared UI primitives first so headings, forms, alerts, navigation, focus states, and language metadata improve everywhere they are reused. Then close route-specific gaps on auth, root, onboarding, dashboard, learn, jobs, settings, and other interactive surfaces while extending Testing Library and Playwright coverage around semantics and keyboard-safe behavior.

**Tech Stack:** Next.js App Router, React Testing Library, Vitest, Playwright

---

## File Structure

- **Create:** `src/components/a11y/skip-link.tsx` — Shared skip-to-content link for app and auth layouts.
- **Create:** `src/components/a11y/skip-link.test.tsx` — Unit coverage for skip-link rendering.
- **Modify:** `src/app/layout.tsx` and `src/app/(app)/layout.tsx` — Wire skip link, landmarks, and main-content targets.
- **Modify:** `src/components/auth/auth-entry-panel.tsx`
- **Modify:** `src/components/welcome/welcome-window.tsx`
- **Modify:** `src/components/launch/searchable-combobox.tsx`
- **Modify:** `src/components/start-smart/profile-form.tsx`
- **Modify:** `src/components/jobs/job-card.tsx`
- **Modify:** `src/components/jobs/jobs-filter-panel.tsx`
- **Modify:** `src/components/dashboard/app-nav.tsx`
- **Modify:** `src/components/integrations/*` surfaces that render CTA rails, privacy disclosures, and warnings
- **Modify:** corresponding tests in `src/**/*.test.tsx`
- **Modify:** targeted browser flows in `tests/e2e/welcome-auth.spec.ts`, `tests/e2e/start-smart.spec.ts`, `tests/e2e/jobs.spec.ts`, and `tests/e2e/integrations-*.spec.ts`

### Task 1: Add shell-level navigation and landmark accessibility

**Files:**
- Create: `src/components/a11y/skip-link.tsx`
- Create: `src/components/a11y/skip-link.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/layout.test.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/app/(app)/layout.test.tsx`

- [ ] **Step 1: Write the failing shell accessibility tests**

```ts
import { render, screen } from "@testing-library/react";
import { SkipLink } from "./skip-link";

it("renders a skip link to the main content region", () => {
  render(<SkipLink targetId="main-content" />);
  expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute(
    "href",
    "#main-content",
  );
});
```

```ts
it("renders the root layout with a main landmark target", async () => {
  render(await Layout({ children: <div>child</div> }));
  expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
});
```

- [ ] **Step 2: Run the shell accessibility tests to verify they fail**

Run: `npm test -- src/components/a11y/skip-link.test.tsx src/app/layout.test.tsx src/app/(app)/layout.test.tsx`

Expected: FAIL because the skip link and main landmark target are missing.

- [ ] **Step 3: Implement the shell accessibility primitives**

```tsx
// src/components/a11y/skip-link.tsx
export function SkipLink({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-black focus:px-4 focus:py-2 focus:text-white"
    >
      Skip to main content
    </a>
  );
}
```

```tsx
// inside layouts
<SkipLink targetId="main-content" />
<main id="main-content">{children}</main>
```

- [ ] **Step 4: Run the shell accessibility tests to verify they pass**

Run: `npm test -- src/components/a11y/skip-link.test.tsx src/app/layout.test.tsx src/app/(app)/layout.test.tsx`

Expected: PASS with skip navigation and a stable main landmark.

- [ ] **Step 5: Commit**

```bash
git add src/components/a11y/skip-link.tsx src/components/a11y/skip-link.test.tsx src/app/layout.tsx src/app/layout.test.tsx src/app/(app)/layout.tsx src/app/(app)/layout.test.tsx
git commit -m "feat: add shell accessibility landmarks"
```

### Task 2: Fix auth, root, and navigation semantics

**Files:**
- Modify: `src/components/auth/auth-entry-panel.tsx`
- Modify: `src/app/sign-in/[[...sign-in]]/page.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/welcome/welcome-window.tsx`
- Modify: `src/components/dashboard/app-nav.tsx`
- Modify: `src/components/dashboard/app-nav.test.tsx`

- [ ] **Step 1: Write the failing semantics tests**

```ts
it("exposes one h1 on the auth entry panel and uses alerts for blocking errors", async () => {
  render(await SignInPage());
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
});
```

```ts
it("marks the active app route with aria-current", () => {
  render(<AppNav />);
  expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("aria-current", "page");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/page.test.tsx src/components/dashboard/app-nav.test.tsx`

Expected: FAIL until heading hierarchy, navigation, and alert semantics are cleaned up.

- [ ] **Step 3: Implement auth/root/navigation fixes**

```tsx
// auth panel direction
<main aria-labelledby="auth-entry-heading">
  <h1 id="auth-entry-heading">{title}</h1>
</main>
```

```tsx
// root route direction
<section aria-labelledby="route-lanes-heading">
  <h2 id="route-lanes-heading">Route lanes</h2>
</section>
```

```tsx
// nav direction
<Link aria-current={isRouteActive(pathname, route.href) ? "page" : undefined} />
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/page.test.tsx src/components/dashboard/app-nav.test.tsx`

Expected: PASS with cleaned-up headings and navigation semantics.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/auth-entry-panel.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/page.tsx src/app/page.test.tsx src/components/welcome/welcome-window.tsx src/components/dashboard/app-nav.tsx src/components/dashboard/app-nav.test.tsx
git commit -m "fix: improve auth and root accessibility semantics"
```

### Task 3: Close interactive form and filter accessibility gaps

**Files:**
- Modify: `src/components/launch/searchable-combobox.tsx`
- Modify: `src/components/start-smart/profile-form.tsx`
- Modify: `src/components/jobs/jobs-filter-panel.tsx`
- Modify: `src/components/jobs/job-card.tsx`
- Modify: `src/components/notes/notes-board.tsx`
- Modify: `src/components/calculator/calculator.tsx`
- Modify: colocated tests beside those files

- [ ] **Step 1: Write the failing interactive-control tests**

```ts
it("links start-smart field errors with aria-describedby", () => {
  render(<ProfileForm /* invalid state */ />);
  expect(screen.getByLabelText(/country/i)).toHaveAttribute("aria-invalid", "true");
});
```

```ts
it("gives the jobs primary action an explicit label", () => {
  render(<JobCard job={jobFixture} />);
  expect(screen.getByRole("link", { name: /open job details/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused interaction tests to verify they fail**

Run: `npm test -- src/components/start-smart/start-smart-shell.test.tsx src/components/jobs/job-card.test.tsx src/components/jobs/jobs-filter-panel.test.tsx`

Expected: FAIL until labels, descriptions, and error-linkage behavior are tightened.

- [ ] **Step 3: Implement the interaction fixes**

```tsx
// jobs primary CTA direction
<Link href={jobHref} aria-label={`Open job details for ${job.title}`}>
  Open job details
</Link>
```

```tsx
// form error direction
<p id={`${fieldId}-error`} role="alert">
  {error}
</p>
<input aria-describedby={`${fieldId}-error`} aria-invalid="true" />
```

```tsx
// searchable combobox direction
<input
  aria-autocomplete="list"
  aria-controls={listboxId}
  aria-expanded={isOpen}
  aria-activedescendant={activeOptionId}
/>
```

- [ ] **Step 4: Run the focused interaction tests to verify they pass**

Run: `npm test -- src/components/start-smart/start-smart-shell.test.tsx src/components/jobs/job-card.test.tsx src/components/jobs/jobs-filter-panel.test.tsx`

Expected: PASS with explicit labels and linked error messaging.

- [ ] **Step 5: Commit**

```bash
git add src/components/launch/searchable-combobox.tsx src/components/start-smart/profile-form.tsx src/components/jobs/jobs-filter-panel.tsx src/components/jobs/job-card.tsx src/components/notes/notes-board.tsx src/components/calculator/calculator.tsx
git commit -m "fix: improve form and card accessibility"
```

### Task 4: Validate route-level accessibility with browser flows and full suite runs

**Files:**
- Modify: `tests/e2e/welcome-auth.spec.ts`
- Modify: `tests/e2e/start-smart.spec.ts`
- Modify: `tests/e2e/jobs.spec.ts`
- Modify: `tests/e2e/integrations-tool-rail.spec.ts`
- Modify: relevant integration route tests under `tests/e2e/integrations-*.spec.ts`

- [ ] **Step 1: Add failing route-level accessibility checks**

```ts
test("welcome auth surface exposes a skip link and main landmark", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /skip to main content/i })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
});
```

```ts
test("jobs journey keeps the primary action explicit", async ({ page }) => {
  await page.goto("/jobs");
  await expect(page.getByRole("link", { name: /open job details/i }).first()).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted browser checks to verify they fail**

Run: `npm run test:e2e -- tests/e2e/welcome-auth.spec.ts tests/e2e/start-smart.spec.ts tests/e2e/jobs.spec.ts tests/e2e/integrations-tool-rail.spec.ts`

Expected: FAIL until the route-level accessibility assertions hold consistently.

- [ ] **Step 3: Finish route-by-route fixes**

```bash
# final accessibility sweep targets
rg "role=\"alert\"|aria-|sr-only|aria-current|aria-invalid" src --glob "*.{ts,tsx}"
```

```tsx
// final route pattern
<main id="main-content" aria-labelledby="page-heading">
  <h1 id="page-heading">{heading}</h1>
</main>
```

- [ ] **Step 4: Run full accessibility validation**

Run:

```bash
npm run lint
npm test
npm run test:e2e -- tests/e2e/welcome-auth.spec.ts tests/e2e/start-smart.spec.ts tests/e2e/jobs.spec.ts tests/e2e/integrations-tool-rail.spec.ts
npm run build
```

Expected:

- lint passes
- unit/component tests pass
- targeted Playwright route checks pass
- build passes

- [ ] **Step 5: Commit**

```bash
git add src tests/e2e
git commit -m "fix: complete route-level accessibility coverage"
```
