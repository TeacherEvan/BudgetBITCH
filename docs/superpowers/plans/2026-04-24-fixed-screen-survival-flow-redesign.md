# Fixed-Screen Survival Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved mobile-first redesign by starting the app with a feature-summary welcome screen, keeping a dedicated auth entry layer, launching a one-time popup-style startup questionnaire after login, reducing Start Smart to four survival panels, reusing one sticky home-location context across Start Smart, jobs, and dashboard, and replacing the primary calculator experience with a left-to-spend tool while preserving raw arithmetic as a secondary utility.

**Architecture:** Keep the current Next.js App Router, Prisma JSON persistence, and Auth.js Google-only wiring intact. Reuse the current root auth gate in `src/app/page.tsx`, extend the existing launch flow into a popup-style one-time startup questionnaire, add a `useSyncExternalStore`-backed home-location store in `src/modules`, add one reusable fixed-screen shell primitive in `src/components/mobile`, evolve the existing Start Smart schema and blueprint engine to accept real money-snapshot inputs, and reuse one shared left-to-spend calculation module from both Start Smart and `/calculator`. Jobs and dashboard should consume the shared home-location context through lightweight display/change affordances rather than duplicate location forms.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod, localStorage with `useSyncExternalStore`, Prisma JSON persistence, Vitest, Testing Library, Playwright.

---

## Scope check

This plan covers one coupled redesign slice inside the tracked `src/**` app:

1. Root welcome-screen content that summarizes existing feature areas.
2. A one-time post-login startup questionnaire presented as popup-style panels.
3. Fixed-screen mobile shell behavior for the primary budgeting journey.
4. A four-panel Start Smart survival flow.
5. One sticky home-location context reused across Start Smart, jobs, and dashboard.
6. A left-to-spend primary budgeting tool on `/calculator` with raw arithmetic demoted behind a secondary control.
7. Targeted unit, component, page, and Playwright updates.

Do not widen this into a desktop information architecture rewrite, auth changes, bank-sync work, or Prisma schema migration work. The current `StartSmartProfile.profileJson` and `MoneyBlueprintSnapshot.blueprintJson` fields already accept richer JSON payloads, so this redesign should stay inside application code and tests.

## Milestones

1. **Root entry:** refresh welcome copy so the signed-out screen summarizes core features clearly.
2. **Startup questionnaire:** extend the existing first-run launch flow into popup-style panels, starting with Ballpark expenses.
3. **Foundation:** add the shared home-location store, the shared left-to-spend math module, and the fixed-screen shell primitive.
4. **Start Smart:** collapse the current six-step wizard into four panels and make the survival result depend on real money snapshot inputs.
5. **Shared context:** surface the sticky home-location summary and `Change home base` affordance in dashboard and jobs.
6. **Calculator:** replace the generic calculator-first page with a left-to-spend tool and keep raw arithmetic behind a secondary reveal.
7. **Regression:** update focused Vitest and Playwright coverage, then refresh docs and run repo checks.

## File structure and responsibilities

### Shared budgeting and location domain

- Create: `src/modules/home-location/home-location-schema.ts` — validated sticky home-location contract and display-label helper.
- Create: `src/modules/home-location/home-location-store.ts` — localStorage load/save/subscribe helpers plus `useHomeLocation()`.
- Create: `src/modules/home-location/home-location-store.test.ts` — corrupted-state fallback and update propagation coverage.
- Create: `src/modules/budgeting/left-to-spend.ts` — shared budgeting math for Start Smart and calculator.
- Create: `src/modules/budgeting/left-to-spend.test.ts` — stable, tight, and at-risk money-left cases.

### Root entry and startup questionnaire

- Modify: `src/app/page.tsx` — keep welcome -> auth -> one-time startup gating explicit.
- Modify: `src/app/page.test.tsx` — cover feature-summary welcome content and first-run startup routing.
- Modify: `src/components/welcome/welcome-window.tsx` — summarize the main app feature areas in the signed-out entry surface.
- Modify: `src/components/welcome/welcome-window.test.tsx` — verify feature-summary copy remains visible and localized.
- Modify: `src/components/launch/launch-wizard.tsx` — present the first-run startup flow as popup-style panels.
- Modify: `src/components/launch/launch-wizard.test.tsx` — cover first-run popup sequencing and stored completion state.
- Modify: `src/components/launch/searchable-combobox.tsx` — support the ballpark-expense dropdown interaction if existing behavior is too narrow.
- Modify: `src/components/launch/searchable-combobox.test.tsx` — preserve dropdown search and selection behavior.
- Modify: `src/modules/launch/option-catalog.ts` — add the curated top-10 expense titles for the Ballpark expenses step.
- Modify: `src/modules/launch/option-catalog.test.ts` — verify the new expense options stay stable.

### Fixed-screen shell primitives

- Create: `src/components/mobile/fixed-screen-shell.tsx` — reusable header / active panel / action bar layout with no page scroll.
- Create: `src/components/mobile/fixed-screen-shell.test.tsx` — layout contract and action-bar visibility checks.
- Modify: `src/components/mobile/mobile-app-shell.tsx` — keep the shell full-height and safe for child fixed-screen surfaces.
- Modify: `src/components/mobile/mobile-app-shell.test.tsx` — preserve nav contract while allowing full-height content.
- Modify: `src/components/mobile/mobile-panel-frame.tsx` — support fixed-height children without introducing extra overflow.

### Start Smart survival flow

- Modify: `src/app/(app)/start-smart/page.tsx` — accept an optional `panel` query param and render the redesigned shell.
- Modify: `src/app/(app)/start-smart/page.test.tsx` — assert the new four-panel entry state instead of the old step map.
- Modify: `src/components/start-smart/start-smart-shell.tsx` — rewrite as a fixed-screen controller.
- Modify: `src/components/start-smart/start-smart-shell.test.tsx` — cover panel transitions, stored location prefill, and survival result rendering.
- Create: `src/components/start-smart/panels/lane-panel.tsx` — 2 to 4 lane-choice buttons.
- Create: `src/components/start-smart/panels/home-base-panel.tsx` — compact country / region / optional city panel tied to sticky home location.
- Create: `src/components/start-smart/panels/money-snapshot-panel.tsx` — minimum numeric inputs for the first survival answer.
- Modify: `src/components/start-smart/blueprint-panel.tsx` — compact survival result hierarchy: status, money-left cue, top risk, next seven days, primary action.
- Modify: `src/components/start-smart/blueprint-panel.test.tsx` — keep lesson links and add survival-result assertions.
- Modify: `src/modules/start-smart/wizard-machine.ts` — reduce the step contract to four panels.
- Modify: `src/modules/start-smart/wizard-machine.test.ts` — remove six-step assumptions.
- Modify: `src/modules/start-smart/profile-schema.ts` — add validated money-snapshot inputs.
- Modify: `src/modules/start-smart/profile-schema.test.ts` — cover numeric normalization and retained region support.
- Modify: `src/modules/start-smart/blueprint-engine.ts` — reuse left-to-spend math and emit survival-result cues.
- Modify: `src/modules/start-smart/blueprint-engine.test.ts` — assert new result fields.
- Modify: `src/app/api/v1/start-smart/blueprint/route.ts` — accept the richer answers contract and persist it unchanged.
- Modify: `src/app/api/v1/start-smart/blueprint/route.test.ts` — cover the new money-snapshot payload.

