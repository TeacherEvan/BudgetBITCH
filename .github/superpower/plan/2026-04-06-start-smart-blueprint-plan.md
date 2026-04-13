pip uninstall uv
pipx uninstall uv
brew uninstall uv
cargo uninstall uv
winget uninstall astral-sh.uv
scoop uninstall uv# BudgetBITCH Start Smart / Money Survival Blueprint Implementation Plan

**Date:** 2026-04-06  
**Status:** Approved for execution  
**Project:** BudgetBITCH

## Goal

Ship a protected `Start Smart` onboarding flow that lets users begin from templates or fully custom inputs, fetches country/state-aware regional assumptions, generates a persisted Money Survival Blueprint, and surfaces that blueprint from the dashboard.

## Architecture

Use Next.js App Router + Prisma persistence + thin API routes + `src/modules/start-smart/**` domain logic + reusable `src/components/start-smart/**` UI + curated server-side regional data fetch/normalization.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- Zod
- Vitest
- Testing Library
- Playwright
- Clerk-protected `(app)` route group

## Scope lock

### Included

- Start Smart protected route
- household + situation template catalog
- fully custom onboarding path
- canonical financial profile normalization
- country/state-aware regional data fetch + trust labeling
- Money Survival Blueprint generation
- persisted profile/snapshot/blueprint records
- dashboard CTA and blueprint summary entry point
- targeted unit, component, API, and E2E coverage

### Explicitly excluded

- full Learn! content engine
- job listings/search UI
- banking/investment/payroll connectors beyond recommendations
- arbitrary open-web scraping from unknown sites
- autonomous financial actions without user confirmation

## Task 1: Add persistence for Start Smart profiles and blueprint snapshots

### Step 1: Write the failing test

**File:** `src/modules/start-smart/profile-record.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { buildProfileRecord } from "./profile-record";

describe("buildProfileRecord", () => {
  it("serializes onboarding inputs into a stable storage record", () => {
    const result = buildProfileRecord({
      workspaceId: "ws_123",
      templateId: "young_adult",
      regionKey: "us-ca",
      householdKind: "solo",
      profile: {
        countryCode: "US",
        stateCode: "CA",
        ageBand: "young_adult",
        housing: "renting",
        dependents: 0,
        pets: 0,
        incomePattern: "steady",
        debtLoad: "moderate",
        goals: ["emergency_fund"],
      },
    });

    expect(result).toMatchObject({
      workspaceId: "ws_123",
      templateId: "young_adult",
      regionKey: "us-ca",
      householdKind: "solo",
      status: "draft",
    });
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- "src/modules/start-smart/profile-record.test.ts"
```

### Step 3: Implement minimal persistence support

**Files:**
- `src/modules/start-smart/profile-record.ts`
- `prisma/schema.prisma`

**Add to** `prisma/schema.prisma`:
- enum `StartSmartStatus` with `draft`, `generated`, `accepted`
- enum `ConfidenceLabel` with `verified`, `estimated`, `user_entered`
- model `StartSmartProfile`
- model `RegionalSnapshot`
- model `MoneyBlueprintSnapshot`
- relation fields from `Workspace` to the new models

**Key implementation content:**
- `buildProfileRecord()` returns a Prisma-ready JSON-backed payload
- use `Json` fields for raw profile input, regional assumptions, and generated blueprint
- store `templateId`, `regionKey`, `householdKind`, `status`, and timestamps as first-class columns
- attach all three models to `workspaceId`

### Step 4: Run the test and generate Prisma client

**Commands**

```bash
npm run test -- "src/modules/start-smart/profile-record.test.ts"
npm run db:generate
npm run db:migrate -- --name add_start_smart_blueprint
```

## Task 2: Create the canonical Start Smart profile schema and template catalog

### Step 1: Write the failing tests

**Files:**
- `src/modules/start-smart/profile-schema.test.ts`
- `src/modules/start-smart/template-catalog.test.ts`

**Code for** `src/modules/start-smart/profile-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeStartSmartProfile } from "./profile-schema";

describe("normalizeStartSmartProfile", () => {
  it("normalizes custom onboarding answers into a canonical profile", () => {
    const result = normalizeStartSmartProfile({
      countryCode: "US",
      stateCode: "CA",
      ageBand: "young_adult",
      housing: "renting",
      dependents: 0,
      pets: 1,
      incomePattern: "variable",
      debtLoad: "high",
      goals: ["emergency_fund", "debt_relief"],
      benefitsSupport: ["none"],
      preferredIntegrations: ["openai"],
    });

    expect(result.regionKey).toBe("us-ca");
    expect(result.householdKind).toBe("solo");
    expect(result.riskSignals).toContain("income_volatility");
    expect(result.riskSignals).toContain("debt_pressure");
  });
});
```

