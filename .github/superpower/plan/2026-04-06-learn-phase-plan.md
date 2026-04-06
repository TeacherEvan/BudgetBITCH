# BudgetBITCH Learn! Implementation Plan

**Date:** 2026-04-06  
**Status:** Approved for execution  
**Project:** BudgetBITCH

## Goal

Ship a protected `Learn!` experience that turns existing blueprint recommendation keys into story-driven lessons, gives users a dedicated learning hub, and lets them open a lesson directly from their Money Survival Blueprint.

## Architecture

Use static lesson catalog content + deterministic recommendation resolution + thin API routes + protected App Router pages + reusable Learn UI components.

The Learn phase should plug into the current Start Smart system like this:

- `Start Smart blueprint` already emits `learnModuleKeys`
- `Learn resolver` maps those keys to full lesson content
- `Learn API` exposes recommended modules and module detail
- `Learn pages` render the hub and individual lesson experience
- `Blueprint panel` upgrades plain lesson keys into actual navigation links

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- Zod
- Vitest
- Testing Library
- Playwright

## Scope lock

### Included

- protected `/learn` hub
- protected `/learn/[slug]` lesson route
- canonical Learn module catalog
- deterministic recommendation resolution from existing blueprint data
- lesson cards and lesson detail UI
- humorous-but-safe narrative lesson structure
- dashboard and Start Smart blueprint entry points into Learn
- targeted unit/component/API/E2E coverage
- docs updates

### Explicitly excluded

- AI-generated lesson writing
- user-authored lessons
- lesson completion persistence
- quizzes, streaks, badges, or gamification
- job listings
- banking/investing connector expansion
- open-web educational content fetching

## Task 1: Create the Learn module catalog and lesson schema

### Step 1: Write the failing tests

**Files:**

- `src/modules/learn/module-catalog.test.ts`
- `src/modules/learn/module-schema.test.ts`

**Code for** `src/modules/learn/module-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { learnLessonSchema } from "./module-schema";

describe("learnLessonSchema", () => {
  it("accepts a complete story-driven lesson module", () => {
    const result = learnLessonSchema.parse({
      slug: "budgeting-basics",
      key: "budgeting_basics",
      title: "Budgeting Basics",
      category: "budgeting",
      tone: "chaotic_comedy",
      summary: "A funny first lesson about giving every dollar a job.",
      whyItMatters:
        "Users need a starter frame for essential vs optional spending.",
      blueprintSignals: ["cover_essentials", "build_emergency_buffer"],
      scenes: [
        {
          id: "scene-1",
          absurdScenario:
            "A raccoon opens six streaming subscriptions with your debit card.",
          plainEnglish:
            "A budget is a spending plan before the spending happens.",
          applyNow:
            "List fixed bills, then assign the remaining dollars on purpose.",
        },
      ],
      takeaways: [
        "A budget is a plan, not a punishment.",
        "Essentials get funded before optional chaos.",
      ],
      nextActionLabel: "Review your essentials",
    });

    expect(result.slug).toBe("budgeting-basics");
    expect(result.scenes).toHaveLength(1);
  });
});
```

**Code for** `src/modules/learn/module-catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  getLearnModuleByKey,
  getLearnModuleBySlug,
  listLearnModules,
} from "./module-catalog";

describe("module-catalog", () => {
  it("contains the initial blueprint-driven lesson modules", () => {
    const modules = listLearnModules();

    expect(modules.some((module) => module.key === "budgeting_basics")).toBe(
      true,
    );
    expect(modules.some((module) => module.key === "income_variability")).toBe(
      true,
    );
    expect(modules.some((module) => module.key === "debt_triage")).toBe(true);
    expect(modules.some((module) => module.key === "benefits_protection")).toBe(
      true,
    );
  });

  it("supports lookup by key and slug", () => {
    expect(getLearnModuleByKey("budgeting_basics")?.slug).toBe(
      "budgeting-basics",
    );
    expect(getLearnModuleBySlug("debt-triage")?.key).toBe("debt_triage");
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/learn/module-schema.test.ts"
npm run test -- "src/modules/learn/module-catalog.test.ts"
```

**Expected output**

```text
FAIL  src/modules/learn/module-schema.test.ts
FAIL  src/modules/learn/module-catalog.test.ts
Error: Cannot find module './module-schema'
Error: Cannot find module './module-catalog'
```