### Shared home-location reuse on dashboard and jobs

- Create: `src/components/home-location/home-location-summary.tsx` — client display component with fallback label and `Change home base` action.
- Create: `src/components/home-location/home-location-summary.test.tsx` — sticky-location label and fallback coverage.
- Modify: `src/components/dashboard/broadcast-bar.tsx` — swap hard-coded city output for the shared summary contract.
- Modify: `src/components/dashboard/broadcast-bar.test.tsx` — assert the current home-base label and ticker copy.
- Modify: `src/app/(app)/dashboard/page.tsx` — pass fallback location text only; let the client summary own sticky overrides.
- Modify: `src/app/(app)/dashboard/page.test.tsx` — keep billboard assertions and add home-base summary coverage.
- Modify: `src/modules/dashboard/dashboard-data.ts` — rename fallback location fields so they describe home-base context instead of launch-only city state.
- Modify: `src/components/jobs/jobs-filter-panel.tsx` — add a compact home-base summary row without turning the jobs board into a long narrative block.
- Modify: `src/components/jobs/job-card.test.tsx` — preserve the scan-first job-card contract while jobs-surface copy changes around it.
- Modify: `src/app/(app)/jobs/page.tsx` — pass fallback home-base text into the jobs filter summary.
- Modify: `src/app/(app)/jobs/page.test.tsx` — assert the shared home-base summary and explicit change action.

### Calculator replacement

- Create: `src/components/calculator/raw-calculator.tsx` — extracted raw arithmetic utility using the current keypad logic.
- Create: `src/components/calculator/raw-calculator.test.tsx` — raw arithmetic regression coverage.
- Modify: `src/components/calculator/calculator.tsx` — turn the primary surface into the left-to-spend tool.
- Modify: `src/components/calculator/calculator.test.tsx` — assert budgeting-first behavior and secondary raw calculator reveal.
- Modify: `src/app/(app)/calculator/page.tsx` — update copy and shell usage around the new tool.
- Modify: `src/app/(app)/calculator/page.test.tsx` — assert the new heading and budgeting region.
- Modify: `src/modules/dashboard/dashboard-data.ts` — rename the launcher tile copy to match the new tool.
- Modify: `src/components/dashboard/launcher-grid.test.tsx` — preserve the explicit CTA label after tool copy changes.
- Modify: `tests/e2e/calculator.spec.ts` — cover the left-to-spend result and raw arithmetic fallback.

### End-to-end and docs

- Modify: `tests/e2e/welcome-auth.spec.ts` — verify the welcome screen lists the main features and routes first-run users into startup only after auth.
- Modify: `tests/e2e/start-smart.spec.ts` — verify a survival result appears inside the visible viewport without page scroll.
- Modify: `tests/e2e/jobs.spec.ts` — verify the jobs surface reads the sticky home base.
- Modify: `tests/e2e/dashboard.spec.ts` — verify the dashboard reads the sticky home base.
- Modify: `tests/e2e/launch-profile.ts` — seed the new home-location storage key in E2E setup.
- Modify: `README.md` — update the product-shape summary and testing notes.
- Modify: `docs/CODEBASE_INDEX.md` — add the new home-location and budgeting domain modules.
- Modify: `docs/DEV_TREE.md` — reflect the new fixed-screen shell and Start Smart panel structure.

## Risk notes

- **Risk: the startup questionnaire overlaps awkwardly with Start Smart and creates two competing onboarding flows.**
  Mitigation: keep the startup sequence intentionally lighter, scoped to first-login essentials like ballpark expenses, while Start Smart remains the deeper survival-planning flow.

- **Risk: the ballpark-expense popup grows into a long data-entry form.**
  Mitigation: cap the first version to a curated top-10 category list, rough amount entry, and repeated popup-based capture instead of a full spreadsheet.

- **Risk: mobile `100vh` and keyboard behavior still cause clipped content.**
  Mitigation: use `100dvh`, keep the active panel `min-h-0`, and split content into more panels before allowing any page scroll.

- **Risk: a client-only home-location store fights server-rendered dashboard and jobs content.**
  Mitigation: keep server components on fallback labels and isolate sticky overrides inside small client components.

- **Risk: Start Smart becomes visually shorter but still fails to deliver a useful survival answer.**
  Mitigation: add real numeric money-snapshot fields and route both Start Smart and `/calculator` through the same left-to-spend domain math.

- **Risk: jobs UI drifts away from the repo’s scan-first contract.**
  Mitigation: keep the new home-base context in the filter summary area, not inside long card prose, and retain the explicit `Open job details` CTA.

- **Risk: existing raw calculator users lose utility.**
  Mitigation: extract the current keypad into `raw-calculator.tsx` and keep it behind an explicit secondary reveal instead of deleting it.

- **Risk: corrupted local storage breaks the redesign.**
  Mitigation: validate both the home-location store and the calculator draft store with Zod or equivalent guards and fall back to safe defaults.

## Focused validation matrix

- Root entry and startup questionnaire: `npm test -- src/app/page.test.tsx src/components/welcome/welcome-window.test.tsx src/components/launch/launch-wizard.test.tsx src/components/launch/searchable-combobox.test.tsx src/modules/launch/option-catalog.test.ts`
- Shared domain: `npm test -- src/modules/home-location/home-location-store.test.ts src/modules/budgeting/left-to-spend.test.ts`
- Fixed-screen shell: `npm test -- src/components/mobile/fixed-screen-shell.test.tsx src/components/mobile/mobile-app-shell.test.tsx`
- Start Smart: `npm test -- src/modules/start-smart/wizard-machine.test.ts src/modules/start-smart/profile-schema.test.ts src/modules/start-smart/blueprint-engine.test.ts src/components/start-smart/start-smart-shell.test.tsx src/components/start-smart/blueprint-panel.test.tsx src/app/api/v1/start-smart/blueprint/route.test.ts src/app/(app)/start-smart/page.test.tsx`
- Shared home base on dashboard and jobs: `npm test -- src/components/home-location/home-location-summary.test.tsx src/components/dashboard/broadcast-bar.test.tsx src/app/(app)/dashboard/page.test.tsx src/components/jobs/job-card.test.tsx src/app/(app)/jobs/page.test.tsx`
- Calculator: `npm test -- src/modules/budgeting/left-to-spend.test.ts src/components/calculator/raw-calculator.test.tsx src/components/calculator/calculator.test.tsx src/app/(app)/calculator/page.test.tsx src/components/dashboard/launcher-grid.test.tsx`
- Playwright redesign slice: `npx playwright test tests/e2e/start-smart.spec.ts tests/e2e/calculator.spec.ts tests/e2e/jobs.spec.ts tests/e2e/dashboard.spec.ts --project=chromium --workers=1`
- Final repo checks: `npm run lint && npm test && npm run build`