**Code for** `src/modules/start-smart/template-catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getStartSmartTemplate,
  listStartSmartTemplateCards,
} from "./template-catalog";

describe("template-catalog", () => {
  it("exposes both household and high-friction templates", () => {
    const cards = listStartSmartTemplateCards();

    expect(cards.some((card) => card.id === "single_teen")).toBe(true);
    expect(cards.some((card) => card.id === "entrepreneur")).toBe(true);
    expect(cards.some((card) => card.id === "housing_insecure")).toBe(true);
  });

  it("returns template defaults by id", () => {
    expect(getStartSmartTemplate("family_with_pets")?.lane).toBe("household");
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/start-smart/profile-schema.test.ts"
npm run test -- "src/modules/start-smart/template-catalog.test.ts"
```

### Step 3: Implement the schema and catalog

**Files:**
- `src/modules/start-smart/profile-schema.ts`
- `src/modules/start-smart/template-catalog.ts`

**Key implementation content:**
- `startSmartProfileSchema` with Zod validation for country, state, age band, housing, dependents, pets, income pattern, debt load, goals, benefits, and preferred integrations
- `normalizeStartSmartProfile()` derives:
  - `regionKey`
  - `householdKind`
  - `riskSignals`
  - `priorityBias`
- `template-catalog.ts` exports:
  - `StartSmartTemplateId`
  - `StartSmartTemplate`
  - `startSmartTemplates`
  - `getStartSmartTemplate()`
  - `listStartSmartTemplateCards()`
- include templates for the approved lanes:
  - household
  - solo situation
  - high-friction reality
  - custom starter

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/start-smart/profile-schema.test.ts"
npm run test -- "src/modules/start-smart/template-catalog.test.ts"
```

## Task 3: Build the regional data fetch, trust ranking, and normalization layer

### Step 1: Write the failing test

**File:** `src/modules/start-smart/regional-data.test.ts`

**Code:**

```ts
import { describe, expect, it } from "vitest";
import { buildRegionalSnapshot } from "./regional-data";