### Step 3: Implement the lesson schema and catalog

**Files:**

- `src/modules/learn/module-schema.ts`
- `src/modules/learn/module-catalog.ts`

**Key implementation content:**

- `learnLessonSchema` validates:
  - `slug`
  - `key`
  - `title`
  - `category`
  - `tone`
  - `summary`
  - `whyItMatters`
  - `blueprintSignals`
  - `scenes[]`
  - `takeaways[]`
  - `nextActionLabel`
- `module-catalog.ts` exports:
  - `LearnModuleKey`
  - `LearnLesson`
  - `learnModules`
  - `listLearnModules()`
  - `getLearnModuleByKey()`
  - `getLearnModuleBySlug()`

**Initial module set**

- `budgeting_basics`
- `income_variability`
- `debt_triage`
- `benefits_protection`
- `investing_basics`
- `crypto_risk`
- `nft_speculation`
- `gold_basics`
- `oil_and_commodities`
- `labor_income`
- `taxes_basics`
- `inflation_opportunity_cost`
- `money_behavior`

**Content rule**

- each lesson must use:
  1. absurd scenario
  2. plain-English explanation
  3. apply-it-now action

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/learn/module-schema.test.ts"
npm run test -- "src/modules/learn/module-catalog.test.ts"
```

**Expected output**

```text
PASS  src/modules/learn/module-schema.test.ts
PASS  src/modules/learn/module-catalog.test.ts
Tests: 4 passed
```

## Task 2: Build recommendation resolution from the user’s latest blueprint

### Step 1: Write the failing tests

**Files:**

- `src/modules/learn/recommendation-engine.test.ts`
- `src/modules/learn/blueprint-bridge.test.ts`

**Code for** `src/modules/learn/recommendation-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveLearnRecommendations } from "./recommendation-engine";

describe("resolveLearnRecommendations", () => {
  it("maps blueprint lesson keys into rich lesson cards", () => {
    const result = resolveLearnRecommendations({
      learnModuleKeys: ["budgeting_basics", "debt_triage"],
      priorityStack: ["cover_essentials", "reduce_debt_damage"],
      riskWarnings: ["high_debt_pressure"],
    });

    expect(result.primary[0]?.key).toBe("budgeting_basics");
    expect(result.primary[1]?.key).toBe("debt_triage");
    expect(result.explainers).toContain(
      "These lessons are recommended because your blueprint prioritizes essentials and debt damage control.",
    );
  });

  it("falls back to evergreen starter lessons when blueprint keys are empty", () => {
    const result = resolveLearnRecommendations({
      learnModuleKeys: [],
      priorityStack: ["cover_essentials"],
      riskWarnings: [],
    });

    expect(result.primary[0]?.key).toBe("budgeting_basics");
  });
});
```

**Code for** `src/modules/learn/blueprint-bridge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractLearnSignalsFromBlueprint } from "./blueprint-bridge";