---

### Task 0: Baseline and guardrails

**Files:**

- Modify: `docs/superpowers/plans/2026-04-24-fixed-screen-survival-flow-redesign.md`
- Test: `tests/e2e/start-smart.spec.ts`
- Test: `tests/e2e/calculator.spec.ts`
- Test: `tests/e2e/jobs.spec.ts`
- Test: `tests/e2e/dashboard.spec.ts`

- [ ] **Step 1: Confirm the current baseline before feature work starts**

Run: `npm run lint`
Expected: PASS.

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Capture the redesign guardrails in the implementation log or PR body**

Use this checklist text:

```md
- [ ] Root welcome screen summarizes core features before auth
- [ ] Login and sign-up stay a dedicated auth entry layer
- [ ] First-login users see a one-time popup-style startup questionnaire before the normal landing state
- [ ] Startup questionnaire begins with Ballpark expenses and uses a curated top-10 expense list
- [ ] No page-level scroll on the primary mobile budgeting journey
- [ ] Start Smart is exactly four panels: lane, home base, money snapshot, survival plan
- [ ] Sticky home-location state is validated and reused across Start Smart, jobs, and dashboard
- [ ] `/calculator` leads with left-to-spend and keeps raw arithmetic as a secondary reveal
- [ ] Jobs cards stay scan-first and keep the explicit `Open job details` CTA
- [ ] No Prisma migration is introduced for this redesign
```

- [ ] **Step 3: Run the current focused Playwright slice once so regressions have a known baseline**

Run: `npx playwright test tests/e2e/start-smart.spec.ts tests/e2e/calculator.spec.ts tests/e2e/jobs.spec.ts tests/e2e/dashboard.spec.ts --project=chromium --workers=1`
Expected: Current tests pass before the redesign begins.

### Task 1: Refresh root entry and add the first startup questionnaire popup

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `src/components/welcome/welcome-window.tsx`
- Modify: `src/components/welcome/welcome-window.test.tsx`
- Modify: `src/components/launch/launch-wizard.tsx`
- Modify: `src/components/launch/launch-wizard.test.tsx`
- Modify: `src/components/launch/searchable-combobox.tsx`
- Modify: `src/components/launch/searchable-combobox.test.tsx`
- Modify: `src/modules/launch/option-catalog.ts`
- Modify: `src/modules/launch/option-catalog.test.ts`

- [ ] **Step 1: Expand the welcome surface into a feature-summary entry screen**

Update the signed-out root entry so it explicitly lists the current feature areas already present in the app.

The welcome summary should name practical surfaces such as:

- Dashboard
- Start Smart
- Calculator
- Notes
- Learn
- Jobs
- Integrations

- [ ] **Step 2: Keep auth separate from the startup questionnaire**

Do not collapse the welcome screen and sign-in screen into one page. The root welcome stays public, `/sign-in` remains the Google-only auth entry, and the startup questionnaire starts only after auth and first-run detection succeed.

- [ ] **Step 3: Add the first popup panel for Ballpark expenses**

Extend the existing startup or launch wizard with a popup-style Ballpark expenses step.

The first version should offer these ten expense titles:

- Rent or mortgage
- Groceries
- Utilities
- Transport or fuel
- Phone or internet
- Insurance
- Debt payments
- Healthcare
- Childcare or family support
- Fun or entertainment

Behavior:

- Let the user choose a title from a dropdown or searchable combobox.
- Let the user enter a rough amount for that title.
- Allow repeated entry for more than one category during the same startup session.
- Persist enough validated local state so the questionnaire is still one-time and recoverable after refresh.

- [ ] **Step 4: Run the focused welcome/startup validation slice**

Run: `npm test -- src/app/page.test.tsx src/components/welcome/welcome-window.test.tsx src/components/launch/launch-wizard.test.tsx src/components/launch/searchable-combobox.test.tsx src/modules/launch/option-catalog.test.ts`
Expected: PASS.

### Task 2: Add the shared home-location store and shared budgeting math

**Files:**

- Create: `src/modules/home-location/home-location-schema.ts`
- Create: `src/modules/home-location/home-location-store.ts`
- Create: `src/modules/home-location/home-location-store.test.ts`
- Create: `src/modules/budgeting/left-to-spend.ts`
- Create: `src/modules/budgeting/left-to-spend.test.ts`

- [ ] **Step 1: Write the failing shared-domain tests first**

Create `src/modules/home-location/home-location-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearHomeLocation,
  loadHomeLocation,
  saveHomeLocation,
} from "./home-location-store";

describe("home-location-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null for corrupted storage and clears the bad payload", () => {
    window.localStorage.setItem("budgetbitch:home-location", JSON.stringify({ nope: true }));

    expect(loadHomeLocation()).toBeNull();
    expect(window.localStorage.getItem("budgetbitch:home-location")).toBeNull();
  });

  it("persists and reloads a valid home location", () => {
    saveHomeLocation({
      countryCode: "US",
      stateCode: "CA",
      city: "Oakland",
    });

    expect(loadHomeLocation()).toMatchObject({
      countryCode: "US",
      stateCode: "CA",
      city: "Oakland",
      label: "Oakland, CA, US",
    });

    clearHomeLocation();
    expect(loadHomeLocation()).toBeNull();
  });
});
```

Create `src/modules/budgeting/left-to-spend.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildLeftToSpendPlan } from "./left-to-spend";

describe("buildLeftToSpendPlan", () => {
  it("marks a user stable when money left stays comfortably positive", () => {
    expect(
      buildLeftToSpendPlan({
        moneyIn: 3200,
        fixedBills: 1450,
        plannedEssentials: 550,
        cashOnHand: 400,
      }),
    ).toMatchObject({
      status: "stable",
      safeToSpend: 1200,
    });
  });

  it("marks a user at risk when essentials outrun money in", () => {
    expect(
      buildLeftToSpendPlan({
        moneyIn: 1700,
        fixedBills: 1300,
        plannedEssentials: 500,
        cashOnHand: 40,
      }),
    ).toMatchObject({
      status: "at_risk",
      safeToSpend: 0,
      topRisk: "Bills and essentials are outrunning this cycle's money in.",
    });
  });
});
```

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `npm test -- src/modules/home-location/home-location-store.test.ts src/modules/budgeting/left-to-spend.test.ts`
Expected: FAIL because the new modules do not exist yet.

- [ ] **Step 3: Implement the validated sticky home-location contract**

Create `src/modules/home-location/home-location-schema.ts`:

