# BudgetBITCH Phase 3 — Jobs + Connected Finance Foundation Plan

**Date:** 2026-04-06  
**Status:** Approved for execution  
**Project:** BudgetBITCH

## Goal

Ship a protected Phase 3 foundation that adds a practical Jobs module with blueprint-aware fit scoring, expands the connected-finance registry for banking/investing/payroll/tax providers, and links both into the user’s existing Money Survival Blueprint and Learn flows.

## Architecture

Use static/seeded job catalog data + deterministic fit scoring + thin API routes + protected App Router pages + expanded provider registry metadata.

The Phase 3 foundation should plug into the current app like this:

- `MoneyBlueprintSnapshot` already stores priorities, risk warnings, and learn recommendations
- `Jobs engine` maps blueprint signals into job fit scores and impact summaries
- `Jobs API` exposes searchable, filterable job results and recommended jobs for a workspace
- `Jobs pages` render the search hub and job detail/impact views
- `Integrations registry` expands from AI-only providers into banking / investing / payroll / tax guidance cards
- `Dashboard` surfaces both Jobs and Connected Finance entry points

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

- protected `/jobs` hub
- protected `/jobs/[slug]` detail route
- seeded job catalog with practical listing metadata
- canonical jobs filter schema
- deterministic fit-scoring engine tied to stored blueprint signals
- impact summary for “raise income fast”, “stabilize schedule”, and “build new career path”
- `POST /api/v1/jobs/search`
- `POST /api/v1/jobs/recommendations`
- provider registry expansion for banking / investing / payroll / tax / public-data categories
- integration hub updates to show the broader connected finance ecosystem
- dashboard and landing entry points for Jobs
- targeted unit/component/API/E2E coverage
- docs updates

### Explicitly excluded

- live job-board API ingestion
- user job applications, resumes, or messaging
- saved jobs / comparisons persistence
- actual bank or payroll OAuth flows
- live account balance sync
- automated financial actions based on connector data
- credential collection for new finance providers beyond the existing connect/revoke framework

## Task 1: Create the jobs filter schema and seeded job catalog

### Step 1: Write the failing tests

**Files:**

- `src/modules/jobs/job-schema.test.ts`
- `src/modules/jobs/job-catalog.test.ts`

**Code for** `src/modules/jobs/job-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { jobSearchFiltersSchema } from "./job-schema";

describe("jobSearchFiltersSchema", () => {
  it("accepts the practical job filter set from the design", () => {
    const result = jobSearchFiltersSchema.parse({
      title: "Customer Support",
      keyword: "remote",
      company: "Northstar",
      location: "Austin, TX",
      workplace: "remote",
      salaryMin: 45000,
      salaryMax: 70000,
      jobType: "full_time",
      industry: "support",
      experienceLevel: "entry",
      schedule: "daytime",
      benefits: ["healthcare"],
      visaStatus: "no_sponsorship_needed",
      postingAgeDays: 7,
      fitGoals: ["raise_income_fast", "stabilize_schedule"],
    });

    expect(result.workplace).toBe("remote");
    expect(result.fitGoals).toContain("raise_income_fast");
  });
});
```

**Code for** `src/modules/jobs/job-catalog.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getJobBySlug, listJobs } from "./job-catalog";

describe("job-catalog", () => {
  it("contains practical seeded listings with fit metadata", () => {
    const jobs = listJobs();

    expect(
      jobs.some((job) => job.slug === "remote-customer-support-specialist"),
    ).toBe(true);
    expect(
      jobs.some((job) => job.slug === "evening-medical-billing-coordinator"),
    ).toBe(true);
    expect(
      jobs.some((job) => job.slug === "junior-payroll-operations-analyst"),
    ).toBe(true);
  });

  it("supports lookup by slug", () => {
    expect(getJobBySlug("remote-customer-support-specialist")?.company).toBe(
      "Northstar",
    );
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/jobs/job-schema.test.ts"
npm run test -- "src/modules/jobs/job-catalog.test.ts"
```

**Expected output**

```text
FAIL  src/modules/jobs/job-schema.test.ts
FAIL  src/modules/jobs/job-catalog.test.ts
Error: Cannot find module './job-schema'
Error: Cannot find module './job-catalog'
```

### Step 3: Implement the schema and seeded catalog

**Files:**

- `src/modules/jobs/job-schema.ts`
- `src/modules/jobs/job-catalog.ts`

**Key implementation content:**

- `jobSearchFiltersSchema` validates:
  - title
  - keyword
  - company
  - location
  - workplace
  - salary range
  - job type
  - industry
  - experience level
  - schedule
  - benefits
  - visa status
  - posting age
  - fit goals
- `job-catalog.ts` exports:
  - `JobListing`
  - `JobFitGoal`
  - `jobListings`
  - `listJobs()`
  - `getJobBySlug()`

