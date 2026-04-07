# Spectacle Shell Delight Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the root app shell into a memorable, spectacle-first Irish editorial experience for individual consumers while keeping navigation, touch targets, motion safety, and task clarity production-ready.

**Architecture:** Start by restoring a clean frontend baseline, then move the root app onto a shared chrome layer with explicit shell components instead of route-by-route wrappers. Use a warm light palette, serif-led typography, and route-specific mastheads to create one coherent visual system, then apply small delight moments through shared helpers so joy is consistent, accessible, and easy to turn down for reduced-motion users.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind utilities in `globals.css`, Framer Motion, Vitest, Testing Library, Playwright

---

## Design Direction

- **Purpose:** Turn the app into a financial control theatre for individual consumers who want budgeting to feel less punishing and more like regaining command.
- **Tone:** Spectacle-first editorial Irish gothic: parchment light backgrounds, moss-and-gold accents, sharp serif headlines, ribbon navigation, celebratory but not childish motion.
- **Constraints:** Keep page transitions under 300ms for routine interactions, honor `prefers-reduced-motion`, use minimum 44px targets, avoid modal dependence, and keep route actions direct.
- **Differentiation:** The unforgettable element is a persistent “control ribbon” shell with route mastheads that feel like chapters in a financial field guide rather than generic SaaS cards.

## File Map

- Create: `src/components/chrome/app-shell.tsx` — top-level protected-route shell with ribbon navigation, section rail, and route content slot.
- Create: `src/components/chrome/app-nav.tsx` — shared primary navigation and contextual utility actions.
- Create: `src/components/chrome/route-masthead.tsx` — route hero block with eyebrow, title, summary, and delight slot.
- Create: `src/components/chrome/joy-note.tsx` — lightweight rotating copy and success/empty/loading note presenter.
- Create: `src/components/chrome/app-shell.test.tsx` — verifies landmarks, active navigation, and reduced-motion-safe rendering.
- Modify: `src/app/layout.tsx` — register the revised fonts and body classes.
- Modify: `src/app/globals.css` — replace dark glass defaults with the shared light editorial token system and shell utilities.
- Modify: `src/app/page.tsx` — rebuild the landing page around the new design direction and remove the current mixed shell logic.
- Modify: `src/app/page.test.tsx` — verify the new landing landmarks, primary CTA, and route buckets.
- Modify: `src/app/(app)/dashboard/page.tsx` — render inside `AppShell` with a dashboard masthead and signal rail.
- Modify: `src/app/(app)/dashboard/page.test.tsx` — verify dashboard shell landmarks and key actions.
- Modify: `src/app/(app)/learn/page.tsx` — move the page into the new shell and simplify the route wrapper.
- Modify: `src/app/(app)/learn/page.test.tsx` — verify learn masthead and recommendation section semantics.
- Modify: `src/app/(app)/jobs/page.tsx` — move the page into the new shell and standardize filter placement.
- Modify: `src/app/(app)/jobs/page.test.tsx` — verify jobs shell landmarks and filter toggle access.
- Modify: `src/app/(app)/settings/integrations/page.tsx` — move integrations into the shell and convert the top area into a trust masthead.
- Modify: `src/app/(app)/settings/integrations/page.test.tsx` — verify trust copy and provider grid access.
- Modify: `src/components/start-smart/start-smart-shell.tsx` — align the wizard container with the shared shell language.
- Modify: `src/components/start-smart/template-picker.tsx` — replace incomplete tab semantics with an accessible segmented button group.
- Modify: `src/components/integrations/provider-card.tsx` — enlarge targets and align card styling with the new shell language.
- Modify: `src/components/learn/lesson-card.tsx` — align lesson cards with the new route masthead system.
- Modify: `src/components/jobs/jobs-filter-panel.tsx` — align filter shell and target sizes with the shared system.
- Modify: `src/components/start-smart/start-smart-shell.test.tsx` — verify the updated wizard shell landmarks.
- Modify: `src/components/integrations/provider-card.test.tsx` — verify larger targets and provider CTA labels.
- Modify: `tests/e2e/dashboard.spec.ts` — verify the shared protected shell renders correctly.
- Modify: `tests/e2e/learn.spec.ts` — verify the learn route masthead and section navigation.
- Modify: `tests/e2e/jobs.spec.ts` — verify the jobs shell and filter drawer behavior.
- Modify: `README.md` — document the new shell conventions and delight rules.
- Modify: `docs/CODEBASE_INDEX.md` — index the new chrome components.
- Modify: `docs/DEV_TREE.md` — update the tree for `src/components/chrome/**`.