```ts
import { z } from "zod";

export const HOME_LOCATION_STORAGE_KEY = "budgetbitch:home-location";

export const homeLocationSchema = z.object({
  countryCode: z.string().trim().length(2),
  stateCode: z.string().trim().min(2).max(3),
  city: z.string().trim().min(1).max(80).optional().nullable(),
  updatedAt: z.string().datetime().optional(),
});

export type HomeLocationInput = z.input<typeof homeLocationSchema>;
export type HomeLocation = z.infer<typeof homeLocationSchema> & { label: string };

export function formatHomeLocationLabel(input: {
  countryCode: string;
  stateCode: string;
  city?: string | null;
}) {
  const parts = [input.city?.trim(), input.stateCode.toUpperCase(), input.countryCode.toUpperCase()].filter(
    Boolean,
  );

  return parts.join(", ");
}
```

Create `src/modules/home-location/home-location-store.ts`:

```ts
import { useSyncExternalStore } from "react";
import {
  HOME_LOCATION_STORAGE_KEY,
  formatHomeLocationLabel,
  homeLocationSchema,
  type HomeLocation,
  type HomeLocationInput,
} from "./home-location-schema";

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function loadHomeLocation(): HomeLocation | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(HOME_LOCATION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = homeLocationSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      window.localStorage.removeItem(HOME_LOCATION_STORAGE_KEY);
      return null;
    }

    return {
      ...parsed.data,
      label: formatHomeLocationLabel(parsed.data),
    };
  } catch {
    window.localStorage.removeItem(HOME_LOCATION_STORAGE_KEY);
    return null;
  }
}

export function saveHomeLocation(input: HomeLocationInput) {
  const normalized = homeLocationSchema.parse({
    ...input,
    countryCode: input.countryCode.toUpperCase(),
    stateCode: input.stateCode.toUpperCase(),
    updatedAt: new Date().toISOString(),
  });

  window.localStorage.setItem(HOME_LOCATION_STORAGE_KEY, JSON.stringify(normalized));
  emitChange();
}

export function clearHomeLocation() {
  window.localStorage.removeItem(HOME_LOCATION_STORAGE_KEY);
  emitChange();
}

export function useHomeLocation() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      window.addEventListener("storage", listener);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", listener);
      };
    },
    loadHomeLocation,
    () => null,
  );
}
```

- [ ] **Step 4: Implement the shared left-to-spend math**

Create `src/modules/budgeting/left-to-spend.ts`:

```ts
export type LeftToSpendInput = {
  moneyIn: number;
  fixedBills: number;
  plannedEssentials: number;
  cashOnHand: number;
};

export type LeftToSpendPlan = {
  status: "stable" | "tight" | "at_risk";
  safeToSpend: number;
  survivalGap: number;
  topRisk: string;
  primaryAction: string;
};

export function buildLeftToSpendPlan(input: LeftToSpendInput): LeftToSpendPlan {
  const fixedCommitments = input.fixedBills + input.plannedEssentials;
  const rawLeft = input.moneyIn - fixedCommitments;
  const safeToSpend = Math.max(0, rawLeft);
  const survivalGap = input.cashOnHand + rawLeft;

  if (rawLeft < 0) {
    return {
      status: "at_risk",
      safeToSpend,
      survivalGap,
      topRisk: "Bills and essentials are outrunning this cycle's money in.",
      primaryAction: "Trim a bill before adding extras.",
    };
  }

  if (safeToSpend < 250) {
    return {
      status: "tight",
      safeToSpend,
      survivalGap,
      topRisk: "There is very little flex left after essentials.",
      primaryAction: "Pause extras and protect the next seven days.",
    };
  }

  return {
    status: "stable",
    safeToSpend,
    survivalGap,
    topRisk: "Essentials are covered, so the next risk is discretionary creep.",
    primaryAction: "Build today's plan before optional spending grows.",
  };
}
```

- [ ] **Step 5: Re-run the focused shared-domain tests**

Run: `npm test -- src/modules/home-location/home-location-store.test.ts src/modules/budgeting/left-to-spend.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the shared domain foundation**

```bash
git add src/modules/home-location src/modules/budgeting
git commit -m "feat: add shared home location and budget math"
```

### Task 2: Add the reusable fixed-screen shell primitive

**Files:**

- Create: `src/components/mobile/fixed-screen-shell.tsx`
- Create: `src/components/mobile/fixed-screen-shell.test.tsx`
- Modify: `src/components/mobile/mobile-app-shell.tsx`
- Modify: `src/components/mobile/mobile-app-shell.test.tsx`
- Modify: `src/components/mobile/mobile-panel-frame.tsx`

- [ ] **Step 1: Write the failing shell contract tests first**

Create `src/components/mobile/fixed-screen-shell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { FixedScreenShell } from "./fixed-screen-shell";