**Initial seeded listing set should cover**

- remote support
- shift-friendly admin work
- no-degree pathways
- caregiving-compatible roles
- second-job friendly roles
- payroll / ops roles
- entry finance / bookkeeping roles
- schedule-stable roles

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/jobs/job-schema.test.ts"
npm run test -- "src/modules/jobs/job-catalog.test.ts"
```

**Expected output**

```text
PASS  src/modules/jobs/job-schema.test.ts
PASS  src/modules/jobs/job-catalog.test.ts
Tests: 3 passed
```

## Task 2: Build blueprint-aware jobs fit scoring and impact summaries

### Step 1: Write the failing tests

**Files:**

- `src/modules/jobs/job-fit-engine.test.ts`
- `src/modules/jobs/blueprint-bridge.test.ts`

**Code for** `src/modules/jobs/blueprint-bridge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { extractJobSignalsFromBlueprint } from "./blueprint-bridge";

describe("extractJobSignalsFromBlueprint", () => {
  it("extracts stable jobs signals from a blueprint snapshot", () => {
    const result = extractJobSignalsFromBlueprint({
      priorityStack: ["cover_essentials", "stabilize_cash_flow"],
      riskWarnings: ["income_volatility_risk"],
      learnModuleKeys: ["income_variability"],
    });

    expect(result.priorityStack).toContain("stabilize_cash_flow");
    expect(result.riskWarnings).toContain("income_volatility_risk");
  });
});
```

**Code for** `src/modules/jobs/job-fit-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scoreJobsForBlueprint } from "./job-fit-engine";

