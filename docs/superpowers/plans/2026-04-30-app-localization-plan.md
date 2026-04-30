# App Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add app-wide English, Mandarin, and Thai localization with English as the default locale across auth, onboarding, dashboard, learn, jobs, settings, and shared error states.

**Architecture:** Introduce one shared locale layer that resolves locale from explicit choice, stored preference, browser hint, then English fallback. Migrate user-facing strings feature-by-feature so route files and shared components consume typed translation dictionaries instead of embedded English copy.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Playwright

---

## File Structure

- **Create:** `src/i18n/config.ts` — Supported locale list, locale resolution helpers, and default locale constants.
- **Create:** `src/i18n/config.test.ts` — Unit tests for locale resolution.
- **Create:** `src/i18n/messages/en.ts` — English source dictionary.
- **Create:** `src/i18n/messages/zh-CN.ts` — Mandarin dictionary.
- **Create:** `src/i18n/messages/th.ts` — Thai dictionary.
- **Create:** `src/i18n/get-messages.ts` — Typed message loader.
- **Create:** `src/components/i18n/locale-switcher.tsx` — Shared locale switcher UI.
- **Create:** `src/components/i18n/locale-switcher.test.tsx` — Component tests for language switching UI.
- **Modify:** `src/app/layout.tsx` and `src/app/layout.test.tsx` — Apply `lang`, locale preference loading, and app-wide locale shell wiring.
- **Modify:** Auth, root, dashboard, jobs, learn, start-smart, notes, calculator, and settings routes under `src/app/**`.
- **Modify:** shared components such as `src/components/auth/auth-entry-panel.tsx`, `src/components/welcome/welcome-window.tsx`, `src/components/jobs/job-card.tsx`, and integration UI primitives that render visible copy.
- **Modify:** route/component tests and Playwright flows that assert visible copy.

### Task 1: Add the shared locale foundation

**Files:**
- Create: `src/i18n/config.ts`
- Create: `src/i18n/config.test.ts`
- Create: `src/i18n/get-messages.ts`
- Create: `src/i18n/messages/en.ts`
- Create: `src/i18n/messages/zh-CN.ts`
- Create: `src/i18n/messages/th.ts`

- [ ] **Step 1: Write the failing locale-resolution test**

```ts
import { describe, expect, it } from "vitest";
import { defaultLocale, resolveLocale } from "./config";

describe("resolveLocale", () => {
  it("prefers an explicit locale choice", () => {
    expect(resolveLocale({ requested: "th", stored: "en", browser: "zh-CN" })).toBe("th");
  });

  it("falls back to english when nothing supported is provided", () => {
    expect(resolveLocale({ requested: undefined, stored: undefined, browser: "fr-FR" })).toBe(defaultLocale);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/i18n/config.test.ts`

Expected: FAIL because the i18n foundation files do not exist yet.

- [ ] **Step 3: Add the locale config and dictionaries**

```ts
// src/i18n/config.ts
export const supportedLocales = ["en", "zh-CN", "th"] as const;
export type AppLocale = (typeof supportedLocales)[number];
export const defaultLocale: AppLocale = "en";

export function normalizeLocale(value?: string | null): AppLocale | null {
  if (!value) return null;
  if (value === "zh" || value === "zh-CN") return "zh-CN";
  if (value === "th") return "th";
  if (value === "en") return "en";
  return null;
}

export function resolveLocale(input: {
  requested?: string | null;
  stored?: string | null;
  browser?: string | null;
}): AppLocale {
  return (
    normalizeLocale(input.requested) ??
    normalizeLocale(input.stored) ??
    normalizeLocale(input.browser) ??
    defaultLocale
  );
}
```

```ts
// src/i18n/messages/en.ts
export const en = {
  auth: {
    signInTitle: "Open your budget board",
    googleOnly: "Continue with Google",
  },
  shared: {
    language: "Language",
  },
} as const;
```

- [ ] **Step 4: Run the locale test to verify it passes**

Run: `npm test -- src/i18n/config.test.ts`

Expected: PASS with locale preference ordering verified.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/config.ts src/i18n/config.test.ts src/i18n/get-messages.ts src/i18n/messages/en.ts src/i18n/messages/zh-CN.ts src/i18n/messages/th.ts
git commit -m "feat: add localization foundation"
```

### Task 2: Wire locale state into the app shell and auth/root surfaces

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/layout.test.tsx`
- Create: `src/components/i18n/locale-switcher.tsx`
- Create: `src/components/i18n/locale-switcher.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `src/app/sign-in/[[...sign-in]]/page.test.tsx`
- Modify: `src/components/auth/auth-entry-panel.tsx`
- Modify: `src/components/welcome/welcome-window.tsx`

- [ ] **Step 1: Write the failing shell and auth localization tests**

```ts
import { render, screen } from "@testing-library/react";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";

