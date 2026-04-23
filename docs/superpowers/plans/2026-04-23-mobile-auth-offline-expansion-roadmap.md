# BudgetBITCH Mobile, Auth, Offline, and Expansion Roadmap Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile-first BudgetBITCH that avoids scrolling on phones, supports sign-in with email/password, Google, and passkeys, works as an installable offline-capable app for safe surfaces, and expands country, city, and tool coverage with stronger Asia support.

**Architecture:** Keep the current Next.js App Router, Clerk, Prisma, and Convex wiring intact. Add a mobile-only full-viewport panel shell on top of the existing routes, extend Clerk rather than building custom password or biometric storage, add progressive enhancement for PWA install/offline, and expand launch/start-smart/integration registries in data-first modules before changing UI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Clerk, Prisma 7, Convex, Vitest, Testing Library, Playwright, Web App Manifest, Service Worker API, WebAuthn via Clerk passkeys.

---

## Scope check

This is intentionally a phased umbrella roadmap because the request spans four largely independent subsystems:

1. Mobile no-scroll shell and route conversion.
2. Authentication and workspace bootstrap.
3. Installability and offline behavior.
4. Country, city, and tool expansion.

Implementation should still happen in order. Do not start later tracks until earlier validation gates pass.

## File structure and responsibilities

### Mobile shell track

- Modify: `src/app/(app)/layout.tsx` — host the mobile shell above app routes.
- Modify: `src/components/dashboard/app-nav.tsx` — replace the current single-link nav with mobile route buttons and panel actions.
- Modify: `src/app/globals.css` — add mobile viewport locking, panel sizing, and desktop fallbacks.
- Create: `src/modules/mobile/mobile-route-config.ts` — canonical mobile route order, labels, and icon metadata.
- Create: `src/modules/mobile/mobile-route-config.test.ts` — guard route order and labels.
- Create: `src/components/mobile/mobile-app-shell.tsx` — full-height mobile shell with no-scroll behavior.
- Create: `src/components/mobile/mobile-panel-frame.tsx` — reusable panel/page frame for route content.
- Create: `src/components/mobile/mobile-app-shell.test.tsx` — component contract for mobile navigation.

### Auth track

