# Adaptive Core Workflows Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt BudgetBITCH's core product surfaces so Start Smart, Jobs, and Learn feel deliberate and usable on mobile, tablet, desktop, and keyboard-first contexts without cloning another one-off route shell.

**Architecture:** Build one adaptive route-frame layer and a warmer token system first, then migrate each workflow onto it with context-specific composition. Keep the landing page's grounded editorial tone, but make product routes behave like practical work surfaces: one dominant task area, fluid secondary context, larger targets, and simpler semantics.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Playwright

---

## File Map

- Modify: `src/app/layout.tsx` — replace the generic font pairing with a more editorial, less templated pair that still performs well.
- Modify: `src/app/globals.css` — replace dark-only route-shell assumptions with warm adaptive tokens, fluid spacing, target-size utilities, and container-aware shell classes.
- Create: `src/components/app-shell/adaptive-route-frame.tsx` — shared responsive route frame with hero, summary rail, and content slots.
- Create: `src/components/app-shell/adaptive-route-frame.test.tsx` — verifies the shell renders headings, summary content, and mobile-first structure.
- Modify: `src/app/page.tsx` — align the landing page with the new typography and responsive spacing primitives.
- Modify: `src/app/page.test.tsx` — keep the landing route covered while typography and shell classes change.
- Modify: `src/components/start-smart/start-smart-shell.tsx` — rebuild Start Smart around a worksheet-style adaptive flow.
- Modify: `src/components/start-smart/template-picker.tsx` — replace incomplete tab semantics with an accessible segmented button group and responsive template grid.
- Modify: `src/components/start-smart/profile-form.tsx` — keep fields readable and touch-safe inside the new layout.
- Modify: `src/components/start-smart/blueprint-panel.tsx` — collapse secondary insight blocks for smaller containers without hiding core content.
- Modify: `src/components/start-smart/start-smart-shell.test.tsx` — verify mobile-first structure and action visibility.
- Modify: `src/app/(app)/start-smart/page.test.tsx` — keep the route-level rendering contract intact.
- Modify: `src/app/(app)/jobs/page.tsx` — convert Jobs into a queue-style adaptive board with fluid rails.
- Modify: `src/components/jobs/jobs-filter-panel.tsx` — turn the filter summary into a compact briefing surface that can stack or pin depending on width.
- Modify: `src/components/jobs/job-card.tsx` — enlarge actions, tighten metadata, and support stacked/mobile reading order.
- Modify: `src/components/jobs/job-card.test.tsx` — verify target size and CTA visibility.
- Modify: `src/app/(app)/jobs/page.test.tsx` — verify the lane board still renders with the new adaptive frame.
- Modify: `src/app/(app)/learn/page.tsx` — shift Learn to a readable field-guide layout that scales by viewport.
- Modify: `src/components/learn/recommended-lessons.tsx` — use container-aware lesson grouping instead of a fixed desktop grid.
- Modify: `src/components/learn/lesson-card.tsx` — improve tap targets, spacing rhythm, and reading flow.
- Modify: `src/components/learn/lesson-card.test.tsx` — verify readable rendering and CTA affordances.
- Modify: `src/app/(app)/learn/page.test.tsx` — verify Learn still exposes the expected cues after layout changes.
- Modify: `tests/e2e/start-smart.spec.ts` — add responsive assertions for the smallest supported viewport and tablet width.
- Modify: `tests/e2e/jobs.spec.ts` — verify queue behavior and CTA visibility on mobile.
- Modify: `tests/e2e/learn.spec.ts` — verify lesson cards remain actionable on mobile and desktop.
- Modify: `README.md` — document the adaptive route-frame principle and supported viewport expectations.
- Modify: `docs/CODEBASE_INDEX.md` — register the new shared shell and updated responsive responsibilities.
- Modify: `docs/DEV_TREE.md` — reflect the new `app-shell` component folder.

### Task 1: Build The Adaptive Visual Foundation

**Files:**
- Create: `src/components/app-shell/adaptive-route-frame.tsx`
- Create: `src/components/app-shell/adaptive-route-frame.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Modify: `src/app/page.test.tsx`

- [ ] **Step 1: Write the failing shell test**

```tsx
// src/components/app-shell/adaptive-route-frame.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdaptiveRouteFrame } from "./adaptive-route-frame";

