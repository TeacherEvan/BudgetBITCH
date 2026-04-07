# Cross-App Color System Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a warmer, more purposeful color system across BudgetBITCH by differentiating the root app's Learn, Jobs, and Integrations flows while fully aligning the nested `budgetbitch/` prototype with the same Irish-leaning brand palette.

**Architecture:** Keep the color strategy centralized in shared CSS variables and one reusable operational route shell so route pages stop hard-coding the same emerald gradient and frosted panel recipe. Push color decisions down into shared cards and badges with semantic variants, then bring the nested prototype onto the same palette with a small branded layout refresh and lightweight UI verification.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library

---

## File Map

- Create: `src/components/app/experience-shell.tsx` — shared route shell for the root app's operational pages.
- Create: `src/components/app/experience-shell.test.tsx` — render test for route shell variants and structure.
- Modify: `src/app/globals.css` — add route-theme tokens and shared shell/card utilities.
- Modify: `src/app/(app)/learn/page.tsx` — swap the repeated radial-gradient shell for the shared themed shell.
- Modify: `src/app/(app)/learn/page.test.tsx` — verify Learn renders inside the new route theme.
- Modify: `src/components/learn/recommended-lessons.tsx` — switch generic white-on-dark panel styling to themed surfaces.
- Modify: `src/components/learn/lesson-card.tsx` — introduce warmer lesson accents and clearer scene hierarchy.
- Modify: `src/components/learn/lesson-card.test.tsx` — verify the lesson CTA and scene content still render after the restyle.
- Modify: `src/app/(app)/jobs/page.tsx` — move Jobs to the shared shell and a clay-forward lane palette.
- Modify: `src/app/(app)/jobs/page.test.tsx` — verify Jobs uses the themed shell and retains recommendation content.
- Modify: `src/components/jobs/jobs-filter-panel.tsx` — convert the filter summary to a more color-meaningful card.
- Modify: `src/components/jobs/job-card.tsx` — add lane-aware accents and stronger CTA hierarchy.
- Modify: `src/components/jobs/job-card.test.tsx` — verify job metadata and CTA survive the restyle.
- Modify: `src/app/(app)/settings/integrations/page.tsx` — move Integrations to the shared shell and a trust-forward palette.
- Modify: `src/app/(app)/settings/integrations/page.test.tsx` — verify grouped category rendering still works inside the new shell.
- Modify: `src/components/integrations/provider-card.tsx` — add semantic risk color treatments and warmer trust surfaces.
- Modify: `src/components/integrations/provider-card.test.tsx` — verify setup/login actions and risk labels still render.
- Modify: `docs/CODEBASE_INDEX.md` — add the shared shell as a UI entry point.
- Modify: `docs/DEV_TREE.md` — reflect the new `src/components/app/` subtree.
- Modify: `budgetbitch/package.json` — add minimal test dependencies and a `test` script for the nested app.
- Create: `budgetbitch/vitest.config.ts` — test config for the nested prototype app.
- Create: `budgetbitch/test/setup.ts` — DOM matchers setup for nested app tests.
- Create: `budgetbitch/app/page.test.tsx` — smoke test for the recolored nested landing page.
- Modify: `budgetbitch/app/globals.css` — replace grayscale starter tokens with warm brand tokens.
- Modify: `budgetbitch/app/layout.tsx` — update metadata to BudgetBITCH branding.
- Modify: `budgetbitch/app/page.tsx` — replace the starter view with a branded home screen that uses the new palette.

## Color Strategy

- **Dominant color (60%)**: moss/forest greens for trustworthy structure, active surfaces, and primary actions.
- **Secondary color (30%)**: warm clay and parchment tones for route separation, card warmth, and background tint.
- **Accent color (10%)**: brass/gold for headers, kickers, and memorable emphasis.
- **Semantic colors**: emerald for low-risk success, amber for medium-risk caution, rose-clay for high-risk warnings.
- **Application strategy**: Learn gets a moss-and-parchment teaching palette, Jobs gets a clay-and-moss urgency palette, Integrations gets a brass-and-forest trust palette, and the nested app adopts warm neutral backgrounds with the same action colors so it no longer looks like an untouched template.