it("renders the supported locales", () => {
  render(<LocaleSwitcher locale="en" />);
  expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /english/i })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /mandarin/i })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /thai/i })).toBeInTheDocument();
});
```

```ts
it("renders auth copy from the locale dictionary", async () => {
  render(await SignInPage());
  expect(screen.getByText(/open your budget board/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/components/i18n/locale-switcher.test.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/page.test.tsx src/app/layout.test.tsx`

Expected: FAIL because locale state and switcher wiring do not exist yet.

- [ ] **Step 3: Implement the locale shell**

```tsx
// src/components/i18n/locale-switcher.tsx
import { supportedLocales, type AppLocale } from "@/i18n/config";

const localeLabels: Record<AppLocale, string> = {
  en: "English",
  "zh-CN": "Mandarin",
  th: "Thai",
};

export function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  return (
    <label className="bb-mini-copy text-sm">
      Language
      <select aria-label="Language" defaultValue={locale} className="ml-2 rounded-xl bg-black/20 px-2 py-1">
        {supportedLocales.map((value) => (
          <option key={value} value={value}>
            {localeLabels[value]}
          </option>
        ))}
      </select>
    </label>
  );
}
```

```tsx
// inside src/app/layout.tsx
const locale = resolveLocale({
  stored: cookies().get("budgetbitch:locale")?.value,
  browser: headers().get("accept-language")?.split(",")[0],
});

return (
  <html lang={locale}>
    <body>{children}</body>
  </html>
);
```

- [ ] **Step 4: Run the shell/auth tests to verify they pass**

Run: `npm test -- src/components/i18n/locale-switcher.test.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/page.test.tsx src/app/layout.test.tsx`

Expected: PASS with shell-level locale wiring and dictionary-backed auth copy.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/layout.test.tsx src/components/i18n/locale-switcher.tsx src/components/i18n/locale-switcher.test.tsx src/app/page.tsx src/app/page.test.tsx src/app/sign-in/[[...sign-in]]/page.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx src/components/auth/auth-entry-panel.tsx src/components/welcome/welcome-window.tsx
git commit -m "feat: localize app shell and auth surfaces"
```

### Task 3: Migrate feature routes and shared components to dictionaries

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/start-smart/page.tsx`
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/app/(app)/learn/[slug]/page.tsx`
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/app/(app)/jobs/[slug]/page.tsx`
- Modify: `src/app/(app)/settings/security/page.tsx`
- Modify: `src/app/(app)/settings/integrations/page.tsx`
- Modify: `src/components/jobs/job-card.tsx`
- Modify: relevant page/component tests beside those files

- [ ] **Step 1: Write one failing route-level localization test per major surface**

```ts
it("uses localized jobs page headings", async () => {
  render(await JobsPage());
  expect(screen.getByRole("heading", { name: /jobs/i })).toBeInTheDocument();
});
```

```ts
it("uses localized dashboard text", async () => {
  render(await DashboardPage());
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the targeted feature tests to verify they fail**

Run: `npm test -- src/app/(app)/dashboard/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/start-smart/page.test.tsx`

Expected: FAIL after the assertions are changed from hardcoded strings to dictionary-backed expectations.

- [ ] **Step 3: Move feature copy to dictionaries**

```ts
// example shape inside src/i18n/messages/en.ts
export const en = {
  // ...
  jobs: {
    heading: "Jobs",
    openDetails: "Open job details",
  },
  dashboard: {
    heading: "Dashboard",
  },
  learn: {
    heading: "Learn",
  },
} as const;
```

```tsx
// example route usage
const messages = getMessages(locale);

<h1>{messages.jobs.heading}</h1>
<Link href={href}>{messages.jobs.openDetails}</Link>
```

- [ ] **Step 4: Run the targeted feature tests to verify they pass**

Run: `npm test -- src/app/(app)/dashboard/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/start-smart/page.test.tsx`

Expected: PASS with feature dictionaries driving visible copy.

- [ ] **Step 5: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/start-smart/page.tsx src/app/(app)/start-smart/page.test.tsx src/app/(app)/learn/page.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.tsx src/app/(app)/jobs/page.test.tsx src/components/jobs/job-card.tsx
git commit -m "feat: localize core app routes"
```

### Task 4: Finish translation coverage and validate with browser flows

**Files:**
- Modify: remaining user-facing routes and shared components under `src/app/**` and `src/components/**`
- Modify: Playwright tests in `tests/e2e/*.spec.ts`

- [ ] **Step 1: Add failing Playwright expectations for translated UI**

```ts
test("language switcher stays available on the signed-out root", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("combobox", { name: "Language" })).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted browser coverage to verify the new expectations fail**

Run: `npm run test:e2e -- tests/e2e/welcome-auth.spec.ts tests/e2e/jobs.spec.ts tests/e2e/integrations-tool-rail.spec.ts`

Expected: FAIL until the switcher and translated route content are available on those surfaces.

- [ ] **Step 3: Finish remaining translation migration**

```ts
// final sweep command
// rg "\"[A-Za-z].*\"" src/app src/components --glob "*.{ts,tsx}"
```

```tsx
// expected route pattern after migration
const messages = getMessages(locale);
return <p>{messages.shared.language}</p>;
```

- [ ] **Step 4: Run full localization validation**

Run:

```bash
npm run lint
npm test
npm run test:e2e -- tests/e2e/welcome-auth.spec.ts tests/e2e/jobs.spec.ts tests/e2e/integrations-tool-rail.spec.ts
npm run build
```

Expected:

- lint passes
- unit/component tests pass
- targeted Playwright locale-aware journeys pass
- build passes

- [ ] **Step 5: Commit**

```bash
git add src tests/e2e
git commit -m "feat: localize user-facing app copy"
```