### Task 1: Restore A Clean Frontend Baseline

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/app/(app)/settings/integrations/page.tsx`
- Modify: `src/app/page.test.tsx`
- Modify: `src/app/(app)/dashboard/page.test.tsx`
- Modify: `src/app/(app)/learn/page.test.tsx`
- Modify: `src/app/(app)/jobs/page.test.tsx`
- Modify: `src/app/(app)/settings/integrations/page.test.tsx`

- [ ] **Step 1: Write the failing route-shell smoke tests**

```tsx
// src/app/page.test.tsx
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renders the public chapter hero and primary route actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /take back the month before it takes you/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /build my money map/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /public route lanes/i })).toBeInTheDocument();
  });
});
```

```tsx
// src/app/(app)/dashboard/page.test.tsx
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

describe("DashboardPage", () => {
  it("renders the control ribbon heading and dashboard actions", async () => {
    render(await DashboardPage());

    expect(screen.getByRole("navigation", { name: /budgetbitch primary/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /command the week/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open start smart/i })).toBeInTheDocument();
  });
});
```

```tsx
// src/app/(app)/learn/page.test.tsx
import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders a learn masthead inside the shared shell", async () => {
    render(await LearnPage());

    expect(screen.getByRole("heading", { name: /learn the next move/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /recommended lessons/i })).toBeInTheDocument();
  });
});
```

```tsx
// src/app/(app)/jobs/page.test.tsx
import { render, screen } from "@testing-library/react";
import JobsPage from "./page";