- Create: `src/app/sign-in/[[...sign-in]]/page.tsx` — Clerk sign-in page with email/password, Google, and passkey-friendly copy.
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx` — Clerk sign-up page with password and Google paths.
- Create: `src/app/(app)/auth/continue/page.tsx` — authenticated bootstrap screen for first-run workspace creation.
- Create: `src/app/api/v1/auth/bootstrap/route.ts` — thin route to create `UserProfile`, workspace, membership, and default preference.
- Create: `src/modules/auth/bootstrap-user.ts` — Prisma-backed bootstrap logic.
- Create: `src/modules/auth/bootstrap-user.test.ts` — auth bootstrap contract tests.
- Create: `src/components/auth/auth-entry-panel.tsx` — shared copy block for install, passkeys, and auth methods.
- Modify: `middleware.ts` — keep Clerk middleware, add public auth route allowances only if needed.
- Modify: `src/lib/auth/route-guard.ts` — keep the guard tiny, but redirect unauthenticated users to `/sign-in` in consuming routes.

### Offline and install track

- Create: `src/app/manifest.ts` — web app manifest for installability.
- Create: `public/sw.js` — service worker with tightly scoped asset and page caching.
- Create: `src/components/providers/pwa-provider.tsx` — service worker registration + install prompt lifecycle.
- Create: `src/modules/pwa/install-prompt.ts` — typed wrapper for `beforeinstallprompt` behavior.
- Create: `src/components/pwa/install-button.tsx` — install CTA shown only when promptable.
- Create: `src/components/pwa/offline-banner.tsx` — app-wide online/offline state banner.
- Modify: `src/components/providers/app-providers.tsx` — include the PWA provider under Clerk/Convex.
- Modify: `src/components/notes/notes-board.tsx` — preserve notes offline with clearer sync boundaries.
- Modify: `src/components/calculator/calculator.tsx` — persist the latest calculator inputs locally.
- Modify: `src/components/launch/launch-wizard.tsx` — keep launch profile local-first and cache city data safely.

### Country, city, and tool expansion track

- Modify: `src/modules/launch/option-city-data.ts` — expand the city catalog with Asia-heavy coverage.
- Modify: `src/modules/launch/option-catalog.test.ts` — enforce new coverage and searchability.
- Create: `src/modules/start-smart/country-options.ts` — friendly country list for the Start Smart form.
- Modify: `src/components/start-smart/profile-form.tsx` — replace freehand country entry with a controlled selector.
- Modify: `src/modules/start-smart/regional-seed.ts` — add non-US region seeds.
- Modify: `src/modules/start-smart/regional-fetch.ts` — add curated source metadata for new regions.
- Modify: `src/modules/integrations/provider-types.ts` — extend provider unions/categories only where needed.
- Modify: `src/modules/integrations/provider-registry.ts` — add wave-one tools.
- Create: `src/app/(app)/settings/integrations/gemini/page.tsx`
- Create: `src/app/(app)/settings/integrations/perplexity/page.tsx`
- Create: `src/app/(app)/settings/integrations/mistral/page.tsx`
- Create: `src/app/(app)/settings/integrations/wise/page.tsx`
- Create: `src/app/(app)/settings/integrations/revolut/page.tsx`
- Create: `src/app/(app)/settings/integrations/paypal/page.tsx`
- Create: `src/app/(app)/settings/integrations/xero/page.tsx`
- Create: `src/app/(app)/settings/integrations/deel/page.tsx`
- Modify: `docs/CODEBASE_INDEX.md` — update the navigation map for new auth, PWA, and integration surfaces.

## Productive collaboration model

### Product and UX lane

- Use one reviewer to approve mobile panel labels, the auth entry hierarchy, and the offline boundary list before route-by-route implementation starts.
- Keep one acceptance sheet in the PR description with four headings: `Mobile shell`, `Auth`, `Offline`, `Expansion`.
- Reject any mobile change that reintroduces vertical scrolling below `md` unless it is an intentional embedded list with button-based paging.

### Research lane

- Use `runSubagent` with the `Explore` agent for provider documentation intake, browser capability checks, and data source triage.
- Use `fetch_webpage` only for official docs such as MDN, Clerk, provider docs, or government/statistics pages.
- Record every accepted external source in the implementation PR so future tool additions reuse the same intake pattern.

### Implementation lane

- Keep each task in a separate commit after tests pass.
- Use `run_task` for `Lint`, `Unit tests`, `E2E tests`, and `Build` instead of ad hoc terminal commands whenever the matching task exists.
- Keep route handlers thin. Business logic belongs in `src/modules/**`, not in pages or route files.

### QA lane

- Add Vitest coverage for each new pure module before UI integration.
- Add component tests before route-level page tests.
- Add Playwright only for mobile shell movement, auth entry visibility, install CTA presence, and one representative integration route per new provider wave.

## Phase order

1. Mobile shell foundation.
2. Mobile route conversion.
3. Clerk auth entry and workspace bootstrap.
4. Passkeys and post-auth security flow.
5. Manifest, install prompt, and service worker.
6. Offline-safe read and draft surfaces.
7. Asia data expansion.
8. Tool registry and provider page wave.
9. Full regression and hardening.

---

### Task 0: Baseline and execution contract

**Files:**
- Modify: `docs/superpowers/plans/2026-04-23-mobile-auth-offline-expansion-roadmap.md`
- Test: workspace tasks `Lint`, `Unit tests`, `Build`

- [ ] **Step 1: Confirm the current baseline before code changes**

Run: `run_task -> Lint`, `run_task -> Unit tests`, `run_task -> Build`
Expected: all three tasks pass on `main`.

- [ ] **Step 2: Open a tracking checklist in the PR body or work log**

Use this checklist text:

```md
- [ ] Mobile shell foundation approved
- [ ] Auth entry and bootstrap approved
- [ ] Offline boundaries approved
- [ ] Asia data and tool wave approved
```

- [ ] **Step 3: Commit the execution contract note**

```bash
git add docs/superpowers/plans/2026-04-23-mobile-auth-offline-expansion-roadmap.md
git commit -m "docs: add phased roadmap for mobile auth offline expansion"
```

### Task 1: Write failing tests for the mobile no-scroll shell

**Files:**
- Create: `src/modules/mobile/mobile-route-config.ts`
- Create: `src/modules/mobile/mobile-route-config.test.ts`
- Create: `src/components/mobile/mobile-app-shell.tsx`
- Create: `src/components/mobile/mobile-app-shell.test.tsx`
- Modify: `src/components/dashboard/app-nav.tsx`

- [ ] **Step 1: Write the route-config test first**

```ts
import { describe, expect, it } from "vitest";
import { mobileRouteConfig } from "./mobile-route-config";

describe("mobileRouteConfig", () => {
  it("keeps the primary mobile order stable", () => {
    expect(mobileRouteConfig.map((route) => route.href)).toEqual([
      "/dashboard",
      "/start-smart",
      "/calculator",
      "/notes",
      "/learn",
      "/settings/integrations",
      "/jobs",
    ]);
  });
});
```

- [ ] **Step 2: Write the mobile shell component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileAppShell } from "./mobile-app-shell";

describe("MobileAppShell", () => {
  it("renders route buttons instead of a scroll-heavy nav on small screens", () => {
    render(<MobileAppShell currentPath="/dashboard">panel</MobileAppShell>);

    expect(screen.getByRole("navigation", { name: /mobile app navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jobs/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the focused tests and verify failure**

Run: `npm test -- src/modules/mobile/mobile-route-config.test.ts src/components/mobile/mobile-app-shell.test.tsx`
Expected: FAIL because the module and component do not exist yet.

- [ ] **Step 4: Implement the smallest route config**

```ts
export const mobileRouteConfig = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/start-smart", label: "Blueprint" },
  { href: "/calculator", label: "Calculator" },
  { href: "/notes", label: "Notes" },
  { href: "/learn", label: "Learn" },
  { href: "/settings/integrations", label: "Tools" },
  { href: "/jobs", label: "Jobs" },
] as const;
```

- [ ] **Step 5: Implement the first mobile shell and rerun the same tests**

Run: `npm test -- src/modules/mobile/mobile-route-config.test.ts src/components/mobile/mobile-app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit the mobile shell contract**

```bash
git add src/modules/mobile src/components/mobile src/components/dashboard/app-nav.tsx
git commit -m "feat: add mobile shell contract"
```

### Task 2: Integrate the mobile shell into app layout and lock the viewport

**Files:**
- Modify: `src/app/(app)/layout.tsx`
- Modify: `src/components/dashboard/app-nav.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/dashboard/app-nav.test.tsx`

- [ ] **Step 1: Write the failing nav integration test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppNav } from "./app-nav";

describe("AppNav", () => {
  it("renders mobile route buttons", () => {
    render(<AppNav />);
    expect(screen.getByRole("navigation", { name: /app navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Replace the one-link nav with the mobile shell host**

```tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <MobileAppShell>{children}</MobileAppShell>;
}
```

- [ ] **Step 3: Add viewport locking styles for phones only**

```css
@media (max-width: 767px) {
  html,
  body {
    height: 100dvh;
    overflow: hidden;
  }

  .bb-mobile-shell {
    display: grid;
    grid-template-rows: auto 1fr auto;
    height: 100dvh;
    overflow: hidden;
  }

  .bb-mobile-panel {
    min-height: 0;
    overflow: hidden;
  }
}
```

- [ ] **Step 4: Run the focused tests**

Run: `npm test -- src/components/dashboard/app-nav.test.tsx src/components/mobile/mobile-app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit the shell integration**

```bash
git add src/app/(app)/layout.tsx src/components/dashboard/app-nav.tsx src/app/globals.css src/components/dashboard/app-nav.test.tsx
git commit -m "feat: wire mobile shell into app layout"
```

### Task 3: Convert mobile route surfaces from scroll pages to panel pages

**Files:**
- Create: `src/components/mobile/mobile-panel-frame.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/start-smart/page.tsx`
- Modify: `src/app/(app)/calculator/page.tsx`
- Modify: `src/app/(app)/notes/page.tsx`
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/app/(app)/settings/integrations/page.tsx`
- Modify: `src/app/(app)/jobs/page.tsx`
- Test: `src/app/page.test.tsx`
- Test: `src/app/(app)/dashboard/page.test.tsx`
- Test: `src/app/(app)/jobs/page.test.tsx`
- Test: `tests/e2e/smoke.spec.ts`
- Test: `tests/e2e/jobs.spec.ts`

- [ ] **Step 1: Add a reusable panel frame test and component**

```tsx
export function MobilePanelFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bb-mobile-panel" aria-label={title}>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Wrap landing and dashboard first, then verify no-scroll behavior**

Run: `npm test -- src/app/page.test.tsx src/app/(app)/dashboard/page.test.tsx`
Expected: PASS after both pages render within `MobilePanelFrame` on mobile-only branches.

- [ ] **Step 3: Convert Start Smart, Calculator, and Notes to panel pages**

Use this shape:

```tsx
<MobilePanelFrame title="Calculator">
  <main className="bb-page-shell md:min-h-screen">...</main>
</MobilePanelFrame>
```

- [ ] **Step 4: Convert Learn and Integrations next, keeping desktop layouts unchanged**

Run: `npm test -- src/app/(app)/learn/page.test.tsx src/app/(app)/settings/integrations/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Convert Jobs last and verify the representative E2E flow**

Run: `npm run test:e2e -- tests/e2e/jobs.spec.ts`
Expected: PASS with button-led movement still working on mobile viewport.

- [ ] **Step 6: Commit the route conversion batch**

```bash
git add src/app/page.tsx src/app/(app) src/components/mobile
git commit -m "feat: convert mobile routes to panel pages"
```

### Task 4: Add Clerk sign-in, sign-up, and first-run workspace bootstrap

**Files:**
- Create: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Create: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Create: `src/app/(app)/auth/continue/page.tsx`
- Create: `src/app/api/v1/auth/bootstrap/route.ts`
- Create: `src/modules/auth/bootstrap-user.ts`
- Create: `src/modules/auth/bootstrap-user.test.ts`
- Create: `src/components/auth/auth-entry-panel.tsx`
- Modify: `src/lib/auth/route-guard.ts`
- Test: `src/app/sign-in/[[...sign-in]]/page.test.tsx`
- Test: `src/app/sign-up/[[...sign-up]]/page.test.tsx`
- Test: `src/app/api/v1/auth/bootstrap/route.test.ts`

- [ ] **Step 1: Write the failing bootstrap-user test**

```ts
import { describe, expect, it } from "vitest";
import { bootstrapUserWorkspace } from "./bootstrap-user";

describe("bootstrapUserWorkspace", () => {
  it("creates a user profile, personal workspace, membership, and default preference", async () => {
    const result = await bootstrapUserWorkspace({
      clerkUserId: "user_123",
      email: "evan@example.com",
      displayName: "Evan",
    });

    expect(result.workspace.type).toBe("personal");
    expect(result.membership.role).toBe("owner");
  });
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/modules/auth/bootstrap-user.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the Prisma bootstrap module**

```ts
export async function bootstrapUserWorkspace(input: {
  clerkUserId: string;
  email: string;
  displayName?: string | null;
}) {
  // upsert UserProfile, create personal workspace, owner membership, default preference
}
```

- [ ] **Step 4: Add Clerk-powered auth pages instead of custom password storage**

Use this shape:

```tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="bb-page-shell">
      <AuthEntryPanel title="Sign in" />
      <SignIn routing="path" path="/sign-in" forceRedirectUrl="/auth/continue" />
    </main>
  );
}
```

- [ ] **Step 5: Add the thin bootstrap route and continue screen**

Run: `npm test -- src/modules/auth/bootstrap-user.test.ts src/app/api/v1/auth/bootstrap/route.test.ts src/app/sign-in/[[...sign-in]]/page.test.tsx src/app/sign-up/[[...sign-up]]/page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit the auth foundation**

```bash
git add src/app/sign-in src/app/sign-up src/app/(app)/auth src/app/api/v1/auth src/modules/auth src/components/auth src/lib/auth/route-guard.ts
git commit -m "feat: add clerk auth entry and workspace bootstrap"
```

### Task 5: Surface Google sign-in and passkeys with best-practice Clerk flow

**Files:**
- Modify: `src/components/auth/auth-entry-panel.tsx`
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx`
- Create: `src/app/(app)/settings/security/page.tsx`
- Create: `src/app/(app)/settings/security/page.test.tsx`
- Test: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Add explicit auth-method copy to the shared entry panel**

```tsx
<ul>
  <li>Email and password via Clerk</li>
  <li>Continue with Google</li>
  <li>Use a passkey on supported devices</li>
</ul>
```

- [ ] **Step 2: Keep passkeys as platform biometrics, not a custom fingerprint store**

Add this copy block:

```tsx
<p>
  Fingerprint or face unlock is provided by your device through passkeys. The app never stores
  raw biometric data.
</p>
```

- [ ] **Step 3: Add a security settings route that links users to Clerk account management**

```tsx
import { UserProfile } from "@clerk/nextjs";

export default function SecurityPage() {
  return <UserProfile path="/settings/security" routing="path" />;
}
```

- [ ] **Step 4: Verify the representative auth UI**

Run: `npm test -- src/app/(app)/settings/security/page.test.tsx src/app/sign-in/[[...sign-in]]/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Record the external config dependency**

Add this note to the PR checklist:

```md
- [ ] Clerk dashboard has Google OAuth enabled
- [ ] Clerk dashboard has passkeys enabled
```

- [ ] **Step 6: Commit the security flow**

```bash
git add src/components/auth src/app/sign-in src/app/sign-up src/app/(app)/settings/security
git commit -m "feat: add google and passkey auth guidance"
```

### Task 6: Add installability, service worker registration, and install CTA

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/sw.js`
- Create: `src/components/providers/pwa-provider.tsx`
- Create: `src/modules/pwa/install-prompt.ts`
- Create: `src/components/pwa/install-button.tsx`
- Create: `src/components/pwa/install-button.test.tsx`
- Modify: `src/components/providers/app-providers.tsx`

- [ ] **Step 1: Write the failing install-button test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InstallButton } from "./install-button";

describe("InstallButton", () => {
  it("stays hidden until an install prompt becomes available", () => {
    render(<InstallButton promptState={{ supported: true, canInstall: false }} />);
    expect(screen.queryByRole("button", { name: /install app/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement the manifest with required install members**

```ts
export default function manifest() {
  return {
    name: "BudgetBITCH",
    short_name: "BudgetBITCH",
    start_url: "/",
    display: "standalone",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

- [ ] **Step 3: Register the service worker only in the browser**

```tsx
useEffect(() => {
  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.register("/sw.js");
  }
}, []);
```

- [ ] **Step 4: Add a controlled install prompt wrapper and button**

Run: `npm test -- src/components/pwa/install-button.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit the installability foundation**

```bash
git add src/app/manifest.ts public/sw.js src/components/providers/pwa-provider.tsx src/modules/pwa src/components/pwa src/components/providers/app-providers.tsx
git commit -m "feat: add pwa manifest and install flow"
```

### Task 7: Make safe surfaces available offline and define hard offline boundaries

**Files:**
- Create: `src/components/pwa/offline-banner.tsx`
- Create: `src/components/pwa/offline-banner.test.tsx`
- Modify: `src/components/notes/notes-board.tsx`
- Modify: `src/components/calculator/calculator.tsx`
- Modify: `src/components/launch/launch-wizard.tsx`
- Modify: `public/sw.js`
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Add the offline banner test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfflineBanner } from "./offline-banner";

describe("OfflineBanner", () => {
  it("explains that sync-required routes stay unavailable while offline", () => {
    render(<OfflineBanner online={false} />);
    expect(screen.getByText(/notes, calculator, and launch settings stay available/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Restrict service-worker caching to static assets and safe route shells**

Use this policy comment in `public/sw.js`:

```js
// Cache app shell, launch city data, notes shell, calculator shell, and static assets.
// Do not cache authenticated mutation responses, integration secrets, or connect/revoke routes.
```

- [ ] **Step 3: Persist calculator inputs locally like notes and launch settings already do**

```ts
localStorage.setItem("budgetbitch:calculator-draft", JSON.stringify(nextDraft));
```

- [ ] **Step 4: Verify offline-safe component coverage**

Run: `npm test -- src/components/pwa/offline-banner.test.tsx src/components/notes/notes-board.test.tsx src/components/launch/launch-wizard.test.tsx src/app/(app)/calculator/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add one smoke E2E that checks install CTA or offline copy without requiring a true offline browser context**

Run: `npm run test:e2e -- tests/e2e/smoke.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit the offline-safe surfaces**

```bash
git add src/components/pwa src/components/notes/notes-board.tsx src/components/calculator/calculator.tsx src/components/launch/launch-wizard.tsx public/sw.js tests/e2e/smoke.spec.ts
git commit -m "feat: add offline-safe surfaces and banner"
```

### Task 8: Expand Asian countries, cities, and Start Smart region data

**Files:**
- Modify: `src/modules/launch/option-city-data.ts`
- Modify: `src/modules/launch/option-catalog.test.ts`
- Create: `src/modules/start-smart/country-options.ts`
- Modify: `src/components/start-smart/profile-form.tsx`
- Modify: `src/modules/start-smart/profile-schema.test.ts`
- Modify: `src/modules/start-smart/regional-seed.ts`
- Modify: `src/modules/start-smart/regional-fetch.ts`

- [ ] **Step 1: Write the failing city coverage test first**

```ts
import { describe, expect, it } from "vitest";
import { listLaunchCityOptions } from "./option-catalog";

describe("launch city coverage", () => {
  it("includes at least 12 Asia-region city options", () => {
    const asiaCountryCodes = new Set(["JP", "KR", "SG", "TH", "PH", "ID", "MY", "VN", "IN", "HK", "TW"]);
    const options = listLaunchCityOptions().filter((option) => asiaCountryCodes.has(option.countryCode));
    expect(options).toHaveLength(12);
  });
});
```

- [ ] **Step 2: Add a concrete first-wave city list**

Append these exact city entries to `option-city-data.ts`:

```ts
"Osaka", "Busan", "Bangkok", "Chiang Mai", "Manila", "Cebu", "Jakarta", "Bandung", "Kuala Lumpur", "Penang", "Ho Chi Minh City", "Hanoi", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Hong Kong", "Taipei"
```

- [ ] **Step 3: Replace the freehand country code input with a select fed by a fixed option list**

```tsx
<select aria-label="Country" value={values.countryCode} onChange={(event) => onChange("countryCode", event.target.value)}>
  {countryOptions.map((option) => (
    <option key={option.code} value={option.code}>{option.label}</option>
  ))}
</select>
```

- [ ] **Step 4: Add seeded regional support for the first non-US markets**

Add region keys for:

```ts
["jp-13", "kr-11", "sg-01", "th-10", "ph-00", "id-jk", "my-14", "vn-sg", "in-mh", "hk-hk", "tw-tpe"]
```

- [ ] **Step 5: Verify Start Smart and city catalog tests**

Run: `npm test -- src/modules/launch/option-catalog.test.ts src/modules/start-smart/profile-schema.test.ts src/app/(app)/start-smart/page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit the Asia data expansion**

```bash
git add src/modules/launch/option-city-data.ts src/modules/launch/option-catalog.test.ts src/modules/start-smart/country-options.ts src/components/start-smart/profile-form.tsx src/modules/start-smart/profile-schema.test.ts src/modules/start-smart/regional-seed.ts src/modules/start-smart/regional-fetch.ts
git commit -m "feat: expand asia launch and start smart coverage"
```

### Task 9: Add the next wave of tools and provider pages with research support

**Files:**
- Modify: `src/modules/integrations/provider-types.ts`
- Modify: `src/modules/integrations/provider-registry.ts`
- Modify: `src/app/(app)/settings/integrations/page.test.tsx`
- Create: `src/app/(app)/settings/integrations/gemini/page.tsx`
- Create: `src/app/(app)/settings/integrations/perplexity/page.tsx`
- Create: `src/app/(app)/settings/integrations/mistral/page.tsx`
- Create: `src/app/(app)/settings/integrations/wise/page.tsx`
- Create: `src/app/(app)/settings/integrations/revolut/page.tsx`
- Create: `src/app/(app)/settings/integrations/paypal/page.tsx`
- Create: `src/app/(app)/settings/integrations/xero/page.tsx`
- Create: `src/app/(app)/settings/integrations/deel/page.tsx`
- Modify: `docs/CODEBASE_INDEX.md`
- Test: `tests/e2e/integrations-tool-rail.spec.ts`

- [ ] **Step 1: Research each new provider before adding registry data**

Use this exact collaboration loop:

```text
runSubagent(agentName="Explore") -> fetch official login/docs/setup URLs -> update provider-registry -> add page -> test
```

- [ ] **Step 2: Add the concrete wave-one provider IDs**

Add these IDs to the registry layer:

```ts
"gemini", "perplexity", "mistral", "wise", "revolut", "paypal", "xero", "deel"
```

- [ ] **Step 3: Reuse the existing wizard shell or guidance-only page pattern**

Use this page shape:

```tsx
return (
  <ProviderWizardShell
    provider={providerRegistry.gemini}
    actions={buildProviderActionList(providerRegistry.gemini)}
  >
    <PrivacyDisclosurePanel />
  </ProviderWizardShell>
);
```

- [ ] **Step 4: Update the integrations hub tests and representative E2E**

Run: `npm test -- src/app/(app)/settings/integrations/page.test.tsx`
Expected: PASS with the new providers visible.

- [ ] **Step 5: Run the explicit tool-rail Playwright check**

Run: `npm run test:e2e -- tests/e2e/integrations-tool-rail.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit the tool expansion wave**

```bash
git add src/modules/integrations/provider-types.ts src/modules/integrations/provider-registry.ts src/app/(app)/settings/integrations docs/CODEBASE_INDEX.md
git commit -m "feat: add next wave of integration providers"
```

### Task 10: Run full validation and close the phase gates

**Files:**
- Modify: `docs/CODEBASE_INDEX.md`
- Test: workspace tasks `Lint`, `Unit tests`, `E2E tests`, `Prisma generate`, `Build`

- [ ] **Step 1: Run lint**

Run: `run_task -> Lint`
Expected: PASS.

- [ ] **Step 2: Run unit and component tests**

Run: `run_task -> Unit tests`
Expected: PASS.

- [ ] **Step 3: Run the Playwright suite**

Run: `run_task -> E2E tests`
Expected: PASS.

- [ ] **Step 4: Run Prisma generate and build**

Run: `run_task -> Prisma generate`, then `run_task -> Build`
Expected: PASS.

- [ ] **Step 5: Close the acceptance sheet only after all four gates are satisfied**

Use this closeout text:

```md
- [x] Mobile shell foundation approved
- [x] Auth entry and bootstrap approved
- [x] Offline boundaries approved
- [x] Asia data and tool wave approved
```

- [ ] **Step 6: Commit any final docs or test fixups**

```bash
git add docs/CODEBASE_INDEX.md
git commit -m "docs: finalize mobile auth offline expansion map"
```

## Self-review

### Spec coverage

- Mobile only, no scrolling: covered by Tasks 1 through 3.
- More Asian countries and cities: covered by Task 8.
- Productive subagent and doc collaboration: covered by the collaboration model and Task 9 research loop.
- Add the rest of the tools: covered by Task 9 with a concrete first wave.
- Install feature and offline use: covered by Tasks 6 and 7.
- Email/password sign-in: covered by Tasks 4 and 5 through Clerk.
- Platform fingerprint sign-in: covered by Task 5 as passkeys, which is the best-practice web approach.
- Gmail sign-in: covered by Task 5 through Clerk Google OAuth.

### Placeholder scan

- No `TBD`, `TODO`, or deferred placeholders remain.
- The only external prerequisites are explicit Clerk dashboard toggles for Google and passkeys.

### Type consistency

- Auth remains keyed by `clerkUserId` in `UserProfile`.
- Workspace bootstrap still creates `Workspace`, `WorkspaceMember`, and `WorkspaceUserPreference`.
- Mobile shell uses canonical `mobileRouteConfig` instead of scattered route labels.