describe("buildRegionalSnapshot", () => {
  it("prefers verified official data over estimated fallback values", () => {
    const result = buildRegionalSnapshot({
      regionKey: "us-ca",
      seed: {
        housing: { monthly: 2100, confidence: "estimated" },
        transport: { monthly: 250, confidence: "estimated" },
      },
      fetched: [
        {
          sourceLabel: "California housing board",
          sourceUrl: "https://example.gov/housing",
          trustTier: "official",
          values: {
            housing: { monthly: 2400 },
          },
        },
      ],
    });

    expect(result.regionKey).toBe("us-ca");
    expect(result.housing.monthly).toBe(2400);
    expect(result.housing.confidence).toBe("verified");
    expect(result.transport.confidence).toBe("estimated");
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- "src/modules/start-smart/regional-data.test.ts"
```

### Step 3: Implement minimal regional intelligence

**Files:**
- `src/modules/start-smart/regional-seed.ts`
- `src/modules/start-smart/regional-data.ts`
- `src/modules/start-smart/regional-fetch.ts`

**Key implementation content:**
- `regional-seed.ts` provides baseline assumptions for common regions
- `regional-fetch.ts` fetches curated source data from official or attributable endpoints only
- `regional-data.ts` exports:
  - `buildRegionalSnapshot()`
  - `rankTrustTier()`
  - `mergeRegionalValues()`
- each category stores:
  - amount/range
  - confidence label
  - source URL
  - fetched timestamp
  - explanation string for “why this number”

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- "src/modules/start-smart/regional-data.test.ts"
```

## Task 4: Implement the Money Survival Blueprint engine

### Step 1: Write the failing test

**File:** `src/modules/start-smart/blueprint-engine.test.ts`

**Code:**

```ts
import { describe, expect, it } from "vitest";
import { generateMoneySurvivalBlueprint } from "./blueprint-engine";

describe("generateMoneySurvivalBlueprint", () => {
  it("builds essentials, risk warnings, actions, and recommendations", () => {
    const result = generateMoneySurvivalBlueprint({
      profile: {
        regionKey: "us-ca",
        householdKind: "solo",
        ageBand: "young_adult",
        housing: "renting",
        dependents: 0,
        pets: 1,
        incomePattern: "variable",
        debtLoad: "high",
        goals: ["emergency_fund", "debt_relief"],
        riskSignals: ["income_volatility", "debt_pressure"],
        preferredIntegrations: ["openai"],
      },
      regional: {
        regionKey: "us-ca",
        housing: { monthly: 2400, confidence: "verified" },
        transport: { monthly: 250, confidence: "estimated" },
        utilities: { monthly: 180, confidence: "estimated" },
      },
    });

    expect(result.priorityStack[0]).toBe("cover_essentials");
    expect(result.riskWarnings).toContain("high_debt_pressure");
    expect(result.next7Days.length).toBeGreaterThan(0);
    expect(result.learnModuleKeys).toContain("budgeting_basics");
  });
});
```

### Step 2: Run the test and verify failure

**Command**

```bash
npm run test -- "src/modules/start-smart/blueprint-engine.test.ts"
```

### Step 3: Implement the blueprint engine

**Files:**
- `src/modules/start-smart/blueprint-engine.ts`
- `src/modules/start-smart/recommendation-catalog.ts`

**Key implementation content:**
- `generateMoneySurvivalBlueprint()` returns:
  - essential categories
  - optional categories
  - priority stack
  - risk warnings
  - emergency target
  - debt pressure summary
  - next 7-day actions
  - next 30-day actions
  - recommended integrations
  - `learnModuleKeys`
- recommendation logic should be deterministic and traceable from:
  - profile input
  - regional assumptions
  - rule id

### Step 4: Run the test and verify success

**Command**

```bash
npm run test -- "src/modules/start-smart/blueprint-engine.test.ts"
```

## Task 5: Add thin API routes for regional snapshots and blueprint generation

### Step 1: Write the failing tests

**Files:**
- `src/app/api/v1/start-smart/regional-data/route.test.ts`
- `src/app/api/v1/start-smart/blueprint/route.test.ts`

**Code for** `regional-data/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/start-smart/regional-data", () => {
  it("returns a normalized regional snapshot", async () => {
    const request = new Request("http://localhost/api/v1/start-smart/regional-data", {
      method: "POST",
      body: JSON.stringify({ countryCode: "US", stateCode: "CA" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.regionKey).toBe("us-ca");
  });
});
```

**Code for** `blueprint/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/start-smart/blueprint", () => {
  it("returns a generated blueprint payload", async () => {
    const request = new Request("http://localhost/api/v1/start-smart/blueprint", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_123",
        templateId: "young_adult",
        answers: {
          countryCode: "US",
          stateCode: "CA",
          ageBand: "young_adult",
          housing: "renting",
          dependents: 0,
          pets: 0,
          incomePattern: "steady",
          debtLoad: "low",
          goals: ["emergency_fund"],
          benefitsSupport: ["none"],
          preferredIntegrations: [],
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.blueprint.priorityStack.length).toBeGreaterThan(0);
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/app/api/v1/start-smart/regional-data/route.test.ts"
npm run test -- "src/app/api/v1/start-smart/blueprint/route.test.ts"
```

### Step 3: Implement the routes

**Files:**
- `src/app/api/v1/start-smart/regional-data/route.ts`
- `src/app/api/v1/start-smart/blueprint/route.ts`

**Key implementation content:**
- validate request bodies with Zod
- call domain modules only:
  - `normalizeStartSmartProfile()`
  - `buildRegionalSnapshot()` / `fetchRegionalData()`
  - `generateMoneySurvivalBlueprint()`
  - `buildProfileRecord()`
- persist results through Prisma
- return traceable confidence/source metadata in API responses
- no business rules inside the route handlers

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/app/api/v1/start-smart/regional-data/route.test.ts"
npm run test -- "src/app/api/v1/start-smart/blueprint/route.test.ts"
```

## Task 6: Add the Start Smart wizard route, state machine, and core UI components

### Step 1: Write the failing tests

**Files:**
- `src/modules/start-smart/wizard-machine.test.ts`
- `src/app/(app)/start-smart/page.test.tsx`

**Code for** `wizard-machine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { nextWizardStep } from "./wizard-machine";

describe("nextWizardStep", () => {
  it("moves from template selection to region details", () => {
    expect(nextWizardStep("template")).toBe("region");
  });
});
```

**Code for** `page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import StartSmartPage from "./page";

describe("StartSmartPage", () => {
  it("renders the onboarding headline and first-step controls", () => {
    render(<StartSmartPage />);

    expect(screen.getByText("Choose your chaos. Build your control.")).toBeInTheDocument();
    expect(screen.getByText("Single teen")).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /build my survival blueprint/i })).toBeInTheDocument();
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/start-smart/wizard-machine.test.ts"
npm run test -- "src/app/(app)/start-smart/page.test.tsx"
```

### Step 3: Implement the route and components

**Files:**
- `src/modules/start-smart/wizard-machine.ts`
- `src/app/(app)/start-smart/page.tsx`
- `src/components/start-smart/start-smart-shell.tsx`
- `src/components/start-smart/template-picker.tsx`
- `src/components/start-smart/profile-form.tsx`
- `src/components/start-smart/confidence-badge.tsx`

**Key implementation content:**
- `wizard-machine.ts` defines ordered steps:
  - `template`
  - `region`
  - `household`
  - `money`
  - `review`
  - `blueprint`
- `page.tsx` renders a protected page in the existing `(app)` route group
- `start-smart-shell.tsx` owns client state and API calls
- `template-picker.tsx` renders household + situation cards from `template-catalog.ts`
- `profile-form.tsx` supports both template-prefilled and fully custom entry
- `confidence-badge.tsx` visually labels verified vs estimated assumptions

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/start-smart/wizard-machine.test.ts"
npm run test -- "src/app/(app)/start-smart/page.test.tsx"
```

## Task 7: Add the blueprint result panel and wire entry points from home and dashboard

### Step 1: Write the failing tests

**Files:**
- `src/components/start-smart/blueprint-panel.test.tsx`
- `src/app/(app)/dashboard/page.test.tsx`

**Code for** `blueprint-panel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { BlueprintPanel } from "./blueprint-panel";

describe("BlueprintPanel", () => {
  it("renders priorities, risk warnings, and next actions", () => {
    render(
      <BlueprintPanel
        blueprint={{
          priorityStack: ["cover_essentials", "stabilize_cash_flow"],
          riskWarnings: ["high_debt_pressure"],
          next7Days: ["List all fixed bills"],
          next30Days: ["Build starter emergency buffer"],
          learnModuleKeys: ["budgeting_basics"],
          recommendedIntegrations: ["openai"],
        }}
      />,
    );

    expect(screen.getByText("cover_essentials")).toBeInTheDocument();
    expect(screen.getByText("high_debt_pressure")).toBeInTheDocument();
    expect(screen.getByText("List all fixed bills")).toBeInTheDocument();
  });
});
```

**Update** `src/app/(app)/dashboard/page.test.tsx` to also assert:

```tsx
expect(screen.getByText("Money Survival Blueprint")).toBeInTheDocument();
expect(screen.getByRole("link", { name: /start smart/i })).toBeInTheDocument();
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/components/start-smart/blueprint-panel.test.tsx"
npm run test -- "src/app/(app)/dashboard/page.test.tsx"
```

### Step 3: Implement result UI and entry-point updates

**Files:**
- `src/components/start-smart/blueprint-panel.tsx`
- `src/app/page.tsx`
- `src/app/(app)/dashboard/page.tsx`

**Key implementation content:**
- `blueprint-panel.tsx` renders:
  - priority stack
  - confidence-aware assumptions
  - risk warnings
  - next 7-day / 30-day actions
  - Learn and integration suggestions
- update `src/app/page.tsx` to add a visible CTA into `/start-smart`
- update dashboard to add a `Money Survival Blueprint` card and Start Smart shortcut

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/components/start-smart/blueprint-panel.test.tsx"
npm run test -- "src/app/(app)/dashboard/page.test.tsx"
```

## Task 8: Add end-to-end coverage, docs updates, and full verification

### Step 1: Write the failing E2E test

**File:** `tests/e2e/start-smart.spec.ts`

**Code:**

```ts
import { expect, test } from "@playwright/test";

test("user can open Start Smart and generate a survival blueprint", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /enter the magic/i }).click();
  await page.getByRole("link", { name: /start smart/i }).click();

  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).fill("US");
  await page.getByLabel(/state/i).fill("CA");
  await page.getByRole("button", { name: /build my survival blueprint/i }).click();

  await expect(page.getByText("Money Survival Blueprint")).toBeVisible();
  await expect(page.getByText(/what must i cover first/i)).toBeVisible();
});
```

### Step 2: Run the E2E test and verify failure

**Command**

```bash
npm run test:e2e -- tests/e2e/start-smart.spec.ts
```

### Step 3: Implement any missing wiring and documentation

**Files:**
- `README.md`
- `docs/CODEBASE_INDEX.md`
- `docs/DEV_TREE.md`
- `.env.example` if a non-secret runtime config value is needed for regional data caching

**Documentation updates to include:**
- new protected route: `/start-smart`
- new API routes under `src/app/api/v1/start-smart/**`
- new domain namespace: `src/modules/start-smart/**`
- explanation that live regional fetches use curated, attributable sources only

### Step 4: Run targeted and full verification

**Commands**

```bash
npm run test:e2e -- tests/e2e/start-smart.spec.ts
npm run lint
npm run test
npm run test:e2e
npm run db:generate
npm run build
```

## Success condition

This phase is complete when the application:

- exposes a protected Start Smart onboarding route
- supports template-driven or fully custom setup
- produces a persisted Money Survival Blueprint using regional assumptions
- labels fetched assumptions with trust/confidence metadata
- surfaces blueprint entry points from home and dashboard
- passes targeted and full unit/component/E2E verification