describe("AdaptiveRouteFrame", () => {
  it("renders a single primary heading, summary rail, and main content slot", () => {
    render(
      <AdaptiveRouteFrame
        eyebrow="Start Smart"
        title="Build the first seven days"
        description="One dominant task area, one supporting summary rail."
        summary={<div>Summary rail</div>}
      >
        <div>Primary content</div>
      </AdaptiveRouteFrame>,
    );

    expect(
      screen.getByRole("heading", { name: /build the first seven days/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Summary rail")).toBeInTheDocument();
    expect(screen.getByText("Primary content")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/components/app-shell/adaptive-route-frame.test.tsx src/app/page.test.tsx -v`
Expected: FAIL with `Cannot find module './adaptive-route-frame'`

- [ ] **Step 3: Implement fonts, adaptive tokens, and the shared route frame**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const bodyFont = Public_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});
```

```css
/* src/app/globals.css */
:root {
  color-scheme: light;
  --page-bg: oklch(0.96 0.018 95);
  --page-ink: oklch(0.26 0.03 142);
  --page-muted: oklch(0.5 0.03 140);
  --surface-base: oklch(0.985 0.01 92);
  --surface-strong: oklch(0.93 0.02 95);
  --surface-accent: oklch(0.9 0.05 86);
  --stroke-soft: oklch(0.83 0.03 120);
  --stroke-strong: oklch(0.72 0.05 92);
  --accent-moss: oklch(0.55 0.1 150);
  --accent-gold: oklch(0.72 0.12 84);
  --shadow-soft: 0 22px 60px color-mix(in srgb, oklch(0.26 0.03 142) 14%, transparent);
  --space-shell: clamp(1rem, 2vw + 0.75rem, 2.5rem);
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --page-bg: oklch(0.22 0.025 150);
    --page-ink: oklch(0.96 0.01 92);
    --page-muted: oklch(0.82 0.02 110);
    --surface-base: oklch(0.28 0.03 150);
    --surface-strong: oklch(0.32 0.04 145);
    --surface-accent: oklch(0.36 0.05 90);
    --stroke-soft: oklch(0.42 0.03 130);
    --stroke-strong: oklch(0.68 0.07 88);
  }
}

.bb-route-frame {
  margin-inline: auto;
  max-width: 88rem;
  display: grid;
  gap: clamp(1rem, 1.4vw, 1.75rem);
  container-type: inline-size;
}

.bb-route-frame__hero,
.bb-route-frame__summary,
.bb-route-frame__content {
  border: 1px solid var(--stroke-soft);
  background: var(--surface-base);
  box-shadow: var(--shadow-soft);
}

.bb-route-frame__summary :where(a, button),
.bb-route-frame__content :where(a, button) {
  min-height: 2.75rem;
}

@container (min-width: 58rem) {
  .bb-route-frame {
    grid-template-columns: minmax(0, 1.3fr) minmax(18rem, 0.72fr);
    align-items: start;
  }

  .bb-route-frame__hero,
  .bb-route-frame__content {
    grid-column: 1;
  }

  .bb-route-frame__summary {
    grid-column: 2;
    grid-row: 1 / span 2;
    position: sticky;
    top: 1rem;
  }
}
```

```tsx
// src/components/app-shell/adaptive-route-frame.tsx
import type { ReactNode } from "react";

type AdaptiveRouteFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  summary?: ReactNode;
  children: ReactNode;
};

export function AdaptiveRouteFrame({
  eyebrow,
  title,
  description,
  summary,
  children,
}: AdaptiveRouteFrameProps) {
  return (
    <main className="bb-page-shell">
      <section className="bb-route-frame">
        <header className="bb-route-frame__hero rounded-[2rem] p-6 md:p-8">
          <p className="bb-kicker">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-[clamp(2rem,4vw,4.5rem)] font-semibold">
            {title}
          </h1>
          <p className="bb-copy mt-4 max-w-3xl">{description}</p>
        </header>

        {summary ? (
          <aside className="bb-route-frame__summary rounded-[1.75rem] p-5 md:p-6">{summary}</aside>
        ) : null}

        <section className="bb-route-frame__content rounded-[2rem] p-5 md:p-6">{children}</section>
      </section>
    </main>
  );
}
```

```tsx
// src/app/page.tsx
<motion.main
  key="main"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  className="bb-page-shell"
>
```

- [ ] **Step 4: Run the tests to verify the foundation passes**

Run: `npm test -- src/components/app-shell/adaptive-route-frame.test.tsx src/app/page.test.tsx -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/app/page.tsx src/app/page.test.tsx src/components/app-shell/adaptive-route-frame.tsx src/components/app-shell/adaptive-route-frame.test.tsx
git commit -m "feat: add adaptive route frame foundation"
```

### Task 2: Rebuild Start Smart As A Responsive Worksheet

**Files:**
- Modify: `src/components/start-smart/start-smart-shell.tsx`
- Modify: `src/components/start-smart/template-picker.tsx`
- Modify: `src/components/start-smart/profile-form.tsx`
- Modify: `src/components/start-smart/blueprint-panel.tsx`
- Modify: `src/components/start-smart/start-smart-shell.test.tsx`
- Modify: `src/app/(app)/start-smart/page.test.tsx`

- [ ] **Step 1: Write the failing Start Smart tests**

```tsx
// src/components/start-smart/start-smart-shell.test.tsx
it("uses plain button semantics for lane switching and keeps the primary action visible", () => {
  render(<StartSmartShell workspaceId="ws_123" />);

  expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /household basics/i })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /build my survival blueprint/i }),
  ).toBeInTheDocument();
});
```

```tsx
// src/app/(app)/start-smart/page.test.tsx
it("renders the worksheet headline and summary rail copy", async () => {
  render(await StartSmartPage());

  expect(
    screen.getByRole("heading", { name: /build your survival blueprint in one quick pass/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/assumption quality/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/components/start-smart/start-smart-shell.test.tsx src/app/'(app)'/start-smart/page.test.tsx -v`
Expected: FAIL because the current markup still exposes `role="tablist"`

- [ ] **Step 3: Implement the worksheet-style Start Smart layout**

```tsx
// src/components/start-smart/template-picker.tsx
<div className="mt-5 flex flex-wrap gap-2" aria-label="Template lanes">
  {lanes.map((lane) => {
    const isActive = lane === activeLane;

    return (
      <button
        key={lane}
        type="button"
        aria-pressed={isActive}
        onClick={() => setActiveLane(lane)}
        className={isActive ? "bb-segmented-button is-active" : "bb-segmented-button"}
      >
        {laneMeta[lane].label}
      </button>
    );
  })}
</div>
```

```tsx
// src/components/start-smart/start-smart-shell.tsx
import { AdaptiveRouteFrame } from "@/components/app-shell/adaptive-route-frame";

return (
  <AdaptiveRouteFrame
    eyebrow="Start Smart"
    title="Build your survival blueprint in one quick pass."
    description="Move through one compact worksheet, keep the assumptions visible, and read the plan without losing the thread on smaller screens."
    summary={
      <div className="grid gap-3">
        <article className="bb-summary-card">
          <p className="bb-kicker">Selected template</p>
          <p className="mt-2 text-lg font-semibold">{selectedTemplate?.label ?? "Single teen"}</p>
        </article>
        <article className="bb-summary-card">
          <p className="bb-kicker">Current step</p>
          <p className="mt-2 text-lg font-semibold">{formatStepLabel(step)}</p>
          <p className="bb-mini-copy mt-1">{wizardStepMeta[step].cue}</p>
        </article>
      </div>
    }
  >
    <div className="grid gap-5 @xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
      <div className="grid gap-5">
        <TemplatePicker
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          onSelect={handleTemplateSelect}
        />
        <ProfileForm
          values={values}
          fieldErrors={fieldErrors}
          onFieldChange={handleFieldChange}
        />
      </div>
      <BlueprintPanel result={result} isSubmitting={isSubmitting} errorMessage={errorMessage} />
    </div>
  </AdaptiveRouteFrame>
);
```

```tsx
// src/components/start-smart/blueprint-panel.tsx
<section className="bb-summary-card grid gap-4">
  <div className="grid gap-2 sm:grid-cols-2 @xl:grid-cols-1">
    {result?.blueprint.priorityStack.map((item) => (
      <div key={item} className="bb-inline-note">
        {item}
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Run the Start Smart tests to verify they pass**

Run: `npm test -- src/components/start-smart/start-smart-shell.test.tsx src/app/'(app)'/start-smart/page.test.tsx -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/start-smart/start-smart-shell.tsx src/components/start-smart/template-picker.tsx src/components/start-smart/profile-form.tsx src/components/start-smart/blueprint-panel.tsx src/components/start-smart/start-smart-shell.test.tsx src/app/'(app)'/start-smart/page.test.tsx
git commit -m "feat: adapt start smart for mobile and desktop"
```

### Task 3: Adapt Jobs Into A Queue-Style Recommendation Board

**Files:**
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/components/jobs/jobs-filter-panel.tsx`
- Modify: `src/components/jobs/job-card.tsx`
- Modify: `src/components/jobs/job-card.test.tsx`
- Modify: `src/app/(app)/jobs/page.test.tsx`

- [ ] **Step 1: Write the failing Jobs tests**

```tsx
// src/components/jobs/job-card.test.tsx
it("renders an obvious call to action with a touch-safe target", () => {
  render(<JobCard job={jobFixture} />);

  expect(screen.getByRole("link", { name: /open job/i })).toBeInTheDocument();
  expect(screen.getByText(/remote|hybrid|onsite/i)).toBeInTheDocument();
});
```

```tsx
// src/app/(app)/jobs/page.test.tsx
it("renders the adaptive jobs board headline and route brief", async () => {
  render(await JobsPage());

  expect(
    screen.getByRole("heading", { name: /quick job routes for real-life pressure/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /compact filter summary/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/components/jobs/job-card.test.tsx src/app/'(app)'/jobs/page.test.tsx -v`
Expected: FAIL after the new route-frame assertions are added and before the page is migrated

- [ ] **Step 3: Implement the queue-style Jobs layout**

```tsx
// src/app/(app)/jobs/page.tsx
import { AdaptiveRouteFrame } from "@/components/app-shell/adaptive-route-frame";

return (
  <AdaptiveRouteFrame
    eyebrow="Jobs"
    title="Quick job routes for real-life pressure."
    description="Scan one prioritized queue on mobile, keep a compact route brief on tablet, and open wider recommendation lanes on desktop."
    summary={
      <JobsFilterPanel
        filters={defaultFilters}
        jobCount={recommendedJobs.length}
        laneCount={jobLanes.length}
      />
    }
  >
    <div className="grid gap-4 @xl:grid-cols-2 @5xl:grid-cols-3">
      {jobLanes.map(({ key, title, summary, icon: Icon, jobs }) => (
        <section key={key} className="bb-lane-column" aria-labelledby={`${key}-heading`}>
          <div className="bb-lane-column__header">
            <Icon aria-hidden="true" className="h-5 w-5" />
            <div>
              <h2 id={`${key}-heading`} className="text-xl font-semibold">
                {title}
              </h2>
              <p className="bb-mini-copy mt-1">{summary}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {jobs.map((job) => (
              <JobCard key={job.slug} job={job} />
            ))}
          </div>
        </section>
      ))}
    </div>
  </AdaptiveRouteFrame>
);
```

```tsx
// src/components/jobs/jobs-filter-panel.tsx
<section aria-labelledby="jobs-filter-summary" className="grid gap-4">
  <div>
    <p className="bb-kicker">Route brief</p>
    <h2 id="jobs-filter-summary" className="mt-2 text-2xl font-semibold">
      Compact filter summary
    </h2>
  </div>

  <div className="grid gap-3 sm:grid-cols-3 @xl:grid-cols-1">
    {summaryChips.map(({ label, value, icon: Icon }) => (
      <div key={label} className="bb-summary-card flex items-center gap-3 px-4 py-3">
        <span className="bb-icon-badge">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <div>
          <p className="bb-kicker text-[0.65rem]">{label}</p>
          <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
      </div>
    ))}
  </div>
</section>
```

```tsx
// src/components/jobs/job-card.tsx
<Link
  href={`/jobs/${job.slug}`}
  className="bb-button-primary mt-5 w-full justify-between sm:w-auto"
>
  <span>Open job</span>
  <ArrowRight aria-hidden="true" className="h-4 w-4" />
</Link>
```

- [ ] **Step 4: Run the Jobs tests to verify they pass**

Run: `npm test -- src/components/jobs/job-card.test.tsx src/app/'(app)'/jobs/page.test.tsx -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/'(app)'/jobs/page.tsx src/components/jobs/jobs-filter-panel.tsx src/components/jobs/job-card.tsx src/components/jobs/job-card.test.tsx src/app/'(app)'/jobs/page.test.tsx
git commit -m "feat: adapt jobs board across viewports"
```

### Task 4: Turn Learn Into A Field-Guide Layout

**Files:**
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/components/learn/recommended-lessons.tsx`
- Modify: `src/components/learn/lesson-card.tsx`
- Modify: `src/components/learn/lesson-card.test.tsx`
- Modify: `src/app/(app)/learn/page.test.tsx`

- [ ] **Step 1: Write the failing Learn tests**

```tsx
// src/components/learn/lesson-card.test.tsx
it("keeps the lesson CTA and summary readable in the adaptive card", () => {
  render(<LessonCard lesson={lessonFixture} />);

  expect(screen.getByRole("link", { name: /open lesson/i })).toBeInTheDocument();
  expect(screen.getByText(lessonFixture.title)).toBeInTheDocument();
});
```

```tsx
// src/app/(app)/learn/page.test.tsx
it("renders the field-guide heading and story cues", async () => {
  render(await LearnPage());

  expect(
    screen.getByRole("heading", {
      name: /comic-strip lessons for the money move that matters next/i,
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /three fast scenes to anchor the idea/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm test -- src/components/learn/lesson-card.test.tsx src/app/'(app)'/learn/page.test.tsx -v`
Expected: FAIL after the new CTA and shell assertions are added and before Learn is migrated

- [ ] **Step 3: Implement the field-guide Learn layout**

```tsx
// src/app/(app)/learn/page.tsx
import { AdaptiveRouteFrame } from "@/components/app-shell/adaptive-route-frame";

return (
  <AdaptiveRouteFrame
    eyebrow="Learn"
    title="Comic-strip lessons for the money move that matters next."
    description="Lead with three readable cues on smaller screens, then let lesson groups open into a wider field guide on larger containers."
    summary={
      <div className="grid gap-3">
        {recommendations.explainers.map((explainer) => (
          <span key={explainer} className="bb-status-pill justify-center">
            {explainer}
          </span>
        ))}
      </div>
    }
  >
    <section className="grid gap-6">
      <div className="grid gap-4 @xl:grid-cols-3">
        {storyCues.map((cue) => (
          <article key={cue.key} className="bb-summary-card p-5">
            <p className="bb-kicker">{cue.category}</p>
            <h2 className="mt-2 text-xl font-semibold">{cue.title}</h2>
            <p className="bb-mini-copy mt-4">{cue.scene.plainEnglish}</p>
          </article>
        ))}
      </div>

      <RecommendedLessons
        eyebrow="Blueprint picks"
        title="Start here"
        description="Highest-signal lessons matched to your current blueprint pressure."
        lessons={recommendations.primary}
      />
    </section>
  </AdaptiveRouteFrame>
);
```

```tsx
// src/components/learn/recommended-lessons.tsx
<section className="bb-summary-card p-5 md:p-6">
  {eyebrow ? <p className="bb-kicker">{eyebrow}</p> : null}
  <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
  {description ? <p className="bb-mini-copy mt-2">{description}</p> : null}
  <div className="mt-5 grid gap-4 @xl:grid-cols-2">
    {lessons.map((lesson) => (
      <LessonCard key={lesson.slug} lesson={lesson} />
    ))}
  </div>
</section>
```

```tsx
// src/components/learn/lesson-card.tsx
<Link href={`/learn/${lesson.slug}`} className="bb-button-secondary mt-5 w-full justify-between sm:w-auto">
  <span>Open lesson</span>
  <ArrowRight aria-hidden="true" className="h-4 w-4" />
</Link>
```

- [ ] **Step 4: Run the Learn tests to verify they pass**

Run: `npm test -- src/components/learn/lesson-card.test.tsx src/app/'(app)'/learn/page.test.tsx -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/'(app)'/learn/page.tsx src/components/learn/recommended-lessons.tsx src/components/learn/lesson-card.tsx src/components/learn/lesson-card.test.tsx src/app/'(app)'/learn/page.test.tsx
git commit -m "feat: adapt learn field guide layouts"
```

### Task 5: Verify Responsive Behavior And Document The Pattern

**Files:**
- Modify: `tests/e2e/start-smart.spec.ts`
- Modify: `tests/e2e/jobs.spec.ts`
- Modify: `tests/e2e/learn.spec.ts`
- Modify: `README.md`
- Modify: `docs/CODEBASE_INDEX.md`
- Modify: `docs/DEV_TREE.md`

- [ ] **Step 1: Write the failing responsive E2E assertions**

```ts
// tests/e2e/start-smart.spec.ts
test("keeps the worksheet action visible on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/start-smart");

  await expect(
    page.getByRole("button", { name: /build my survival blueprint/i }),
  ).toBeVisible();
});
```

```ts
// tests/e2e/jobs.spec.ts
test("shows the route brief before the first job card on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/jobs");

  await expect(page.getByRole("heading", { name: /compact filter summary/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open job/i }).first()).toBeVisible();
});
```

```ts
// tests/e2e/learn.spec.ts
test("keeps lesson actions visible on tablet", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/learn");

  await expect(page.getByRole("link", { name: /open lesson/i }).first()).toBeVisible();
});
```

- [ ] **Step 2: Run the targeted E2E tests to verify they fail first**

Run: `npx playwright test tests/e2e/start-smart.spec.ts tests/e2e/jobs.spec.ts tests/e2e/learn.spec.ts --project=chromium`
Expected: FAIL on at least one mobile assertion before the adaptive layouts are complete

- [ ] **Step 3: Document the adaptive route-frame standard**

```md
<!-- README.md -->
## Adaptive Product Surfaces

BudgetBITCH uses one shared adaptive route frame for core app workflows.

- Mobile: one dominant task column, supporting context stacked after the primary action.
- Tablet: summary rail can sit beside the main task when space allows.
- Desktop: use fluid rails with `minmax()`, never fixed `320px` or `360px` route columns.
- Accessibility: primary actions stay touch-safe, headings stay singular, and segmented controls use plain button semantics unless a full tabs pattern is implemented.
```

```md
<!-- docs/CODEBASE_INDEX.md -->
- `src/components/app-shell/adaptive-route-frame.tsx`: shared responsive shell for Start Smart, Jobs, and Learn.
- `src/app/globals.css`: adaptive route tokens, spacing, and target-size primitives.
```

```md
<!-- docs/DEV_TREE.md -->
src/components/
  app-shell/
    adaptive-route-frame.tsx
    adaptive-route-frame.test.tsx
```

- [ ] **Step 4: Run the verification suite**

Run: `npm test -- src/components/app-shell/adaptive-route-frame.test.tsx src/components/start-smart/start-smart-shell.test.tsx src/components/jobs/job-card.test.tsx src/components/learn/lesson-card.test.tsx src/app/page.test.tsx src/app/'(app)'/start-smart/page.test.tsx src/app/'(app)'/jobs/page.test.tsx src/app/'(app)'/learn/page.test.tsx -v`
Expected: PASS

Run: `npx playwright test tests/e2e/start-smart.spec.ts tests/e2e/jobs.spec.ts tests/e2e/learn.spec.ts --project=chromium`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/start-smart.spec.ts tests/e2e/jobs.spec.ts tests/e2e/learn.spec.ts README.md docs/CODEBASE_INDEX.md docs/DEV_TREE.md
git commit -m "docs: capture adaptive workflow standard"
```

## Self-Review

- Spec coverage: the plan covers the adaptation challenge across mobile, tablet, desktop, and accessibility contexts for the core product workflows rather than treating responsiveness as a visual afterthought.
- Placeholder scan: no `TODO`, `TBD`, or "handle later" placeholders remain; each task names exact files, test cases, commands, and code targets.
- Type consistency: the shared shell is named `AdaptiveRouteFrame` throughout, and the route migrations consistently use the same summary/content contract.