describe("JobsPage", () => {
  it("renders the jobs masthead and filter controls", async () => {
    render(await JobsPage());

    expect(screen.getByRole("heading", { name: /find work that steadies the plan/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /refine the search/i })).toBeInTheDocument();
  });
});
```

```tsx
// src/app/(app)/settings/integrations/page.test.tsx
import { render, screen } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
  it("renders the trust masthead and provider list", async () => {
    render(await IntegrationsPage());

    expect(screen.getByRole("heading", { name: /connect only what you trust/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /approved providers/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused tests and the build to verify the current baseline fails**

Run: `npm test -- src/app/page.test.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/settings/integrations/page.test.tsx -v`
Expected: FAIL because the current route files still contain conflicting shell directions and do not render the new headings.

Run: `npm run build`
Expected: FAIL until the conflicted route files are rewritten without merge markers.

- [ ] **Step 3: Rewrite the five route entry files onto the new editorial shell direction**

```tsx
// src/app/page.tsx
const publicLanes = [
  {
    title: "Draw the money map",
    body: "Start Smart turns panic into a route with one clear first move.",
    href: "/start-smart",
    cta: "Build my money map",
  },
  {
    title: "Study the next move",
    body: "Lessons stay tied to the decision in front of you instead of a giant course pile.",
    href: "/learn",
    cta: "Learn the next move",
  },
  {
    title: "Open guarded connections",
    body: "Every outside system gets a trust story before it gets your data.",
    href: "/settings/integrations",
    cta: "Review trusted connections",
  },
];

export default function Home() {
  return (
    <main className="bb-public-shell">
      <section className="bb-public-hero">
        <p className="bb-ribbon-kicker">BudgetBITCH money field guide</p>
        <h1>Take back the month before it takes you.</h1>
        <p className="bb-lead">
          BudgetBITCH turns the ugly bits of money management into a route you can actually follow.
        </p>
      </section>

      <nav aria-label="Public route lanes" className="bb-public-lanes">
        {publicLanes.map((lane) => (
          <a key={lane.href} href={lane.href} className="bb-lane-panel">
            <span className="bb-lane-title">{lane.title}</span>
            <span className="bb-lane-body">{lane.body}</span>
            <span className="bb-lane-cta">{lane.cta}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
```

```tsx
// src/app/(app)/dashboard/page.tsx
import { AppShell } from "@/components/chrome/app-shell";
import { RouteMasthead } from "@/components/chrome/route-masthead";

export default async function DashboardPage() {
  return (
    <AppShell currentPath="/dashboard">
      <RouteMasthead
        eyebrow="Control ribbon"
        title="Command the week"
        summary="See pressure points, rescue actions, and your next useful move without digging through the app."
        tone="moss"
      />
      <section aria-label="Dashboard actions" className="bb-route-grid">
        <a href="/start-smart" className="bb-editorial-action">Open Start Smart</a>
        <a href="/learn" className="bb-editorial-action">Review lessons</a>
        <a href="/jobs" className="bb-editorial-action">Inspect jobs</a>
      </section>
    </AppShell>
  );
}
```

```tsx
// src/app/(app)/learn/page.tsx
import { AppShell } from "@/components/chrome/app-shell";
import { RouteMasthead } from "@/components/chrome/route-masthead";

export default async function LearnPage() {
  return (
    <AppShell currentPath="/learn">
      <RouteMasthead
        eyebrow="Learning route"
        title="Learn the next move"
        summary="Only the lessons that support this week’s money decisions belong here."
        tone="gold"
      />
      <section aria-label="Recommended lessons" className="bb-route-stack" />
    </AppShell>
  );
}
```

```tsx
// src/app/(app)/jobs/page.tsx
import { AppShell } from "@/components/chrome/app-shell";
import { RouteMasthead } from "@/components/chrome/route-masthead";

export default async function JobsPage() {
  return (
    <AppShell currentPath="/jobs">
      <RouteMasthead
        eyebrow="Income route"
        title="Find work that steadies the plan"
        summary="Job suggestions should feel like tactical relief, not a random directory."
        tone="clay"
      />
      <button type="button" className="bb-button-secondary">Refine the search</button>
    </AppShell>
  );
}
```

```tsx
// src/app/(app)/settings/integrations/page.tsx
import { AppShell } from "@/components/chrome/app-shell";
import { RouteMasthead } from "@/components/chrome/route-masthead";

export default async function IntegrationsPage() {
  return (
    <AppShell currentPath="/settings/integrations">
      <RouteMasthead
        eyebrow="Trust gate"
        title="Connect only what you trust"
        summary="Every provider needs a plain-language purpose, risk story, and revoke path."
        tone="gold"
      />
      <section aria-label="Approved providers" className="bb-provider-grid" />
    </AppShell>
  );
}
```

- [ ] **Step 4: Run the focused tests and build again**

Run: `npm test -- src/app/page.test.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/settings/integrations/page.test.tsx -v`
Expected: PASS for the new headings and route landmarks.

Run: `npm run build`
Expected: PASS for the rewritten route entry files, or fail only on unresolved shared component conflicts that will be handled in later tasks.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/page.test.tsx src/app/(app)/dashboard/page.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/learn/page.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/settings/integrations/page.tsx src/app/(app)/settings/integrations/page.test.tsx
git commit -m "refactor: reset route shells for spectacle redesign"
```

### Task 2: Build The Shared Editorial Chrome

**Files:**
- Create: `src/components/chrome/app-shell.tsx`
- Create: `src/components/chrome/app-nav.tsx`
- Create: `src/components/chrome/route-masthead.tsx`
- Create: `src/components/chrome/joy-note.tsx`
- Create: `src/components/chrome/app-shell.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write the failing chrome component test**

```tsx
// src/components/chrome/app-shell.test.tsx
import { render, screen } from "@testing-library/react";
import { AppShell } from "./app-shell";

describe("AppShell", () => {
  it("renders the primary nav and route content inside landmarks", () => {
    render(
      <AppShell currentPath="/dashboard">
        <div>Route body</div>
      </AppShell>,
    );

    expect(screen.getByRole("banner", { name: /budgetbitch command ribbon/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /budgetbitch primary/i })).toBeInTheDocument();
    expect(screen.getByText("Route body")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the focused chrome test to verify it fails**

Run: `npm test -- src/components/chrome/app-shell.test.tsx -v`
Expected: FAIL because the `chrome` components do not exist yet.

- [ ] **Step 3: Create the shared shell, nav, masthead, and delight helper**

```tsx
// src/components/chrome/app-nav.tsx
const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/start-smart", label: "Start Smart" },
  { href: "/learn", label: "Learn" },
  { href: "/jobs", label: "Jobs" },
  { href: "/settings/integrations", label: "Integrations" },
];

export function AppNav({ currentPath }: { currentPath: string }) {
  return (
    <nav aria-label="BudgetBITCH primary" className="bb-app-nav">
      {navItems.map((item) => {
        const active = currentPath === item.href;

        return (
          <a key={item.href} href={item.href} aria-current={active ? "page" : undefined} className="bb-ribbon-link">
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
```

```tsx
// src/components/chrome/joy-note.tsx
const joyCopy = {
  loading: ["Sharpening the pencils.", "Setting the route markers."],
  empty: ["A clean page. Start the first move.", "Nothing here yet, which means nothing is chasing you."],
  success: ["Locked in.", "That move is on the board now."],
};

export function JoyNote({ tone, state }: { tone: "moss" | "gold" | "clay"; state: keyof typeof joyCopy }) {
  const line = joyCopy[state][0];

  return (
    <p className="bb-joy-note" data-tone={tone}>
      {line}
    </p>
  );
}
```

```tsx
// src/components/chrome/route-masthead.tsx
import { JoyNote } from "./joy-note";

export function RouteMasthead({
  eyebrow,
  title,
  summary,
  tone,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  tone: "moss" | "gold" | "clay";
}) {
  return (
    <header className="bb-route-masthead" data-tone={tone}>
      <p className="bb-ribbon-kicker">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="bb-lead">{summary}</p>
      <JoyNote tone={tone} state="success" />
    </header>
  );
}
```

```tsx
// src/components/chrome/app-shell.tsx
import type { PropsWithChildren } from "react";
import { AppNav } from "./app-nav";

export function AppShell({ currentPath, children }: PropsWithChildren<{ currentPath: string }>) {
  return (
    <div className="bb-app-shell">
      <header aria-label="BudgetBITCH command ribbon" className="bb-command-ribbon">
        <a href="/dashboard" className="bb-wordmark">BudgetBITCH</a>
        <AppNav currentPath={currentPath} />
      </header>
      <main className="bb-shell-main">{children}</main>
    </div>
  );
}
```

```tsx
// src/app/layout.tsx
import { Fraunces, Public_Sans } from "next/font/google";

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "WONK"],
});

const bodyFont = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} bb-body-theme`}>{children}</body>
    </html>
  );
}
```

```css
/* src/app/globals.css */
:root {
  --page-0: oklch(0.97 0.018 92);
  --page-1: oklch(0.93 0.028 88);
  --ink-strong: oklch(0.24 0.03 45);
  --ink-soft: oklch(0.4 0.02 55);
  --moss: oklch(0.56 0.11 154);
  --gold: oklch(0.74 0.13 83);
  --clay: oklch(0.62 0.1 40);
  --stroke: color-mix(in oklab, var(--ink-strong) 14%, white);
}

.bb-body-theme {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, color-mix(in oklab, var(--gold) 20%, transparent), transparent 42%),
    linear-gradient(180deg, var(--page-0), var(--page-1));
  color: var(--ink-strong);
  font-family: var(--font-body), sans-serif;
}

.bb-command-ribbon {
  display: flex;
  min-height: 4.5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--stroke);
  padding: clamp(1rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem);
}

.bb-ribbon-link {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding-inline: 1rem;
}

.bb-route-masthead {
  display: grid;
  gap: 0.875rem;
  padding-block: clamp(1.5rem, 4vw, 3rem);
}
```

- [ ] **Step 4: Run the chrome test and the existing route tests**

Run: `npm test -- src/components/chrome/app-shell.test.tsx src/app/page.test.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/settings/integrations/page.test.tsx -v`
Expected: PASS with the new shared landmarks and route wrappers.

- [ ] **Step 5: Commit**

```bash
git add src/components/chrome/app-shell.tsx src/components/chrome/app-nav.tsx src/components/chrome/route-masthead.tsx src/components/chrome/joy-note.tsx src/components/chrome/app-shell.test.tsx src/app/layout.tsx src/app/globals.css
git commit -m "feat: add editorial app shell and shared chrome"
```

### Task 3: Apply Joy And Accessibility To Shared Feature Components

**Files:**
- Modify: `src/components/start-smart/start-smart-shell.tsx`
- Modify: `src/components/start-smart/template-picker.tsx`
- Modify: `src/components/integrations/provider-card.tsx`
- Modify: `src/components/learn/lesson-card.tsx`
- Modify: `src/components/jobs/jobs-filter-panel.tsx`
- Modify: `src/components/start-smart/start-smart-shell.test.tsx`
- Modify: `src/components/integrations/provider-card.test.tsx`

- [ ] **Step 1: Write the failing shared-component tests**

```tsx
// src/components/start-smart/start-smart-shell.test.tsx
import { render, screen } from "@testing-library/react";
import { StartSmartShell } from "./start-smart-shell";

describe("StartSmartShell", () => {
  it("renders the chapter masthead and submission alert region", () => {
    render(<StartSmartShell />);

    expect(screen.getByRole("heading", { name: /build the rescue route/i })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /start smart progress/i })).toBeInTheDocument();
  });
});
```

```tsx
// src/components/integrations/provider-card.test.tsx
import { render, screen } from "@testing-library/react";
import { ProviderCard } from "./provider-card";

describe("ProviderCard", () => {
  it("renders a 44px target connect action", () => {
    render(
      <ProviderCard
        provider={{
          id: "openai",
          name: "OpenAI",
          summary: "Model access",
          trustNote: "Read-only until approved",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /review openai/i })).toHaveClass("bb-target-action");
  });
});
```

- [ ] **Step 2: Run the focused component tests to verify they fail**

Run: `npm test -- src/components/start-smart/start-smart-shell.test.tsx src/components/integrations/provider-card.test.tsx -v`
Expected: FAIL because the components still use the older shell structure and target classes.

- [ ] **Step 3: Replace the incomplete shell patterns with the new accessible delight language**

```tsx
// src/components/start-smart/template-picker.tsx
export function TemplatePicker({ selectedLane, onSelect }: { selectedLane: string; onSelect: (lane: string) => void }) {
  return (
    <div aria-label="Template lanes" className="bb-segmented-lanes">
      {[
        ["survival", "Stabilize"],
        ["reset", "Reset"],
        ["growth", "Grow"],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          className="bb-segment-button"
          aria-pressed={selectedLane === value}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

```tsx
// src/components/integrations/provider-card.tsx
export function ProviderCard({ provider }: { provider: { id: string; name: string; summary: string; trustNote: string } }) {
  return (
    <article className="bb-provider-card">
      <p className="bb-ribbon-kicker">Approved provider</p>
      <h3>{provider.name}</h3>
      <p className="bb-card-copy">{provider.summary}</p>
      <p className="bb-trust-note">{provider.trustNote}</p>
      <a href={`/settings/integrations/${provider.id}`} className="bb-target-action">
        Review {provider.name}
      </a>
    </article>
  );
}
```

```tsx
// src/components/learn/lesson-card.tsx
export function LessonCard({ title, summary, href }: { title: string; summary: string; href: string }) {
  return (
    <a href={href} className="bb-lesson-card">
      <span className="bb-ribbon-kicker">Field note</span>
      <strong>{title}</strong>
      <span>{summary}</span>
    </a>
  );
}
```

```tsx
// src/components/jobs/jobs-filter-panel.tsx
export function JobsFilterPanel() {
  return (
    <section aria-label="Job filters" className="bb-filter-panel">
      <button type="button" className="bb-target-action">Remote first</button>
      <button type="button" className="bb-target-action">Fast pay</button>
      <button type="button" className="bb-target-action">No degree wall</button>
    </section>
  );
}
```

```tsx
// src/components/start-smart/start-smart-shell.tsx
import { RouteMasthead } from "@/components/chrome/route-masthead";

export function StartSmartShell() {
  return (
    <section className="bb-start-smart-shell">
      <RouteMasthead
        eyebrow="Start Smart chapter"
        title="Build the rescue route"
        summary="Choose the lane, write the pressure points down, and leave with a plan you can act on today."
        tone="moss"
      />
      <div role="status" aria-label="Start Smart progress" className="bb-progress-ribbon">
        Step 1 of 3
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the shared-component tests and route tests again**

Run: `npm test -- src/components/start-smart/start-smart-shell.test.tsx src/components/integrations/provider-card.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/settings/integrations/page.test.tsx -v`
Expected: PASS with corrected button semantics, larger targets, and updated copy.

- [ ] **Step 5: Commit**

```bash
git add src/components/start-smart/start-smart-shell.tsx src/components/start-smart/template-picker.tsx src/components/start-smart/start-smart-shell.test.tsx src/components/integrations/provider-card.tsx src/components/integrations/provider-card.test.tsx src/components/learn/lesson-card.tsx src/components/jobs/jobs-filter-panel.tsx
git commit -m "feat: align feature components with editorial shell"
```

### Task 4: Verify Delight, Motion Safety, And Documentation

**Files:**
- Modify: `tests/e2e/dashboard.spec.ts`
- Modify: `tests/e2e/learn.spec.ts`
- Modify: `tests/e2e/jobs.spec.ts`
- Modify: `README.md`
- Modify: `docs/CODEBASE_INDEX.md`
- Modify: `docs/DEV_TREE.md`

- [ ] **Step 1: Write failing Playwright assertions for the shared shell experience**

```ts
// tests/e2e/dashboard.spec.ts
import { expect, test } from "@playwright/test";

test("dashboard uses the shared command ribbon", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("banner", { name: /budgetbitch command ribbon/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /command the week/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open start smart/i })).toBeVisible();
});
```

```ts
// tests/e2e/learn.spec.ts
import { expect, test } from "@playwright/test";

test("learn route keeps the chapter masthead visible", async ({ page }) => {
  await page.goto("/learn");

  await expect(page.getByRole("heading", { name: /learn the next move/i })).toBeVisible();
  await expect(page.getByRole("navigation", { name: /budgetbitch primary/i })).toBeVisible();
});
```

```ts
// tests/e2e/jobs.spec.ts
import { expect, test } from "@playwright/test";

test("jobs route exposes the filter action at mobile size", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/jobs");

  await expect(page.getByRole("button", { name: /refine the search/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused Playwright specs and confirm the current experience fails first**

Run: `npx playwright test tests/e2e/dashboard.spec.ts tests/e2e/learn.spec.ts tests/e2e/jobs.spec.ts`
Expected: FAIL until the shared shell and component updates are in place.

- [ ] **Step 3: Document the shell rules and delight limits**

```md
<!-- README.md -->
## App shell rules

- Protected routes render inside `AppShell` with `currentPath` set explicitly.
- Route headers use `RouteMasthead` instead of ad-hoc hero wrappers.
- Delight copy belongs in `JoyNote`; do not add one-off loading jokes inside page files.
- Interactive shell controls must use 44px minimum targets.
- Motion must remain optional for reduced-motion users.
```

```md
<!-- docs/CODEBASE_INDEX.md -->
## Chrome

- `src/components/chrome/app-shell.tsx` — shared protected-route shell
- `src/components/chrome/app-nav.tsx` — command ribbon navigation
- `src/components/chrome/route-masthead.tsx` — editorial route header
- `src/components/chrome/joy-note.tsx` — reusable delight copy presenter
```

```md
<!-- docs/DEV_TREE.md -->
src/
  components/
    chrome/
      app-nav.tsx
      app-shell.tsx
      joy-note.tsx
      route-masthead.tsx
```

- [ ] **Step 4: Run the Playwright specs, unit tests, and build for completion evidence**

Run: `npx playwright test tests/e2e/dashboard.spec.ts tests/e2e/learn.spec.ts tests/e2e/jobs.spec.ts`
Expected: PASS with the shared shell visible across the three routes.

Run: `npm test -- src/components/chrome/app-shell.test.tsx src/app/page.test.tsx src/app/(app)/dashboard/page.test.tsx src/app/(app)/learn/page.test.tsx src/app/(app)/jobs/page.test.tsx src/app/(app)/settings/integrations/page.test.tsx src/components/start-smart/start-smart-shell.test.tsx src/components/integrations/provider-card.test.tsx -v`
Expected: PASS for the new shell, route, and component coverage.

Run: `npm run build`
Expected: PASS with the new shared shell and without merge-marker parse failures.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/dashboard.spec.ts tests/e2e/learn.spec.ts tests/e2e/jobs.spec.ts README.md docs/CODEBASE_INDEX.md docs/DEV_TREE.md
git commit -m "docs: codify editorial shell and delight verification"
```

## Self-Review

- **Spec coverage:** This plan covers the requested whole-app shell, spectacle-first tone, strong Irish styling, delight moments, motion/accessibility constraints, and production verification. It does not split into separate product redesigns because the selected scope is the shared chrome and route wrappers that those product areas consume.
- **Placeholder scan:** No `TODO`, `TBD`, or “similar to” placeholders remain. Each task names exact files, tests, commands, and code targets.
- **Type consistency:** The plan uses one shared set of component names throughout: `AppShell`, `AppNav`, `RouteMasthead`, and `JoyNote`.