describe("FixedScreenShell", () => {
  it("renders a fixed header, active panel region, and action bar", () => {
    render(
      <FixedScreenShell
        eyebrow="Start Smart"
        title="Get a survival answer fast"
        actionBar={<button type="button">Next</button>}
      >
        <div>Panel body</div>
      </FixedScreenShell>,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText("Panel body")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  });
});
```

Extend `src/components/mobile/mobile-app-shell.test.tsx` with:

```tsx
it("keeps the mobile shell content in a min-height zero container for fixed-screen routes", () => {
  const { container } = render(<MobileAppShell>panel</MobileAppShell>);

  expect(container.querySelector('[data-slot="mobile-shell-content"]')).toHaveClass("min-h-0");
});
```

- [ ] **Step 2: Run the focused shell tests to verify failure**

Run: `npm test -- src/components/mobile/fixed-screen-shell.test.tsx src/components/mobile/mobile-app-shell.test.tsx`
Expected: FAIL because the new shell component does not exist yet.

- [ ] **Step 3: Implement the fixed-screen shell and height-safe app shell changes**

Create `src/components/mobile/fixed-screen-shell.tsx`:

```tsx
import type { ReactNode } from "react";

type FixedScreenShellProps = {
  eyebrow: string;
  title: string;
  contextSlot?: ReactNode;
  actionBar: ReactNode;
  children: ReactNode;
};

export function FixedScreenShell({
  eyebrow,
  title,
  contextSlot,
  actionBar,
  children,
}: FixedScreenShellProps) {
  return (
    <section
      data-testid="fixed-screen-shell"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-black/20"
    >
      <header className="shrink-0 border-b border-white/10 px-5 py-4" role="banner">
        <p className="text-xs uppercase tracking-[0.24em] text-yellow-200">{eyebrow}</p>
        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {contextSlot}
        </div>
      </header>

      <div className="min-h-0 flex-1 px-5 py-4">{children}</div>

      <footer className="shrink-0 border-t border-white/10 px-5 py-4" role="contentinfo">
        {actionBar}
      </footer>
    </section>
  );
}
```

Modify `src/components/mobile/mobile-app-shell.tsx`:

```tsx
export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div className="bb-mobile-shell flex h-dvh min-h-0 flex-col overflow-hidden bg-[rgba(8,21,18,0.96)] text-white md:h-screen md:bg-transparent">
      <AppNav />
      <div
        className="bb-mobile-content min-h-0 flex-1 overflow-hidden"
        data-slot="mobile-shell-content"
      >
        {children}
      </div>
    </div>
  );
}
```

Modify `src/components/mobile/mobile-panel-frame.tsx`:

```tsx
export function MobilePanelFrame({
  children,
  className,
  panelClassName,
}: MobilePanelFrameProps) {
  return (
    <div
      data-testid="mobile-panel-frame"
      className={joinClassNames("h-full min-h-0 md:contents", className)}
    >
      <div className={joinClassNames("h-full min-h-0 md:contents", panelClassName)}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Re-run the shell tests**

Run: `npm test -- src/components/mobile/fixed-screen-shell.test.tsx src/components/mobile/mobile-app-shell.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit the shell primitive**

```bash
git add src/components/mobile
git commit -m "feat: add fixed screen mobile shell"
```

### Task 3: Rebuild Start Smart as a four-panel survival flow

**Files:**

- Modify: `src/modules/start-smart/wizard-machine.ts`
- Modify: `src/modules/start-smart/wizard-machine.test.ts`
- Modify: `src/modules/start-smart/profile-schema.ts`
- Modify: `src/modules/start-smart/profile-schema.test.ts`
- Modify: `src/modules/start-smart/blueprint-engine.ts`
- Modify: `src/modules/start-smart/blueprint-engine.test.ts`
- Modify: `src/app/api/v1/start-smart/blueprint/route.ts`
- Modify: `src/app/api/v1/start-smart/blueprint/route.test.ts`
- Create: `src/components/start-smart/panels/lane-panel.tsx`
- Create: `src/components/start-smart/panels/home-base-panel.tsx`
- Create: `src/components/start-smart/panels/money-snapshot-panel.tsx`
- Modify: `src/components/start-smart/blueprint-panel.tsx`
- Modify: `src/components/start-smart/blueprint-panel.test.tsx`
- Modify: `src/components/start-smart/start-smart-shell.tsx`
- Modify: `src/components/start-smart/start-smart-shell.test.tsx`
- Modify: `src/app/(app)/start-smart/page.tsx`
- Modify: `src/app/(app)/start-smart/page.test.tsx`

- [ ] **Step 1: Write the failing Start Smart tests against the new panel contract**

Replace `src/modules/start-smart/wizard-machine.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { nextWizardStep, previousWizardStep } from "./wizard-machine";

describe("start-smart wizard machine", () => {
  it("moves through the four survival panels only", () => {
    expect(nextWizardStep("lane")).toBe("home_base");
    expect(nextWizardStep("home_base")).toBe("money_snapshot");
    expect(nextWizardStep("money_snapshot")).toBe("survival_plan");
    expect(nextWizardStep("survival_plan")).toBe("survival_plan");
  });

  it("moves backward without reintroducing the old review step", () => {
    expect(previousWizardStep("survival_plan")).toBe("money_snapshot");
    expect(previousWizardStep("money_snapshot")).toBe("home_base");
  });
});
```

Update `src/components/start-smart/start-smart-shell.test.tsx` to cover the new flow:

```tsx
it("prefills the home base from sticky storage and renders a survival result", async () => {
  window.localStorage.setItem(
    "budgetbitch:home-location",
    JSON.stringify({ countryCode: "US", stateCode: "CA", city: "Oakland", updatedAt: "2026-04-24T12:00:00.000Z" }),
  );

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        blueprint: {
          priorityStack: ["cover_essentials"],
          riskWarnings: ["income_volatility_risk"],
          next7Days: ["Pause extras for one week"],
          next30Days: ["Rebuild a starter buffer"],
          learnModuleKeys: ["budgeting_basics"],
          recommendedIntegrations: ["openai"],
          currentStatus: "tight",
          moneyLeftCue: "$180 safe to spend",
          topRisk: "Rent is leaving almost no flex",
          primaryAction: "Pause extras and protect the next seven days.",
        },
        regional: { housing: { confidence: "verified" } },
      }),
    }),
  );

  render(<StartSmartShell />);

  fireEvent.click(screen.getByRole("button", { name: /young adult/i }));
  expect(screen.getByLabelText(/^country$/i)).toHaveValue("US");
  expect(screen.getByLabelText(/state or region/i)).toHaveValue("CA");

  fireEvent.click(screen.getByRole("button", { name: /continue to money snapshot/i }));
  fireEvent.change(screen.getByLabelText(/money in/i), { target: { value: "2400" } });
  fireEvent.change(screen.getByLabelText(/fixed bills/i), { target: { value: "1220" } });
  fireEvent.change(screen.getByLabelText(/cash on hand/i), { target: { value: "160" } });
  fireEvent.click(screen.getByRole("button", { name: /show my survival plan/i }));

  expect(await screen.findByText(/\$180 safe to spend/i)).toBeInTheDocument();
  expect(screen.getByText(/pause extras and protect the next seven days/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused Start Smart tests to verify failure**

Run: `npm test -- src/modules/start-smart/wizard-machine.test.ts src/modules/start-smart/profile-schema.test.ts src/modules/start-smart/blueprint-engine.test.ts src/components/start-smart/start-smart-shell.test.tsx src/components/start-smart/blueprint-panel.test.tsx src/app/api/v1/start-smart/blueprint/route.test.ts src/app/(app)/start-smart/page.test.tsx`
Expected: FAIL because the current six-step flow, schema, and result shape do not match.

- [ ] **Step 3: Evolve the Start Smart schema and engine so the flow produces a real survival answer**

Modify `src/modules/start-smart/wizard-machine.ts`:

```ts
export const startSmartWizardSteps = [
  "lane",
  "home_base",
  "money_snapshot",
  "survival_plan",
] as const;
```

Modify `src/modules/start-smart/profile-schema.ts` to add the minimum numeric snapshot:

```ts
export const startSmartProfileSchema = z.object({
  countryCode: z.string().trim().length(2, "Enter a valid 2-letter country code."),
  stateCode: z.string().trim().min(2, "Enter a valid 2- or 3-character state or region code.").max(3, "Enter a valid 2- or 3-character state or region code."),
  ageBand: z.enum(["single_teen", "young_adult", "adult", "retiree"]),
  housing: z.enum(["living_with_family", "renting", "owning", "temporary", "housing_insecure"]),
  adults: z.number().int().min(1).default(1),
  dependents: z.number().int().min(0),
  pets: z.number().int().min(0),
  incomePattern: z.enum(["steady", "variable", "seasonal", "none"]),
  debtLoad: z.enum(["none", "low", "moderate", "high"]),
  monthlyIncome: z.coerce.number().min(0),
  fixedBillsTotal: z.coerce.number().min(0),
  cashOnHand: z.coerce.number().min(0),
  goals: z.array(goalSchema).min(1),
  benefitsSupport: z.array(z.string()).default([]),
  preferredIntegrations: z.array(providerPreferenceSchema).default([]),
});
```

Modify `src/modules/start-smart/blueprint-engine.ts` to reuse the new budget math:

```ts
import { buildLeftToSpendPlan } from "@/modules/budgeting/left-to-spend";

const budgetSignal = buildLeftToSpendPlan({
  moneyIn: profile.monthlyIncome,
  fixedBills: profile.fixedBillsTotal,
  plannedEssentials: essentialMonthly,
  cashOnHand: profile.cashOnHand,
});

return {
  regionKey: regional.regionKey,
  essentialCategories: essentials,
  optionalCategories,
  priorityStack,
  riskWarnings,
  emergencyTarget,
  debtPressureSummary,
  next7Days: recommendationSet.next7Days,
  next30Days: recommendationSet.next30Days,
  recommendedIntegrations: recommendationSet.recommendedIntegrations,
  learnModuleKeys: recommendationSet.learnModuleKeys,
  appliedRuleIds: recommendationSet.appliedRuleIds,
  currentStatus: budgetSignal.status,
  moneyLeftCue: `$${budgetSignal.safeToSpend} safe to spend`,
  topRisk: budgetSignal.topRisk,
  primaryAction: budgetSignal.primaryAction,
};
```

- [ ] **Step 4: Rebuild the Start Smart UI around the fixed-screen shell**

Create `src/components/start-smart/panels/home-base-panel.tsx`:

```tsx
import { countryOptions } from "@/modules/start-smart/country-options";
import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";

type HomeBasePanelProps = {
  values: Pick<StartSmartProfileInput, "countryCode" | "stateCode"> & { city?: string };
  onChange: (field: "countryCode" | "stateCode" | "city", value: string) => void;
};

export function HomeBasePanel({ values, onChange }: HomeBasePanelProps) {
  return (
    <section className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Country</span>
        <select value={values.countryCode} onChange={(event) => onChange("countryCode", event.target.value)}>
          <option value="">Select a country</option>
          {countryOptions.map((option) => (
            <option key={option.code} value={option.code}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">State or region</span>
        <input value={values.stateCode} onChange={(event) => onChange("stateCode", event.target.value.toUpperCase())} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">City (optional)</span>
        <input value={values.city ?? ""} onChange={(event) => onChange("city", event.target.value)} />
      </label>
    </section>
  );
}
```

Modify `src/components/start-smart/start-smart-shell.tsx` around the new controller shape:

```tsx
const [step, setStep] = useState<StartSmartWizardStep>(initialPanel ?? "lane");
const homeLocation = useHomeLocation();
const [values, setValues] = useState<StartSmartProfileInput>(() => ({
  ...mergeTemplateIntoProfile("single_teen"),
  monthlyIncome: 0,
  fixedBillsTotal: 0,
  cashOnHand: 0,
  countryCode: homeLocation?.countryCode ?? "",
  stateCode: homeLocation?.stateCode ?? "",
}));

function handleHomeBaseContinue() {
  saveHomeLocation({
    countryCode: values.countryCode,
    stateCode: values.stateCode,
    city: draftCity,
  });
  setStep("money_snapshot");
}

return (
  <main className="h-full min-h-0 px-4 py-4 text-white">
    <FixedScreenShell
      eyebrow="Start Smart"
      title="Get a survival answer without the setup sprawl."
      contextSlot={<Link href="/start-smart?panel=home-base" className="bb-button-ghost text-sm">Change home base</Link>}
      actionBar={renderActionBar(step)}
    >
      {renderCurrentPanel(step)}
    </FixedScreenShell>
  </main>
);
```

Modify `src/components/start-smart/blueprint-panel.tsx` so the result hierarchy matches the spec:

```tsx
<section className="grid gap-4 rounded-[28px] border border-emerald-300/20 bg-emerald-400/10 p-5 text-white">
  <div>
    <p className="text-xs uppercase tracking-[0.24em] text-yellow-200">Current status</p>
    <h2 className="mt-2 text-2xl font-semibold capitalize">{blueprint.currentStatus}</h2>
  </div>

  <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">Money left cue</p>
    <p className="mt-2 text-3xl font-semibold text-white">{blueprint.moneyLeftCue}</p>
  </article>

  <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">Immediate risk</p>
    <p className="mt-2 text-sm text-emerald-50/90">{blueprint.topRisk}</p>
  </article>

  <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">Next seven days</p>
    <ul className="mt-3 grid gap-2 text-sm text-emerald-50/90">
      {blueprint.next7Days.map((item) => <li key={item}>{item}</li>)}
    </ul>
  </article>

  <button type="button" className="bb-button-primary w-full">{blueprint.primaryAction}</button>
</section>
```

- [ ] **Step 5: Re-run the focused Start Smart tests**

Run: `npm test -- src/modules/start-smart/wizard-machine.test.ts src/modules/start-smart/profile-schema.test.ts src/modules/start-smart/blueprint-engine.test.ts src/components/start-smart/start-smart-shell.test.tsx src/components/start-smart/blueprint-panel.test.tsx src/app/api/v1/start-smart/blueprint/route.test.ts src/app/(app)/start-smart/page.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit the Start Smart redesign slice**

```bash
git add src/modules/start-smart src/components/start-smart src/app/api/v1/start-smart/blueprint src/app/'(app)'/start-smart
git commit -m "feat: redesign start smart as survival flow"
```

### Task 4: Reuse the sticky home base on dashboard and jobs

**Files:**

- Create: `src/components/home-location/home-location-summary.tsx`
- Create: `src/components/home-location/home-location-summary.test.tsx`
- Modify: `src/components/dashboard/broadcast-bar.tsx`
- Modify: `src/components/dashboard/broadcast-bar.test.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/dashboard/page.test.tsx`
- Modify: `src/modules/dashboard/dashboard-data.ts`
- Modify: `src/components/jobs/jobs-filter-panel.tsx`
- Modify: `src/components/jobs/job-card.test.tsx`
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/app/(app)/jobs/page.test.tsx`

- [ ] **Step 1: Write the failing shared-context UI tests first**

Create `src/components/home-location/home-location-summary.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { HomeLocationSummary } from "./home-location-summary";

describe("HomeLocationSummary", () => {
  it("shows the sticky home base when it exists", () => {
    window.localStorage.setItem(
      "budgetbitch:home-location",
      JSON.stringify({ countryCode: "US", stateCode: "CA", city: "Oakland", updatedAt: "2026-04-24T12:00:00.000Z" }),
    );

    render(<HomeLocationSummary fallbackLabel="Local area" />);

    expect(screen.getByText("Oakland, CA, US")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /change home base/i })).toHaveAttribute(
      "href",
      "/start-smart?panel=home-base",
    );
  });
});
```

Extend `src/app/(app)/jobs/page.test.tsx` with:

```tsx
expect(screen.getByText("Home base")).toBeInTheDocument();
expect(screen.getByRole("link", { name: /change home base/i })).toHaveAttribute(
  "href",
  "/start-smart?panel=home-base",
);
```

- [ ] **Step 2: Run the focused dashboard/jobs tests to verify failure**

Run: `npm test -- src/components/home-location/home-location-summary.test.tsx src/components/dashboard/broadcast-bar.test.tsx src/app/(app)/dashboard/page.test.tsx src/components/jobs/job-card.test.tsx src/app/(app)/jobs/page.test.tsx`
Expected: FAIL because the shared home-base UI does not exist yet.

- [ ] **Step 3: Implement the reusable home-base summary and wire it into dashboard and jobs**

Create `src/components/home-location/home-location-summary.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useHomeLocation } from "@/modules/home-location/home-location-store";

type HomeLocationSummaryProps = {
  fallbackLabel: string;
};

export function HomeLocationSummary({ fallbackLabel }: HomeLocationSummaryProps) {
  const homeLocation = useHomeLocation();
  const label = homeLocation?.label ?? fallbackLabel;

  return (
    <div className="grid gap-2">
      <p className="bb-mini-copy text-sm text-white/90">{label}</p>
      <Link href="/start-smart?panel=home-base" className="bb-button-ghost w-fit px-3 py-1.5 text-xs font-semibold">
        Change home base
      </Link>
    </div>
  );
}
```

Modify `src/components/dashboard/broadcast-bar.tsx`:

```tsx
import { HomeLocationSummary } from "@/components/home-location/home-location-summary";

type BroadcastBarProps = {
  fallbackLabel: string;
  tickerItems: string[];
};

// inside the component
<div>
  <p className="bb-kicker">Home base</p>
  <h2 id="local-area-heading" className="mt-1 text-2xl font-semibold">Home base</h2>
  <HomeLocationSummary fallbackLabel={fallbackLabel} />
</div>
```

Modify `src/components/jobs/jobs-filter-panel.tsx`:

```tsx
import { HomeLocationSummary } from "@/components/home-location/home-location-summary";

type JobsFilterPanelProps = {
  filters: JobSearchFilters;
  jobCount: number;
  laneCount: number;
  fallbackHomeBaseLabel: string;
};

<div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
  <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/70">Home base</p>
  <div className="mt-3">
    <HomeLocationSummary fallbackLabel={fallbackHomeBaseLabel} />
  </div>
</div>
```

- [ ] **Step 4: Re-run the focused dashboard/jobs tests**

Run: `npm test -- src/components/home-location/home-location-summary.test.tsx src/components/dashboard/broadcast-bar.test.tsx src/app/(app)/dashboard/page.test.tsx src/components/jobs/job-card.test.tsx src/app/(app)/jobs/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit the shared home-base surface work**

```bash
git add src/components/home-location src/components/dashboard src/components/jobs src/modules/dashboard src/app/'(app)'/dashboard src/app/'(app)'/jobs
git commit -m "feat: reuse sticky home base across jobs and dashboard"
```

### Task 5: Replace the calculator-first page with the left-to-spend tool

**Files:**

- Create: `src/components/calculator/raw-calculator.tsx`
- Create: `src/components/calculator/raw-calculator.test.tsx`
- Modify: `src/components/calculator/calculator.tsx`
- Modify: `src/components/calculator/calculator.test.tsx`
- Modify: `src/app/(app)/calculator/page.tsx`
- Modify: `src/app/(app)/calculator/page.test.tsx`
- Modify: `src/modules/dashboard/dashboard-data.ts`
- Modify: `src/components/dashboard/launcher-grid.test.tsx`
- Modify: `tests/e2e/calculator.spec.ts`

- [ ] **Step 1: Write the failing calculator tests against the new budgeting-first contract**

Replace `src/components/calculator/calculator.test.tsx` with budgeting-first assertions:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { Calculator } from "./calculator";

describe("Calculator", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the left-to-spend result before exposing raw arithmetic", () => {
    render(<Calculator />);

    fireEvent.change(screen.getByLabelText(/money in/i), { target: { value: "3000" } });
    fireEvent.change(screen.getByLabelText(/fixed bills/i), { target: { value: "1700" } });
    fireEvent.change(screen.getByLabelText(/planned essentials/i), { target: { value: "450" } });

    expect(screen.getByText(/\$850 safe to spend/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open raw arithmetic/i })).toBeInTheDocument();
  });
});
```

Update `tests/e2e/calculator.spec.ts`:

```ts
test("calculator page leads with left-to-spend and still exposes raw arithmetic", async ({ page }) => {
  await page.goto("/calculator");

  await expect(page.getByRole("heading", { level: 1, name: /left to spend/i })).toBeVisible();
  await page.getByLabel(/money in/i).fill("3000");
  await page.getByLabel(/fixed bills/i).fill("1700");
  await page.getByLabel(/planned essentials/i).fill("450");

  await expect(page.getByText(/\$850 safe to spend/i)).toBeVisible();

  await page.getByRole("button", { name: /open raw arithmetic/i }).click();
  await page.getByRole("button", { name: "3" }).click();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: "=" }).click();

  await expect(page.getByRole("status")).toHaveText("8");
});
```

- [ ] **Step 2: Run the focused calculator tests to verify failure**

Run: `npm test -- src/modules/budgeting/left-to-spend.test.ts src/components/calculator/calculator.test.tsx src/app/(app)/calculator/page.test.tsx src/components/dashboard/launcher-grid.test.tsx`
Expected: FAIL because the current page still leads with the generic keypad.

- [ ] **Step 3: Extract the existing raw keypad into a secondary utility**

Create `src/components/calculator/raw-calculator.tsx` using the current keypad logic:

```tsx
"use client";

import { useEffect, useState } from "react";

// Move the existing CalculatorDraft types and keypad handlers here unchanged.
export function RawCalculator() {
  const [draft, setDraft] = useState(() => loadDraft());

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  return (
    <section aria-label="Raw arithmetic" className="grid gap-4">
      <p role="status" className="rounded bg-black/40 px-4 py-3 text-right font-mono text-3xl text-white">
        {draft.display}
      </p>
      <div className="grid grid-cols-4 gap-2">{/* existing buttons here */}</div>
    </section>
  );
}
```

- [ ] **Step 4: Rebuild the primary calculator surface around left-to-spend**

Modify `src/components/calculator/calculator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { buildLeftToSpendPlan } from "@/modules/budgeting/left-to-spend";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { RawCalculator } from "./raw-calculator";

export function Calculator() {
  const [moneyIn, setMoneyIn] = useState(0);
  const [fixedBills, setFixedBills] = useState(0);
  const [plannedEssentials, setPlannedEssentials] = useState(0);
  const [cashOnHand, setCashOnHand] = useState(0);
  const [showRawCalculator, setShowRawCalculator] = useState(false);

  const plan = buildLeftToSpendPlan({
    moneyIn,
    fixedBills,
    plannedEssentials,
    cashOnHand,
  });

  return (
    <section className="bb-panel bb-panel-strong mx-auto grid max-w-md gap-5 p-5" aria-label="Left-to-spend tool">
      <OfflineBanner className="mb-0" />

      <div>
        <p className="bb-kicker">Budget check</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Left to spend</h2>
        <p className="bb-mini-copy mt-2 text-sm">Money in, fixed bills, and the safe amount left before extras.</p>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Money in</span>
        <input type="number" value={moneyIn} onChange={(event) => setMoneyIn(Number(event.target.value))} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Fixed bills</span>
        <input type="number" value={fixedBills} onChange={(event) => setFixedBills(Number(event.target.value))} />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Planned essentials</span>
        <input type="number" value={plannedEssentials} onChange={(event) => setPlannedEssentials(Number(event.target.value))} />
      </label>

      <article className="rounded-[24px] border border-emerald-200/20 bg-emerald-300/10 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-yellow-200">Safe amount left</p>
        <p className="mt-2 text-4xl font-semibold text-white">${plan.safeToSpend} safe to spend</p>
        <p className="mt-3 text-sm text-emerald-50/90">{plan.topRisk}</p>
      </article>

      <button type="button" className="bb-button-secondary" onClick={() => setShowRawCalculator((current) => !current)}>
        {showRawCalculator ? "Hide raw arithmetic" : "Open raw arithmetic"}
      </button>

      {showRawCalculator ? <RawCalculator /> : null}
    </section>
  );
}
```

Modify `src/app/(app)/calculator/page.tsx`:

```tsx
<section className="mx-auto h-full max-w-5xl">
  <p className="bb-kicker">Tools</p>
  <h1 className="mt-3 text-4xl font-semibold">Left to spend</h1>
  <p className="bb-copy mt-3 max-w-xl text-sm">
    Check the safe amount left before extras, then open raw arithmetic only if you still need it.
  </p>
  <div className="mt-6">
    <Calculator />
  </div>
</section>
```

- [ ] **Step 5: Re-run the focused calculator tests and the calculator E2E flow**

Run: `npm test -- src/modules/budgeting/left-to-spend.test.ts src/components/calculator/raw-calculator.test.tsx src/components/calculator/calculator.test.tsx src/app/(app)/calculator/page.test.tsx src/components/dashboard/launcher-grid.test.tsx`
Expected: PASS.

Run: `npx playwright test tests/e2e/calculator.spec.ts --project=chromium --workers=1`
Expected: PASS.

- [ ] **Step 6: Commit the calculator redesign slice**

```bash
git add src/components/calculator src/app/'(app)'/calculator src/modules/dashboard/dashboard-data.ts src/components/dashboard/launcher-grid.test.tsx tests/e2e/calculator.spec.ts
git commit -m "feat: replace calculator with left to spend tool"
```

### Task 6: Finish the regression slice, refresh docs, and run repo checks

**Files:**

- Modify: `tests/e2e/start-smart.spec.ts`
- Modify: `tests/e2e/jobs.spec.ts`
- Modify: `tests/e2e/dashboard.spec.ts`
- Modify: `tests/e2e/launch-profile.ts`
- Modify: `README.md`
- Modify: `docs/CODEBASE_INDEX.md`
- Modify: `docs/DEV_TREE.md`

- [ ] **Step 1: Update the E2E seed helper so dashboard and jobs can read the sticky home base**

Modify `tests/e2e/launch-profile.ts`:

```ts
export async function seedCompletedLaunchProfile(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "budgetbitch:launch-profile",
      JSON.stringify({
        completed: true,
        completedAt: "2026-04-10T12:00:00.000Z",
        city: "Dublin",
        layoutPreset: "launcher_grid",
        motionPreset: "cinematic",
        themePreset: "midnight",
        cryptoPlatform: "later",
      }),
    );

    localStorage.setItem(
      "budgetbitch:home-location",
      JSON.stringify({
        countryCode: "IE",
        stateCode: "DN",
        city: "Dublin",
        updatedAt: "2026-04-24T12:00:00.000Z",
      }),
    );
  });
}
```

- [ ] **Step 2: Update the focused Playwright specs for the redesigned contract**

Update `tests/e2e/start-smart.spec.ts`:

```ts
const bodyOverflows = await page.evaluate(() => document.body.scrollHeight > window.innerHeight);
expect(bodyOverflows).toBe(false);
await expect(page.getByText(/safe to spend/i)).toBeVisible();
```

Update `tests/e2e/jobs.spec.ts` and `tests/e2e/dashboard.spec.ts` with:

```ts
await expect(page.getByText(/dublin, dn, ie/i)).toBeVisible();
await expect(page.getByRole("link", { name: /change home base/i })).toHaveAttribute(
  "href",
  "/start-smart?panel=home-base",
);
```

- [ ] **Step 3: Refresh the repo docs so the new flow is discoverable**

Update `README.md` with a short product-shape summary:

```md
## Primary mobile budgeting journey

- `Start Smart` is now a four-panel survival flow.
- `Home base` is a sticky validated location context reused across Start Smart, jobs, and dashboard.
- `/calculator` keeps the route path but now leads with a left-to-spend budgeting tool.
- Raw arithmetic is still available as a secondary utility inside the calculator surface.
```

Update `docs/CODEBASE_INDEX.md` with:

```md
- `src/modules/home-location/*`: sticky validated home-base storage and subscriptions
- `src/modules/budgeting/left-to-spend.ts`: shared money-left calculation used by Start Smart and calculator
- `src/components/mobile/fixed-screen-shell.tsx`: header / panel / action-bar layout for no-scroll mobile budgeting screens
```

Update `docs/DEV_TREE.md` with:

```md
src/
  components/
    mobile/
      fixed-screen-shell.tsx
    home-location/
      home-location-summary.tsx
    start-smart/
      panels/
        lane-panel.tsx
        home-base-panel.tsx
        money-snapshot-panel.tsx
  modules/
    home-location/
    budgeting/
```

- [ ] **Step 4: Run the focused redesign validations**

Run: `npm test -- src/modules/home-location/home-location-store.test.ts src/modules/budgeting/left-to-spend.test.ts src/components/mobile/fixed-screen-shell.test.tsx src/components/start-smart/start-smart-shell.test.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/jobs/page.test.tsx src/components/calculator/calculator.test.tsx`
Expected: PASS.

Run: `npx playwright test tests/e2e/start-smart.spec.ts tests/e2e/calculator.spec.ts tests/e2e/jobs.spec.ts tests/e2e/dashboard.spec.ts --project=chromium --workers=1`
Expected: PASS.

- [ ] **Step 5: Run the full repo checks required by repo instructions**

Run: `npm run lint`
Expected: PASS.

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit docs and final validation-backed cleanup**

```bash
git add tests/e2e README.md docs/CODEBASE_INDEX.md docs/DEV_TREE.md
git commit -m "docs: capture survival flow redesign"
```