describe("extractLearnSignalsFromBlueprint", () => {
  it("extracts stable recommendation inputs from a stored blueprint snapshot", () => {
    const result = extractLearnSignalsFromBlueprint({
      priorityStack: ["cover_essentials", "build_emergency_buffer"],
      riskWarnings: ["income_volatility_risk"],
      learnModuleKeys: ["budgeting_basics", "income_variability"],
    });

    expect(result.learnModuleKeys).toEqual([
      "budgeting_basics",
      "income_variability",
    ]);
    expect(result.priorityStack).toContain("cover_essentials");
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/learn/recommendation-engine.test.ts"
npm run test -- "src/modules/learn/blueprint-bridge.test.ts"
```

**Expected output**

```text
FAIL  src/modules/learn/recommendation-engine.test.ts
FAIL  src/modules/learn/blueprint-bridge.test.ts
Error: Cannot find module './recommendation-engine'
```

### Step 3: Implement the recommendation bridge

**Files:**

- `src/modules/learn/blueprint-bridge.ts`
- `src/modules/learn/recommendation-engine.ts`

**Key implementation content:**

- `extractLearnSignalsFromBlueprint()` accepts the shape already emitted by `generateMoneySurvivalBlueprint()`
- `resolveLearnRecommendations()`:
  - looks up modules from `learnModuleKeys`
  - preserves blueprint order
  - deduplicates modules
  - falls back to evergreen starter content
  - produces short explanation strings tied to the user’s blueprint

**Fallback behavior**

- if no lesson keys exist, recommend:
  - `budgeting_basics`
  - `money_behavior`
  - `inflation_opportunity_cost`

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/learn/recommendation-engine.test.ts"
npm run test -- "src/modules/learn/blueprint-bridge.test.ts"
```

**Expected output**

```text
PASS  src/modules/learn/recommendation-engine.test.ts
PASS  src/modules/learn/blueprint-bridge.test.ts
Tests: 3 passed
```

## Task 3: Add Learn API routes for recommendations and lesson detail

### Step 1: Write the failing tests

**Files:**

- `src/app/api/v1/learn/recommendations/route.test.ts`
- `src/app/api/v1/learn/modules/[slug]/route.test.ts`

**Code for** `src/app/api/v1/learn/recommendations/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: vi.fn().mockResolvedValue({
        blueprintJson: {
          priorityStack: ["cover_essentials", "reduce_debt_damage"],
          riskWarnings: ["high_debt_pressure"],
          learnModuleKeys: ["budgeting_basics", "debt_triage"],
        },
      }),
    },
  }),
}));

describe("POST /api/v1/learn/recommendations", () => {
  it("returns lesson recommendations for the latest blueprint", async () => {
    const request = new Request(
      "http://localhost/api/v1/learn/recommendations",
      {
        method: "POST",
        body: JSON.stringify({ workspaceId: "demo_workspace" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.primary[0].key).toBe("budgeting_basics");
    expect(json.primary[1].key).toBe("debt_triage");
  });
});
```

**Code for** `src/app/api/v1/learn/modules/[slug]/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/v1/learn/modules/[slug]", () => {
  it("returns lesson detail for a valid module slug", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/learn/modules/budgeting-basics"),
      { params: Promise.resolve({ slug: "budgeting-basics" }) },
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.slug).toBe("budgeting-basics");
    expect(json.scenes.length).toBeGreaterThan(0);
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/app/api/v1/learn/recommendations/route.test.ts"
npm run test -- "src/app/api/v1/learn/modules/[slug]/route.test.ts"
```

**Expected output**

```text
FAIL  src/app/api/v1/learn/recommendations/route.test.ts
FAIL  src/app/api/v1/learn/modules/[slug]/route.test.ts
Error: Cannot find module './route'
```

### Step 3: Implement the routes

**Files:**

- `src/app/api/v1/learn/recommendations/route.ts`
- `src/app/api/v1/learn/modules/[slug]/route.ts`

**Key implementation content:**

- `POST /api/v1/learn/recommendations`
  - validates `{ workspaceId: string }`
  - loads the latest `MoneyBlueprintSnapshot` for the workspace
  - extracts stable learn signals from `blueprintJson`
  - returns resolved lesson recommendations
- `GET /api/v1/learn/modules/[slug]`
  - resolves module by slug
  - returns 404 if absent
  - returns full lesson payload if present

**Important rule**

- keep all recommendation logic in `src/modules/learn/**`
- no story logic inside the route handlers

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/app/api/v1/learn/recommendations/route.test.ts"
npm run test -- "src/app/api/v1/learn/modules/[slug]/route.test.ts"
```

**Expected output**

```text
PASS  src/app/api/v1/learn/recommendations/route.test.ts
PASS  src/app/api/v1/learn/modules/[slug]/route.test.ts
Tests: 2 passed
```

## Task 4: Build the protected Learn hub and lesson detail route

### Step 1: Write the failing tests

**Files:**

- `src/app/(app)/learn/page.test.tsx`
- `src/app/(app)/learn/[slug]/page.test.tsx`
- `src/components/learn/lesson-card.test.tsx`

**Code for** `src/app/(app)/learn/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders the Learn! hub headline and starter lesson cards", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByText("Learn!")).toBeInTheDocument();
    expect(
      screen.getByText("Absurd lessons. Real money moves."),
    ).toBeInTheDocument();
    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
  });
});
```

**Code for** `src/app/(app)/learn/[slug]/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import LearnLessonPage from "./page";