### Task 1: Build the Shared Route Theme Foundation

**Files:**
- Create: `src/components/app/experience-shell.tsx`
- Create: `src/components/app/experience-shell.test.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing route-shell test**

```tsx
// src/components/app/experience-shell.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExperienceShell } from "./experience-shell";

describe("ExperienceShell", () => {
  it("renders a learn-themed operational shell with header and aside content", () => {
    render(
      <ExperienceShell
        variant="learn"
        kicker="Learn!"
        title="Read the next right thing"
        intro="Small cues first, then the full lesson."
        aside={<div>Theme chips</div>}
      >
        <div>Lesson grid</div>
      </ExperienceShell>,
    );

    expect(screen.getByRole("main")).toHaveAttribute("data-route-theme", "learn");
    expect(screen.getByText("Read the next right thing")).toBeInTheDocument();
    expect(screen.getByText("Theme chips")).toBeInTheDocument();
    expect(screen.getByText("Lesson grid")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- src/components/app/experience-shell.test.tsx -v`
Expected: FAIL with `Cannot find module './experience-shell'`

- [ ] **Step 3: Add the shared route-shell component**

```tsx
// src/components/app/experience-shell.tsx
import type { ReactNode } from "react";

type ExperienceVariant = "learn" | "jobs" | "integrations";

type ExperienceShellProps = {
  variant: ExperienceVariant;
  kicker: string;
  title: string;
  intro: string;
  aside?: ReactNode;
  children: ReactNode;
};

export function ExperienceShell({
  variant,
  kicker,
  title,
  intro,
  aside,
  children,
}: ExperienceShellProps) {
  return (
    <main className="bb-page-shell bb-route-shell" data-route-theme={variant}>
      <section className="bb-route-frame">
        <header className="bb-route-hero">
          <div className="bb-route-copy">
            <p className="bb-kicker bb-route-kicker">{kicker}</p>
            <h1 className="bb-route-title">{title}</h1>
            <p className="bb-copy bb-route-intro">{intro}</p>
          </div>
          {aside ? <aside className="bb-route-aside">{aside}</aside> : null}
        </header>
        <div className="bb-route-body">{children}</div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add the root route-theme tokens and shell utilities**

```css
/* src/app/globals.css */
:root {
  --route-learn-top: oklch(0.9 0.06 145);
  --route-learn-bottom: oklch(0.28 0.06 165);
  --route-jobs-top: oklch(0.86 0.08 60);
  --route-jobs-bottom: oklch(0.3 0.05 42);
  --route-integrations-top: oklch(0.88 0.05 98);
  --route-integrations-bottom: oklch(0.24 0.03 150);
  --route-paper: oklch(0.97 0.015 95);
  --route-ink: oklch(0.23 0.03 158);
  --route-gold: oklch(0.82 0.11 85);
  --route-clay: oklch(0.72 0.09 42);
}

@layer components {
  .bb-route-shell {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, var(--route-top) 0%, transparent 42%),
      radial-gradient(circle at bottom right, var(--route-bottom) 0%, transparent 48%),
      linear-gradient(180deg, color-mix(in oklch, var(--route-paper) 20%, var(--route-ink) 80%), var(--route-ink));
  }

  .bb-route-shell[data-route-theme="learn"] {
    --route-top: var(--route-learn-top);
    --route-bottom: var(--route-learn-bottom);
    --route-accent: var(--start-smart-green);
    --route-accent-strong: var(--route-gold);
  }

  .bb-route-shell[data-route-theme="jobs"] {
    --route-top: var(--route-jobs-top);
    --route-bottom: var(--route-jobs-bottom);
    --route-accent: var(--route-clay);
    --route-accent-strong: var(--start-smart-green);
  }

  .bb-route-shell[data-route-theme="integrations"] {
    --route-top: var(--route-integrations-top);
    --route-bottom: var(--route-integrations-bottom);
    --route-accent: var(--route-gold);
    --route-accent-strong: var(--start-smart-green);
  }

  .bb-route-frame {
    margin-inline: auto;
    max-width: 80rem;
    border: 1px solid color-mix(in oklch, var(--route-accent) 24%, transparent 76%);
    border-radius: 2.25rem;
    background: color-mix(in oklch, var(--route-ink) 78%, var(--route-paper) 22%);
    box-shadow: 0 28px 90px color-mix(in srgb, black 72%, transparent 28%);
    padding: clamp(1.5rem, 2vw, 2rem);
  }

  .bb-route-hero {
    display: grid;
    gap: 1.5rem;
  }

  @media (min-width: 80rem) {
    .bb-route-hero {
      grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
      align-items: start;
    }
  }

  .bb-route-title {
    margin-top: 0.75rem;
    font-size: clamp(2.2rem, 4vw, 3.4rem);
  }

  .bb-route-intro {
    max-width: 42rem;
    color: color-mix(in oklch, var(--route-paper) 78%, var(--route-accent) 22%);
  }

  .bb-route-aside,
  .bb-route-panel,
  .bb-route-card {
    border: 1px solid color-mix(in oklch, var(--route-accent) 22%, transparent 78%);
    background: color-mix(in oklch, var(--route-paper) 8%, var(--route-ink) 92%);
    border-radius: 1.75rem;
  }
}
```

- [ ] **Step 5: Run the shell test to verify it passes**

Run: `npm test -- src/components/app/experience-shell.test.tsx -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/app/experience-shell.tsx src/components/app/experience-shell.test.tsx src/app/globals.css
git commit -m "feat: add themed operational route shell"
```

### Task 2: Recolor Learn and Jobs Around Distinct Route Roles

**Files:**
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/app/(app)/learn/page.test.tsx`
- Modify: `src/components/learn/recommended-lessons.tsx`
- Modify: `src/components/learn/lesson-card.tsx`
- Modify: `src/components/learn/lesson-card.test.tsx`
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/app/(app)/jobs/page.test.tsx`
- Modify: `src/components/jobs/jobs-filter-panel.tsx`
- Modify: `src/components/jobs/job-card.tsx`
- Modify: `src/components/jobs/job-card.test.tsx`

- [ ] **Step 1: Update the route tests to assert the new themed shells**

```tsx
// src/app/(app)/learn/page.test.tsx
import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders the Learn hub inside the learn route theme", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByRole("main")).toHaveAttribute("data-route-theme", "learn");
    expect(screen.getByRole("heading", { name: "Three fast scenes to anchor the idea" })).toBeInTheDocument();
    expect(screen.getByText("Signal field")).toBeInTheDocument();
  });
});
```

```tsx
// src/app/(app)/jobs/page.test.tsx
import { render, screen } from "@testing-library/react";
import JobsPage from "./page";

describe("JobsPage", () => {
  it("renders the Jobs hub inside the jobs route theme", async () => {
    const view = await JobsPage();
    render(view);

    expect(screen.getByRole("main")).toHaveAttribute("data-route-theme", "jobs");
    expect(screen.getByRole("heading", { name: "Quick route board" })).toBeInTheDocument();
    expect(screen.getByText("Relief lanes")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the Learn and Jobs tests to verify they fail**

Run: `npm test -- "src/app/(app)/learn/page.test.tsx" "src/app/(app)/jobs/page.test.tsx" -v`
Expected: FAIL because the pages still render the old hard-coded shell and new copy is absent

- [ ] **Step 3: Move Learn to the shared shell and warmer teaching surfaces**

```tsx
// src/app/(app)/learn/page.tsx
import { ExperienceShell } from "@/components/app/experience-shell";
import { RecommendedLessons } from "@/components/learn/recommended-lessons";

export default async function LearnPage() {
  const recommendations = await getLearnRecommendations();
  const storyCues = [...recommendations.primary, ...recommendations.evergreen].slice(0, 3);

  return (
    <ExperienceShell
      variant="learn"
      kicker="Learn!"
      title="Comic-strip lessons for the money move that matters next."
      intro="Skip the explainer wall. Start with visual cues, then open the lesson when you want the deeper breakdown."
      aside={
        <div className="bb-route-panel p-5">
          <p className="bb-kicker">Signal field</p>
          <p className="bb-mini-copy mt-3 text-(--text-2)">
            Each cue card uses moss for explanation, brass for emphasis, and warm paper tones so the page reads faster than the old monochrome glass stack.
          </p>
        </div>
      }
    >
      <section aria-labelledby="story-cues-heading" className="mt-8">
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {storyCues.map((cue) => (
            <article key={cue.key} className="bb-route-card p-5">
              <p className="bb-kicker">{cue.category}</p>
              <h2 className="mt-3 text-2xl font-semibold">{cue.title}</h2>
              <p className="bb-mini-copy mt-4 text-(--text-2)">{cue.scenes[0].plainEnglish}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6">
        <RecommendedLessons
          eyebrow="Blueprint picks"
          title="Start here"
          description="Highest-signal lessons matched to your current blueprint pressure."
          lessons={recommendations.primary}
        />
        <RecommendedLessons
          eyebrow="Keep the streak"
          title="Next up"
          description="Evergreen refreshers when you want one more useful concept without a long scroll."
          lessons={recommendations.evergreen.slice(0, 4)}
        />
      </div>
    </ExperienceShell>
  );
}
```

```tsx
// src/components/learn/recommended-lessons.tsx
export function RecommendedLessons({ eyebrow, title, description, lessons }: RecommendedLessonsProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <section className="bb-route-panel p-5 md:p-6">
      {eyebrow ? <p className="bb-kicker">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      {description ? <p className="bb-mini-copy mt-2 text-(--text-2)">{description}</p> : null}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.slug} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
```

```tsx
// src/components/learn/lesson-card.tsx
export function LessonCard({ lesson }: LessonCardProps) {
  const leadScene = lesson.scenes[0];

  return (
    <article className="bb-route-card p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="bb-kicker">{lesson.category}</p>
        <div className="flex flex-wrap gap-2">
          {lesson.takeaways.slice(0, 2).map((takeaway) => (
            <span
              key={takeaway}
              className="rounded-full border border-[color:color-mix(in_oklch,var(--route-accent)_24%,transparent)] bg-[color:color-mix(in_oklch,var(--route-paper)_12%,transparent)] px-3 py-1 text-xs text-[color:var(--text-2)]"
            >
              {takeaway}
            </span>
          ))}
        </div>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-white">{lesson.title}</h3>
      <p className="mt-2 text-sm text-[color:var(--text-2)]">{lesson.summary}</p>

      <div className="mt-4 grid gap-3 rounded-2xl bg-[color:color-mix(in_oklch,var(--route-paper)_10%,transparent)] p-4 text-sm text-[color:var(--text-2)]">
        <p>{leadScene.absurdScenario}</p>
        <p>{lesson.whyItMatters}</p>
      </div>

      <Link
        href={`/learn/${lesson.slug}`}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[color:var(--route-accent-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--route-ink)] transition hover:brightness-105"
      >
        {lesson.nextActionLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}
```

- [ ] **Step 4: Move Jobs to the shared shell and clay-forward urgency palette**

```tsx
// src/app/(app)/jobs/page.tsx
import { ExperienceShell } from "@/components/app/experience-shell";
import { JobCard } from "@/components/jobs/job-card";
import { JobsFilterPanel } from "@/components/jobs/jobs-filter-panel";

export default async function JobsPage() {
  const recommendedJobs = await getRecommendedJobs();
  const jobLanes = groupJobsIntoLanes(recommendedJobs);

  return (
    <ExperienceShell
      variant="jobs"
      kicker="Jobs"
      title="Quick job routes for real-life pressure."
      intro="Scan the board by the kind of relief you need next instead of reading a wall of job copy."
      aside={
        <div className="bb-route-panel p-5">
          <p className="bb-kicker">Relief lanes</p>
          <p className="bb-mini-copy mt-3 text-(--text-2)">
            Clay-tinted lane markers carry urgency, moss handles action buttons, and warm surfaces stop the board from collapsing into one dark slab.
          </p>
        </div>
      }
    >
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <JobsFilterPanel filters={defaultFilters} jobCount={recommendedJobs.length} laneCount={jobLanes.length} />
        <section aria-labelledby="recommendation-board-heading">
          <h2 id="recommendation-board-heading" className="text-2xl font-semibold text-white">
            Quick route board
          </h2>
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {jobLanes.map(({ key, title, summary, jobs }) => (
              <section key={key} className="bb-route-card p-4" aria-labelledby={`${key}-heading`}>
                <h3 id={`${key}-heading`} className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-[color:var(--text-2)]">{summary}</p>
                <div className="mt-4 grid gap-3">
                  {jobs.map((job) => (
                    <JobCard key={job.slug} job={job} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </ExperienceShell>
  );
}
```

```tsx
// src/components/jobs/jobs-filter-panel.tsx
export function JobsFilterPanel({ filters, jobCount, laneCount }: JobsFilterPanelProps) {
  return (
    <section aria-labelledby="jobs-filter-summary" className="bb-route-panel p-5 text-white">
      <p className="bb-kicker">Route brief</p>
      <h2 id="jobs-filter-summary" className="mt-2 text-xl font-semibold text-white">
        Compact filter summary
      </h2>
      <p className="mt-2 text-sm text-[color:var(--text-2)]">
        Keep the board tight: remote-first, salary-floor guarded, and matched to the most urgent blueprint goals.
      </p>
      <div className="mt-5 grid gap-3">
        {summaryChips.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-[color:color-mix(in_oklch,var(--route-paper)_10%,transparent)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[color:color-mix(in_oklch,var(--route-accent)_18%,transparent)] p-2 text-white">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{label}</p>
                <p className="mt-1 text-sm font-medium text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-[color:var(--text-2)]">{jobCount} seeded matches are already sorted into fast-scan recommendation lanes.</p>
    </section>
  );
}
```

```tsx
// src/components/jobs/job-card.tsx
export function JobCard({ job }: JobCardProps) {
  return (
    <article className="rounded-[24px] border border-[color:color-mix(in_oklch,var(--route-accent)_24%,transparent)] bg-[color:color-mix(in_oklch,var(--route-paper)_8%,transparent)] p-4 text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bb-kicker">{job.company}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{job.title}</h3>
        </div>
        <span className="rounded-full bg-[color:color-mix(in_oklch,var(--route-accent)_18%,transparent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {formatLabel(job.workplace)}
        </span>
      </div>

      <p className="mt-4 text-sm text-[color:var(--text-2)]">{job.summary}</p>

      <Link
        href={`/jobs/${job.slug}`}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[color:var(--route-accent-strong)] px-4 py-2 text-sm font-semibold text-[color:var(--route-ink)] transition hover:brightness-105"
      >
        Open job
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}
```

- [ ] **Step 5: Run the focused Learn and Jobs test suite to verify it passes**

Run: `npm test -- "src/app/(app)/learn/page.test.tsx" "src/components/learn/lesson-card.test.tsx" "src/app/(app)/jobs/page.test.tsx" "src/components/jobs/job-card.test.tsx" -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/learn/page.tsx src/app/(app)/learn/page.test.tsx src/components/learn/recommended-lessons.tsx src/components/learn/lesson-card.tsx src/components/learn/lesson-card.test.tsx src/app/(app)/jobs/page.tsx src/app/(app)/jobs/page.test.tsx src/components/jobs/jobs-filter-panel.tsx src/components/jobs/job-card.tsx src/components/jobs/job-card.test.tsx
git commit -m "feat: give learn and jobs distinct route palettes"
```

### Task 3: Recolor Integrations With Trust-First Semantic States

**Files:**
- Modify: `src/app/(app)/settings/integrations/page.tsx`
- Modify: `src/app/(app)/settings/integrations/page.test.tsx`
- Modify: `src/components/integrations/provider-card.tsx`
- Modify: `src/components/integrations/provider-card.test.tsx`

- [ ] **Step 1: Update the Integrations tests to assert the new shell and risk semantics**

```tsx
// src/app/(app)/settings/integrations/page.test.tsx
import { render, screen } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders the connection hub inside the integrations theme", () => {
    render(<IntegrationsPage />);

    expect(screen.getByRole("main")).toHaveAttribute("data-route-theme", "integrations");
    expect(screen.getByText("Trust map")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "AI copilots" })).toBeInTheDocument();
  });
});
```

```tsx
// src/components/integrations/provider-card.test.tsx
import { providerRegistry } from "@/modules/integrations/provider-registry";
import { render, screen } from "@testing-library/react";
import { ProviderCard } from "./provider-card";

describe("ProviderCard", () => {
  it("renders semantic risk labels as visible text inside the warm trust card", () => {
    render(<ProviderCard provider={providerRegistry.openclaw} />);

    expect(screen.getByText("High risk")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /setup wizard/i })).toHaveAttribute(
      "href",
      "/settings/integrations/openclaw",
    );
  });
});
```

- [ ] **Step 2: Run the Integrations tests to verify they fail**

Run: `npm test -- "src/app/(app)/settings/integrations/page.test.tsx" "src/components/integrations/provider-card.test.tsx" -v`
Expected: FAIL because the page does not yet use the shared shell and the new trust-map copy is missing

- [ ] **Step 3: Move Integrations to the shared shell and trust-map header**

```tsx
// src/app/(app)/settings/integrations/page.tsx
import { ExperienceShell } from "@/components/app/experience-shell";
import { ProviderCard } from "@/components/integrations/provider-card";

export default function IntegrationsPage() {
  return (
    <ExperienceShell
      variant="integrations"
      kicker="Connection Hub"
      title="Connect only the providers you can scan and trust fast."
      intro="Every group leads with the official route, the risk level, and the easiest next action so you can move without reading a giant safety essay first."
      aside={
        <div className="bb-route-panel p-5">
          <p className="bb-kicker">Trust map</p>
          <p className="bb-mini-copy mt-3 text-(--text-2)">
            Brass highlights explain hierarchy, warm surfaces replace cold glass, and semantic risk colors make caution readable without turning the whole page into alarm red.
          </p>
        </div>
      }
    >
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {["Official routes first", "No silent sharing", "Revoke path stays obvious"].map((item) => (
          <div key={item} className="bb-route-card px-4 py-3 text-sm text-[color:var(--text-2)]">
            {item}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6">
        {Object.entries(providersByCategory).map(([category, providers]) => {
          if (providers.length === 0) {
            return null;
          }

          const meta = categoryMeta[category as ProviderCategory];

          return (
            <section key={category} aria-labelledby={`${category}-heading`} className="bb-route-panel p-5 md:p-6">
              <p className="bb-kicker">Grouped scan</p>
              <h2 id={`${category}-heading`} className="mt-2 text-2xl font-semibold text-white">
                {meta.label}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-[color:var(--text-2)]">{meta.summary}</p>
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </ExperienceShell>
  );
}
```

- [ ] **Step 4: Give provider cards semantic risk color accents**

```tsx
// src/components/integrations/provider-card.tsx
const riskStyles: Record<ProviderDefinition["riskLevel"], { label: string; className: string }> = {
  low: {
    label: "Low risk",
    className:
      "border-[color:color-mix(in_oklch,var(--start-smart-green)_40%,transparent)] bg-[color:color-mix(in_oklch,var(--start-smart-green)_16%,transparent)] text-white",
  },
  medium: {
    label: "Medium risk",
    className:
      "border-[color:color-mix(in_oklch,var(--route-gold)_42%,transparent)] bg-[color:color-mix(in_oklch,var(--route-gold)_16%,transparent)] text-white",
  },
  high: {
    label: "High risk",
    className:
      "border-[color:color-mix(in_oklch,oklch(0.68_0.14_22)_46%,transparent)] bg-[color:color-mix(in_oklch,oklch(0.68_0.14_22)_16%,transparent)] text-white",
  },
};

export function ProviderCard({ provider }: ProviderCardProps) {
  const riskStyle = riskStyles[provider.riskLevel];

  return (
    <article className="bb-route-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="bb-kicker">{provider.category.replaceAll("_", " ")}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{provider.label}</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${riskStyle.className}`}>
          {riskStyle.label}
        </span>
      </div>

      <p className="mt-3 text-sm text-[color:var(--text-2)]">{categorySummary[provider.category]}</p>

      <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--route-accent-strong)] px-4 py-2 font-semibold text-[color:var(--route-ink)] transition hover:brightness-105"
          href={provider.setupPath ?? provider.officialDocsUrl}
        >
          {provider.setupPath ? "Setup wizard" : "Guidance only"}
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <a className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-white transition hover:bg-white/8" href={provider.officialLoginUrl}>
          Official login
        </a>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Run the Integrations tests to verify they pass**

Run: `npm test -- "src/app/(app)/settings/integrations/page.test.tsx" "src/components/integrations/provider-card.test.tsx" -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/(app)/settings/integrations/page.tsx src/app/(app)/settings/integrations/page.test.tsx src/components/integrations/provider-card.tsx src/components/integrations/provider-card.test.tsx
git commit -m "feat: restyle integrations with trust-first color semantics"
```

### Task 4: Bring the Nested Prototype Onto the Same Brand Palette

**Files:**
- Modify: `budgetbitch/package.json`
- Create: `budgetbitch/vitest.config.ts`
- Create: `budgetbitch/test/setup.ts`
- Create: `budgetbitch/app/page.test.tsx`
- Modify: `budgetbitch/app/globals.css`
- Modify: `budgetbitch/app/layout.tsx`
- Modify: `budgetbitch/app/page.tsx`

- [ ] **Step 1: Add a failing smoke test for the nested app home page**

```tsx
// budgetbitch/app/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  Authenticated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Unauthenticated: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMutation: () => vi.fn(),
  useQuery: () => ({ viewer: "Budget Person", numbers: [1, 4, 7] }),
}));

vi.mock("@workos-inc/authkit-nextjs/components", () => ({
  useAuth: () => ({
    user: { email: "budget@example.com" },
    signOut: vi.fn(),
  }),
}));

import Home from "./page";

describe("nested Home page", () => {
  it("renders the branded budget console instead of the starter template", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "BudgetBITCH Console" })).toBeInTheDocument();
    expect(screen.getByText("Numbers, access, and quick actions in one warm control surface.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open server route/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the nested test to verify it fails**

Run: `cd budgetbitch && npm test -- app/page.test.tsx -v`
Expected: FAIL because the nested app does not yet expose a `test` script or the new branded content

- [ ] **Step 3: Add minimal test tooling for the nested app**

```json
// budgetbitch/package.json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "jsdom": "^29.0.1",
    "vitest": "^4.1.2"
  }
}
```

```ts
// budgetbitch/vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
});
```

```ts
// budgetbitch/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Replace the nested starter UI with a branded warm-console layout**

```tsx
// budgetbitch/app/layout.tsx
export const metadata: Metadata = {
  title: "BudgetBITCH Prototype",
  description: "Warm prototype console for BudgetBITCH integrations and number tracking.",
  icons: {
    icon: "/convex.svg",
  },
};
```

```css
/* budgetbitch/app/globals.css */
:root {
  --background: oklch(0.97 0.015 95);
  --foreground: oklch(0.24 0.03 158);
  --surface: oklch(0.99 0.01 95);
  --surface-strong: oklch(0.27 0.04 160);
  --moss: oklch(0.62 0.11 152);
  --clay: oklch(0.72 0.08 42);
  --gold: oklch(0.82 0.11 85);
}

body {
  color: var(--foreground);
  background:
    radial-gradient(circle at top left, color-mix(in oklch, var(--gold) 24%, transparent) 0%, transparent 42%),
    radial-gradient(circle at bottom right, color-mix(in oklch, var(--moss) 22%, transparent) 0%, transparent 45%),
    var(--background);
  font-family: var(--font-geist-sans), sans-serif;
}
```

```tsx
// budgetbitch/app/page.tsx
export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--gold)]">BudgetBITCH</p>
          <h1 className="mt-2 text-4xl font-semibold text-[color:var(--foreground)]">BudgetBITCH Console</h1>
        </div>
        {user ? <UserMenu user={user} onSignOut={signOut} /> : null}
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section className="rounded-[32px] border border-black/8 bg-[color:var(--surface)] p-8 shadow-[0_28px_90px_rgba(18,32,24,0.12)]">
          <p className="max-w-2xl text-lg text-[color:color-mix(in_oklch,var(--foreground)_78%,var(--moss)_22%)]">
            Numbers, access, and quick actions in one warm control surface.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/sign-in" className="inline-flex min-h-11 items-center rounded-full bg-[color:var(--moss)] px-5 py-2 font-semibold text-[color:var(--surface-strong)]">
              Sign in
            </a>
            <Link href="/server" className="inline-flex min-h-11 items-center rounded-full border border-black/10 px-5 py-2 font-semibold text-[color:var(--foreground)]">
              Open server route
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
```

- [ ] **Step 5: Run the nested smoke test to verify it passes**

Run: `cd budgetbitch && npm install && npm test -- app/page.test.tsx -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add budgetbitch/package.json budgetbitch/vitest.config.ts budgetbitch/test/setup.ts budgetbitch/app/layout.tsx budgetbitch/app/globals.css budgetbitch/app/page.tsx budgetbitch/app/page.test.tsx
git commit -m "feat: align nested prototype with brand palette"
```

### Task 5: Document the Shared Shell and Run Final Verification

**Files:**
- Modify: `docs/CODEBASE_INDEX.md`
- Modify: `docs/DEV_TREE.md`

- [ ] **Step 1: Add the new shared shell to the codebase docs**

```md
<!-- docs/CODEBASE_INDEX.md -->
| Shared route shell | `src/components/app/experience-shell.tsx` | Centralizes Learn, Jobs, and Integrations route theming |
```

```md
<!-- docs/DEV_TREE.md -->
  D --> D0[app shared shells]
  D --> D1[integrations UI primitives]

  D0 --> D01[experience-shell.tsx]
```

- [ ] **Step 2: Run the root targeted verification suite**

Run: `npm test -- src/components/app/experience-shell.test.tsx "src/app/(app)/learn/page.test.tsx" "src/components/learn/lesson-card.test.tsx" "src/app/(app)/jobs/page.test.tsx" "src/components/jobs/job-card.test.tsx" "src/app/(app)/settings/integrations/page.test.tsx" "src/components/integrations/provider-card.test.tsx" -v`
Expected: PASS

- [ ] **Step 3: Run root lint and build**

Run: `npm run lint && npm run build`
Expected: PASS

- [ ] **Step 4: Run nested lint and build**

Run: `cd budgetbitch && npm run lint && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/CODEBASE_INDEX.md docs/DEV_TREE.md
git commit -m "docs: record shared color shell architecture"
```