describe("scoreJobsForBlueprint", () => {
  it("ranks jobs for stabilization and income-growth needs", () => {
    const result = scoreJobsForBlueprint({
      blueprint: {
        priorityStack: ["cover_essentials", "stabilize_cash_flow"],
        riskWarnings: ["income_volatility_risk"],
      },
      jobs: [
        {
          slug: "remote-customer-support-specialist",
          title: "Remote Customer Support Specialist",
          company: "Northstar",
          salaryMin: 48000,
          salaryMax: 62000,
          workplace: "remote",
          schedule: "daytime",
          fitSignals: ["stabilize_schedule", "raise_income_fast"],
        },
        {
          slug: "weekend-warehouse-loader",
          title: "Weekend Warehouse Loader",
          company: "BulkBird",
          salaryMin: 28000,
          salaryMax: 34000,
          workplace: "on_site",
          schedule: "weekend",
          fitSignals: ["second_job_friendly"],
        },
      ],
    });

    expect(result[0]?.slug).toBe("remote-customer-support-specialist");
    expect(result[0]?.fitSummary).toContain("stabilize schedule");
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/jobs/blueprint-bridge.test.ts"
npm run test -- "src/modules/jobs/job-fit-engine.test.ts"
```

### Step 3: Implement the fit engine

**Files:**

- `src/modules/jobs/blueprint-bridge.ts`
- `src/modules/jobs/job-fit-engine.ts`

**Key implementation content:**

- `extractJobSignalsFromBlueprint()` normalizes:
  - `priorityStack`
  - `riskWarnings`
  - `learnModuleKeys`
- `scoreJobsForBlueprint()`:
  - computes deterministic fit scores
  - rewards schedule stability when the blueprint prioritizes stabilization
  - rewards higher salary bands when the blueprint emphasizes income growth
  - surfaces fit summaries like:
    - “raise income fast”
    - “stabilize schedule”
    - “build a new career path”
- no hidden ML or external ranking services

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/jobs/blueprint-bridge.test.ts"
npm run test -- "src/modules/jobs/job-fit-engine.test.ts"
```

## Task 3: Add jobs search and recommendation API routes

### Step 1: Write the failing tests

**Files:**

- `src/app/api/v1/jobs/search/route.test.ts`
- `src/app/api/v1/jobs/recommendations/route.test.ts`

**Code for** `src/app/api/v1/jobs/search/route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/jobs/search", () => {
  it("filters seeded jobs by workplace, salary, and fit goals", async () => {
    const request = new Request("http://localhost/api/v1/jobs/search", {
      method: "POST",
      body: JSON.stringify({
        workplace: "remote",
        salaryMin: 45000,
        fitGoals: ["raise_income_fast"],
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.jobs.length).toBeGreaterThan(0);
    expect(json.jobs[0].workplace).toBe("remote");
  });
});
```

**Code for** `src/app/api/v1/jobs/recommendations/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: vi.fn().mockResolvedValue({
        blueprintJson: {
          priorityStack: ["cover_essentials", "stabilize_cash_flow"],
          riskWarnings: ["income_volatility_risk"],
          learnModuleKeys: ["income_variability"],
        },
      }),
    },
  }),
}));

describe("POST /api/v1/jobs/recommendations", () => {
  it("returns ranked jobs based on the latest blueprint", async () => {
    const request = new Request(
      "http://localhost/api/v1/jobs/recommendations",
      {
        method: "POST",
        body: JSON.stringify({ workspaceId: "demo_workspace" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.jobs.length).toBeGreaterThan(0);
    expect(json.jobs[0].fitSummary.length).toBeGreaterThan(0);
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/app/api/v1/jobs/search/route.test.ts"
npm run test -- "src/app/api/v1/jobs/recommendations/route.test.ts"
```

### Step 3: Implement the routes

**Files:**

- `src/app/api/v1/jobs/search/route.ts`
- `src/app/api/v1/jobs/recommendations/route.ts`

**Key implementation content:**

- `POST /api/v1/jobs/search`
  - validates filter payloads
  - filters the seeded job catalog
  - returns matched jobs with fit metadata
- `POST /api/v1/jobs/recommendations`
  - loads the latest `MoneyBlueprintSnapshot`
  - extracts job signals
  - ranks jobs with `scoreJobsForBlueprint()`
  - returns explainable fit summaries

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/app/api/v1/jobs/search/route.test.ts"
npm run test -- "src/app/api/v1/jobs/recommendations/route.test.ts"
```

## Task 4: Build the protected Jobs hub and job detail page

### Step 1: Write the failing tests

**Files:**

- `src/app/(app)/jobs/page.test.tsx`
- `src/app/(app)/jobs/[slug]/page.test.tsx`
- `src/components/jobs/job-card.test.tsx`

**Code for** `src/app/(app)/jobs/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import JobsPage from "./page";

describe("JobsPage", () => {
  it("renders the jobs hub with practical filters and recommended listings", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(
      screen.getByText("Income options that match real-life pressure."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Remote Customer Support Specialist"),
    ).toBeInTheDocument();
  });
});
```

**Code for** `src/app/(app)/jobs/[slug]/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import JobDetailPage from "./page";

describe("JobDetailPage", () => {
  it("renders the job details and fit impact summary", async () => {
    const view = await JobDetailPage({
      params: Promise.resolve({ slug: "remote-customer-support-specialist" }),
    });

    render(view);

    expect(
      screen.getByText("Remote Customer Support Specialist"),
    ).toBeInTheDocument();
    expect(screen.getByText("Why this fits")).toBeInTheDocument();
    expect(screen.getByText("Salary range")).toBeInTheDocument();
  });
});
```

**Code for** `src/components/jobs/job-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { JobCard } from "./job-card";

describe("JobCard", () => {
  it("renders job basics and an open-job link", () => {
    render(
      <JobCard
        job={{
          slug: "remote-customer-support-specialist",
          title: "Remote Customer Support Specialist",
          company: "Northstar",
          location: "Remote",
          salaryLabel: "$48k-$62k",
          fitSummary: "Good fit to stabilize schedule and raise income fast.",
        }}
      />,
    );

    expect(
      screen.getByText("Remote Customer Support Specialist"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open job/i })).toBeInTheDocument();
  });
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/app/(app)/jobs/page.test.tsx"
npm run test -- "src/app/(app)/jobs/[slug]/page.test.tsx"
npm run test -- "src/components/jobs/job-card.test.tsx"
```

### Step 3: Implement the Jobs UI

**Files:**

- `src/app/(app)/jobs/page.tsx`
- `src/app/(app)/jobs/[slug]/page.tsx`
- `src/components/jobs/job-card.tsx`
- `src/components/jobs/jobs-filter-panel.tsx`
- `src/components/jobs/job-fit-badge.tsx`

**Key implementation content:**

- `/jobs`
  - renders practical filter controls
  - shows recommended jobs and searchable results
- `/jobs/[slug]`
  - renders title, company, location, salary range, schedule, benefits, and fit impact summary
- `JobCard`
  - shows key listing data plus CTA
- `jobs-filter-panel.tsx`
  - exposes the approved filter set in compact form
- `job-fit-badge.tsx`
  - highlights practical fit signals

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/app/(app)/jobs/page.test.tsx"
npm run test -- "src/app/(app)/jobs/[slug]/page.test.tsx"
npm run test -- "src/components/jobs/job-card.test.tsx"
```

## Task 5: Expand the connected-finance registry and integration hub

### Step 1: Write the failing tests

**Files:**

- `src/modules/integrations/provider-registry.test.ts`
- `src/app/(app)/settings/integrations/page.test.tsx`

**Update** `src/modules/integrations/provider-registry.test.ts` to assert new connected-finance providers exist:

```ts
expect(providerRegistry.plaid.label).toBe("Plaid");
expect(providerRegistry.stripe.label).toBe("Stripe");
expect(providerRegistry.ramp.label).toBe("Ramp");
expect(providerRegistry.gusto.label).toBe("Gusto");
```

**Update** `src/app/(app)/settings/integrations/page.test.tsx` to assert the hub shows finance providers:

```tsx
expect(screen.getByText("Plaid")).toBeInTheDocument();
expect(screen.getByText("Stripe")).toBeInTheDocument();
expect(screen.getByText("Ramp")).toBeInTheDocument();
expect(screen.getByText("Gusto")).toBeInTheDocument();
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/modules/integrations/provider-registry.test.ts"
npm run test -- "src/app/(app)/settings/integrations/page.test.tsx"
```

### Step 3: Implement registry expansion

**Files:**

- `src/modules/integrations/provider-types.ts`
- `src/modules/integrations/provider-registry.ts`
- `src/app/(app)/settings/integrations/page.tsx`

**Key implementation content:**

- expand `ProviderId` with finance-focused providers, such as:
  - `plaid`
  - `stripe`
  - `ramp`
  - `gusto`
  - `quickbooks`
- add `category` field to provider definitions:
  - `ai`
  - `banking`
  - `investing`
  - `payroll`
  - `tax`
  - `finance_ops`
- group the hub visually by provider category
- keep the hub guidance-only for new providers in this slice; no new auth flows yet

### Step 4: Run the tests and verify success

**Commands**

```bash
npm run test -- "src/modules/integrations/provider-registry.test.ts"
npm run test -- "src/app/(app)/settings/integrations/page.test.tsx"
```

## Task 6: Wire Jobs and finance entry points into the dashboard, add E2E, update docs, and run full verification

### Step 1: Write the failing tests

**Files:**

- `src/app/(app)/dashboard/page.test.tsx`
- `tests/e2e/jobs.spec.ts`

**Update** `src/app/(app)/dashboard/page.test.tsx` to also assert:

```tsx
expect(screen.getByText("Jobs")).toBeInTheDocument();
expect(screen.getByRole("link", { name: /open jobs/i })).toBeInTheDocument();
expect(screen.getByText("Connected Finance")).toBeInTheDocument();
```

**Code for** `tests/e2e/jobs.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("user can open Jobs and review a blueprint-aware listing", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: /enter the magic/i }).click();
  await page.getByRole("link", { name: /jobs/i }).click();

  await expect(page.getByText("Jobs")).toBeVisible();
  await expect(
    page.getByText("Remote Customer Support Specialist"),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /open job/i })
    .first()
    .click();

  await expect(
    page.getByRole("heading", { name: "Remote Customer Support Specialist" }),
  ).toBeVisible();
  await expect(page.getByText("Why this fits")).toBeVisible();
});
```

### Step 2: Run the tests and verify failure

**Commands**

```bash
npm run test -- "src/app/(app)/dashboard/page.test.tsx"
npm run test:e2e -- tests/e2e/jobs.spec.ts
```

### Step 3: Implement wiring and docs updates

**Files:**

- `src/app/(app)/dashboard/page.tsx`
- `src/app/page.tsx`
- `middleware.ts`
- `README.md`
- `docs/CODEBASE_INDEX.md`
- `docs/DEV_TREE.md`

**Documentation updates to include**

- new protected routes:
  - `/jobs`
  - `/jobs/[slug]`
- new API endpoints:
  - `POST /api/v1/jobs/search`
  - `POST /api/v1/jobs/recommendations`
- expanded provider registry categories
- note that jobs are currently seeded + rule-ranked, not live-ingested from external job boards
- note that expanded finance providers are guidance-first metadata entries in this slice

### Step 4: Run full verification

**Commands**

```bash
npm run test:e2e -- tests/e2e/jobs.spec.ts
npm run lint
npm run test
npm run test:e2e
npm run db:generate
npm run build
```

## Success condition

This phase is complete when the application:

- exposes a protected `Jobs` hub and job detail route
- ranks seeded jobs using Money Survival Blueprint signals
- supports the approved practical filters and fit signals
- shows “why this job fits” in human-readable terms
- expands the connected-finance hub to include banking / investing / payroll / tax / finance-ops providers
- surfaces Jobs and Connected Finance entry points from the landing and dashboard flows
- passes targeted and full verification

## Why this Phase 3 cut is the right one

This keeps Phase 3 grounded in the architecture already shipped:

- it reuses `MoneyBlueprintSnapshot` instead of introducing a second recommendation brain
- it delivers real job-matching UX without forcing a third-party job API decision yet
- it expands the connector framework structurally before attempting risky live finance auth work
- it leaves room for a future Phase 3B covering:
  - saved jobs
  - comparisons
  - job-impact persistence
  - live job feeds
  - actual finance-provider auth flows