describe("LearnLessonPage", () => {
  it("renders the story scenes and practical takeaways", async () => {
    const view = await LearnLessonPage({
      params: Promise.resolve({ slug: "budgeting-basics" }),
    });

    render(view);

    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
    expect(screen.getByText("Plain-English breakdown")).toBeInTheDocument();
    expect(screen.getByText("Apply this now")).toBeInTheDocument();
  });
});
```

**Code for** `src/components/learn/lesson-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { LessonCard } from "./lesson-card";

describe("LessonCard", () => {
  it("renders summary and a launch link", () => {
    render(
      <LessonCard
        lesson={{
          slug: "budgeting-basics",
          key: "budgeting_basics",
          title: "Budgeting Basics",
          category: "budgeting",
          tone: "chaotic_comedy",
          summary: "A funny first lesson about giving every dollar a job.",
          whyItMatters: "Protect essentials before optional spending.",
          blueprintSignals: ["cover_essentials"],
          scenes: [],
          takeaways: ["Give each dollar a job."],
          nextActionLabel: "Open lesson",
        }}
      />,
    );

    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open lesson/i }),
    ).toBeInTheDocument();
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/app/(app)/learn/page.test.tsx"
npm run test -- "src/app/(app)/learn/[slug]/page.test.tsx"
npm run test -- "src/components/learn/lesson-card.test.tsx"
```

**Expected output**

```text
FAIL  src/app/(app)/learn/page.test.tsx
FAIL  src/app/(app)/learn/[slug]/page.test.tsx
FAIL  src/components/learn/lesson-card.test.tsx
Error: Cannot find module './page'
```

### Step 3: Implement the Learn pages and components

**Files:**

- `src/app/(app)/learn/page.tsx`
- `src/app/(app)/learn/[slug]/page.tsx`
- `src/components/learn/lesson-card.tsx`
- `src/components/learn/lesson-scene.tsx`
- `src/components/learn/recommended-lessons.tsx`

**Key implementation content:**

- `/learn`
  - renders a protected learning hub
  - fetches recommendation payload for `demo_workspace`
  - shows primary recommendations and evergreen lessons
- `/learn/[slug]`
  - resolves lesson by slug
  - renders title, summary, “why it matters”, scenes, takeaways, and next-action block
- `LessonCard`
  - shows title, category, summary, and CTA
- `LessonScene`
  - presents:
    - absurd scenario
    - plain-English breakdown
    - apply-this-now action
- `recommended-lessons.tsx`
  - renders grouped recommendation cards

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/app/(app)/learn/page.test.tsx"
npm run test -- "src/app/(app)/learn/[slug]/page.test.tsx"
npm run test -- "src/components/learn/lesson-card.test.tsx"
```

**Expected output**

```text
PASS  src/app/(app)/learn/page.test.tsx
PASS  src/app/(app)/learn/[slug]/page.test.tsx
PASS  src/components/learn/lesson-card.test.tsx
Tests: 3 passed
```

## Task 5: Wire Learn entry points into the existing blueprint and dashboard flows

### Step 1: Write the failing tests

**Files:**

- `src/components/start-smart/blueprint-panel.test.tsx`
- `src/app/(app)/dashboard/page.test.tsx`

**Update** `src/components/start-smart/blueprint-panel.test.tsx` to assert Learn links are actionable:

```tsx
import { render, screen } from "@testing-library/react";
import { BlueprintPanel } from "./blueprint-panel";

describe("BlueprintPanel", () => {
  it("renders Learn lesson links instead of plain recommendation text", () => {
    render(
      <BlueprintPanel
        blueprint={{
          priorityStack: ["cover_essentials"],
          riskWarnings: ["high_debt_pressure"],
          next7Days: ["List all fixed bills"],
          next30Days: ["Build starter emergency buffer"],
          learnModuleKeys: ["budgeting_basics", "debt_triage"],
          recommendedIntegrations: ["openai"],
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: /budgeting basics/i }),
    ).toHaveAttribute("href", "/learn/budgeting-basics");

    expect(screen.getByRole("link", { name: /debt triage/i })).toHaveAttribute(
      "href",
      "/learn/debt-triage",
    );
  });
});
```

**Update** `src/app/(app)/dashboard/page.test.tsx` to also assert:

```tsx
expect(screen.getByText("Learn!")).toBeInTheDocument();
expect(screen.getByRole("link", { name: /open learn/i })).toBeInTheDocument();
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/components/start-smart/blueprint-panel.test.tsx"
npm run test -- "src/app/(app)/dashboard/page.test.tsx"
```

**Expected output**

```text
FAIL  src/components/start-smart/blueprint-panel.test.tsx
FAIL  src/app/(app)/dashboard/page.test.tsx
TestingLibraryElementError: Unable to find role="link"
```

### Step 3: Implement the Learn wiring

**Files:**

- `src/components/start-smart/blueprint-panel.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/page.tsx`
- `middleware.ts`

**Key implementation content:**

- `BlueprintPanel`
  - map `learnModuleKeys` to module metadata
  - render clickable lesson links
  - show human-readable lesson titles instead of raw keys
- dashboard
  - add a `Learn!` card with short description and route CTA
- landing page
  - add secondary link into `/learn`
- middleware
  - ensure `/learn(.*)` is protected like `/dashboard` and `/start-smart`

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/components/start-smart/blueprint-panel.test.tsx"
npm run test -- "src/app/(app)/dashboard/page.test.tsx"
```

**Expected output**

```text
PASS  src/components/start-smart/blueprint-panel.test.tsx
PASS  src/app/(app)/dashboard/page.test.tsx
Tests: 2 passed
```

## Task 6: Add end-to-end coverage, docs updates, and full verification

### Step 1: Write the failing E2E test

**File:** `tests/e2e/learn.spec.ts`

**Code:**

```ts
import { expect, test } from "@playwright/test";

test("user can open Learn! from Start Smart results and view a lesson", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: /enter the magic/i }).click();
  await page.getByRole("link", { name: /start smart/i }).click();

  await page.getByText("Young adult").click();
  await page.getByLabel(/country/i).fill("US");
  await page.getByLabel(/state/i).fill("CA");
  await page
    .getByRole("button", { name: /build my survival blueprint/i })
    .click();

  await expect(page.getByText("Money Survival Blueprint")).toBeVisible();
  await page.getByRole("link", { name: /budgeting basics/i }).click();

  await expect(page.getByText("Learn!")).toBeVisible();
  await expect(page.getByText("Budgeting Basics")).toBeVisible();
  await expect(page.getByText("Plain-English breakdown")).toBeVisible();
});
```

### Step 2: Run the E2E test and verify failure

**Command**

```bash
npm run test:e2e -- tests/e2e/learn.spec.ts
```

**Expected output**

```text
Running 1 test using 1 worker
✘ user can open Learn! from Start Smart results and view a lesson
Error: locator.click: No element found for role=link name=/budgeting basics/i
```

### Step 3: Update docs and any missing wiring

**Files:**

- `README.md`
- `docs/CODEBASE_INDEX.md`
- `docs/DEV_TREE.md`

**Documentation updates to include**

- new protected routes:
  - `/learn`
  - `/learn/[slug]`
- new API endpoints:
  - `POST /api/v1/learn/recommendations`
  - `GET /api/v1/learn/modules/[slug]`
- new domain namespace:
  - `src/modules/learn/**`
- note that Learn recommendations are derived from stored blueprint signals, not freeform AI generation

### Step 4: Run full verification

**Commands**

```bash
npm run test:e2e -- tests/e2e/learn.spec.ts
npm run lint
npm run test
npm run test:e2e
npm run db:generate
npm run build
```

**Expected output**

```text
PASS  tests/e2e/learn.spec.ts
✔ Generated Prisma Client
✓ Compiled successfully
✓ Finalizing page optimization
```

## Success condition

This phase is complete when the application:

- exposes a protected `Learn!` hub and lesson detail route
- resolves lesson recommendations from the user’s latest Money Survival Blueprint
- renders humorous-but-practical story lessons with actionable takeaways
- lets users open Learn modules directly from the blueprint results
- surfaces Learn entry points from landing and dashboard
- passes targeted and full verification

## Why this is the right phase-2 cut

This plan keeps `Learn!` tightly coupled to the work already shipped:

- no schema churn unless later needed
- no duplicate recommendation logic
- no speculative AI content system
- immediate payoff from existing `learnModuleKeys`
- clear path to future extensions like completion tracking, topic packs, and job-readiness lessons
