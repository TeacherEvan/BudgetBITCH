# Low-Stimulation Display Redesign Implementation Plan

> **For agentic workers:** Use `subagent-driven-development` for parallel surface work, or `executing-plans` for inline implementation. Track progress with checkbox syntax and keep each task reviewable on its own.

**Goal:** Reduce information overstimulation across the main app surfaces by shortening display text, strengthening scan hierarchy, and calming the visual system while preserving the current Next.js App Router, Prisma, Auth.js, Convex viewer wiring, and route behavior.

**Non-goals:**
- Do not change database schemas, Prisma migrations, Convex function contracts, auth flows, or API authorization behavior.
- Do not touch the nested `budgetbitch/` prototype subtree.
- Do not remove required security, privacy, or setup disclosures. Summarize and stage them instead.
- Do not create a marketing landing page or replace the existing app-first experience.

**Architecture Summary:**
Keep content ownership where it already lives. Make one shared visual-token pass in `src/app/globals.css`, then simplify copy and layout inside each route or component that owns the display. Prefer short visible strings, compact labels, stable card dimensions, and progressive detail through existing detail pages, setup pages, and action rails. Tests should assert the new concise labels, preserved CTAs, preserved navigation, and visible critical state.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS v4 utilities, next-intl message dictionaries, Vitest, Testing Library, Playwright.

---

## File Responsibility

### Shared Visual System

- **Modify:** `src/app/globals.css`
  - Own calmer palette tokens, reduced radius, stable card spacing, zero heading letter spacing, less intense uppercase tracking, and reusable scan-first component classes.

### Dashboard

- **Modify:** `src/app/(app)/dashboard/page.tsx`
  - Own dashboard hero copy, quick status cards, home-location summary copy, and shell layout density.
- **Modify:** `src/components/dashboard/launcher-grid.tsx`
  - Own tool card hierarchy and concise tool detail display.
- **Modify:** `src/components/dashboard/live-briefing-rail.tsx`
  - Own briefing topic display, field count treatment, and summary truncation strategy.
- **Modify:** `src/components/dashboard/daily-check-in-card.tsx`
  - Own check-in copy, metric grouping, alert display, and form helper text.
- **Modify:** `src/components/dashboard/live-alert-feed.tsx`
  - Own live-alert empty, loading, and standby messages.
- **Modify:** related tests in `src/app/(app)/dashboard/page.test.tsx` and `src/components/dashboard/*.test.tsx`.
- **Modify:** `tests/e2e/dashboard.spec.ts`.

### Start Smart

- **Modify:** `src/components/start-smart/start-smart-shell.tsx`
  - Own the four-panel shell, step deck, summary cards, and footer cue copy.
- **Modify:** `src/components/start-smart/template-picker.tsx`
  - Own template lane labels, card density, and summary visibility.
- **Modify:** `src/components/start-smart/profile-form.tsx`
  - Own form helper text and field hint length.
- **Modify:** `src/components/start-smart/blueprint-panel.tsx`
  - Own result display, grouped priority sections, and compact next-step lists.
- **Modify:** `src/components/start-smart/start-smart-shell.test.tsx`, `src/components/start-smart/template-picker.test.tsx` if added, `src/components/start-smart/blueprint-panel.test.tsx`, and `tests/e2e/start-smart.spec.ts`.

### Jobs

- **Modify:** `src/app/(app)/jobs/page.tsx`
  - Own jobs page hero, quick stats, lane copy, and recommendation board framing.
- **Modify:** `src/components/jobs/jobs-filter-panel.tsx`
  - Own filter summary density and shared home-location cue copy.
- **Modify:** `src/components/jobs/job-card.tsx`
  - Own scan-first job-card hierarchy, metadata ordering, short fit cue, and CTA placement.
- **Modify:** `src/app/(app)/jobs/[slug]/page.tsx`
  - Own fuller details that are removed from cards.
- **Modify:** `src/modules/jobs/job-catalog.ts` only if copy itself must be shortened at the source.
- **Modify:** `src/components/jobs/job-card.test.tsx`, `src/app/(app)/jobs/page.test.tsx`, `src/app/(app)/jobs/[slug]/page.test.tsx`, and `tests/e2e/jobs.spec.ts`.

### Learn

- **Modify:** `src/app/(app)/learn/page.tsx`
  - Own top-level learning page density, explainer pills, and story-cue count.
- **Modify:** `src/components/learn/lesson-card.tsx`
  - Own compact lesson card hierarchy and visible teaser text.
- **Modify:** `src/components/learn/recommended-lessons.tsx`
  - Own list section copy and card spacing.
- **Modify:** `src/app/(app)/learn/[slug]/page.tsx`
  - Own deeper lesson content that remains available after opening a card.
- **Modify:** `src/modules/learn/module-catalog.ts` only if source summaries need calm, short replacements.
- **Modify:** `src/components/learn/lesson-card.test.tsx`, `src/app/(app)/learn/page.test.tsx`, `src/app/(app)/learn/[slug]/page.test.tsx`, and `tests/e2e/learn.spec.ts`.

### Integrations

- **Modify:** `src/app/(app)/settings/integrations/page.tsx`
  - Own hub hero, guardrails, category sections, and provider group density.
- **Modify:** `src/components/integrations/provider-card.tsx`
  - Own provider-card hierarchy, category summary length, risk badge treatment, and action rail spacing.
- **Modify:** `src/components/integrations/provider-wizard-shell.tsx`
  - Own setup-page header density and back-link placement.
- **Modify:** `src/components/integrations/privacy-disclosure-panel.tsx`, `src/components/integrations/risk-checklist.tsx`, and `src/components/integrations/system-access-warning.tsx` only where visible copy can be staged without weakening meaning.
- **Modify:** integration component tests, `src/app/(app)/settings/integrations/page.test.tsx`, provider route tests, and `tests/e2e/integrations-*.spec.ts`.

### Notes, Calculator, Messages, and Supporting Data

- **Modify:** `src/app/(app)/notes/page.tsx`, `src/components/notes/notes-board.tsx`, and related tests.
- **Modify:** `src/app/(app)/calculator/page.tsx`, `src/components/calculator/calculator.tsx`, and related tests only if visible helper text or control hierarchy contributes to overload.
- **Modify:** `src/i18n/messages.ts` for any strings already dictionary-backed.
- **Leave untouched unless required by tests:** Prisma schema, migrations, API route guards, notification modules, Convex generated files, Auth.js setup, and the nested `budgetbitch/` subtree.

---

## Display Rules To Implement

- Each page header should include one short eyebrow, one direct heading, and at most one short supporting sentence.
- Cards should expose no more than one primary sentence plus compact facts. Move extended explanation to detail pages or existing wizard/setup pages.
- Status pills should be short labels, not sentence containers.
- Helper text should explain only the current decision or blocked state.
- Repeated labels should be collapsed when a section heading already gives context.
- Preserve explicit action labels such as `Open job details`, `Open setup wizard`, `Open official login`, and `Open official docs`.
- Preserve security and privacy meaning while reducing visible text length.
- Keep heading order valid inside reusable cards.
- Keep text within containers on mobile and desktop. Use stable grid tracks, max-widths, and truncation where scan surfaces contain dynamic data.

---

## Ordered Tasks

### Task 1: Establish shared low-stimulation visual tokens

**Depends on:** None.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.test.tsx` only if tests assert global class behavior.

- [ ] **Step 1: Write failing style-contract tests if practical**

Add a lightweight test only for behavior that can be asserted in jsdom, such as shell classes that must remain present. Do not snapshot the full stylesheet.

Run:

```bash
npm test -- src/app/layout.test.tsx src/app/(app)/layout.test.tsx
```

Expected: Existing tests pass before the CSS change. If a new style-contract test is added, it should fail until the class or token contract exists.

- [ ] **Step 2: Update global tokens and shared component classes**

Implement these specific changes:

- Set heading `letter-spacing` to `0`.
- Reduce dominant green saturation by adjusting `--page-bg-*`, `--surface-*`, and accent variables toward a calmer mixed palette with clear contrast.
- Reduce `--radius-panel` and card radii to a more compact value unless a component needs the existing mobile shell framing.
- Reduce `.bb-kicker` and `.bb-status-pill` tracking so labels are easier to read.
- Add or tune shared scan classes for compact metadata rows, quiet helper copy, stable pill dimensions, and clipped single-line summaries.

- [ ] **Step 3: Verify shell and baseline layout tests**

Run:

```bash
npm test -- src/app/layout.test.tsx src/app/(app)/layout.test.tsx src/components/mobile/mobile-app-shell.test.tsx
```

Expected: PASS. The app shell still renders the mobile panel frame and navigation without layout-related regressions.

- [ ] **Step 4: Review in browser**

Run:

```bash
npm run dev -- --webpack
```

Expected: Local dev server starts. Manually inspect `/dashboard`, `/start-smart`, `/jobs`, `/learn`, `/settings/integrations`, and `/notes` at mobile and desktop widths for text overlap, blank panels, and excessive color intensity.

### Task 2: Simplify dashboard display and live states

**Depends on:** Task 1.

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/components/dashboard/launcher-grid.tsx`
- Modify: `src/components/dashboard/live-briefing-rail.tsx`
- Modify: `src/components/dashboard/daily-check-in-card.tsx`
- Modify: `src/components/dashboard/live-alert-feed.tsx`
- Modify: `src/i18n/messages.ts`
- Modify: related dashboard tests and `tests/e2e/dashboard.spec.ts`

- [ ] **Step 1: Update failing tests for the new concise dashboard copy**

Change expectations from long descriptive strings to concise display labels. Cover these behaviors:

- Dashboard hero still renders one `h1` and the active workspace/city/status facts.
- Launcher cards still link to the same routes and expose each tool title.
- Live briefing shows topic label, source status, and compact field count without combining label and summary into one dense line.
- Daily check-in keeps the form, submit button, planned spend metric, alert count, and error alert behavior.
- Live alerts retain all blocked states with shorter copy.

Run:

```bash
npm test -- 'src/app/(app)/dashboard/page.test.tsx' src/components/dashboard/launcher-grid.test.tsx src/components/dashboard/live-briefing-rail.test.tsx src/components/dashboard/daily-check-in-card.test.tsx src/components/dashboard/live-alert-feed.test.tsx
```

Expected: FAIL on old copy and old dense layout assertions.

- [ ] **Step 2: Implement dashboard simplification**

Apply these changes:

- Replace the hero description with one short sentence in `src/i18n/messages.ts`.
- Collapse the two right-side dashboard summary cards into shorter status cards or one compact status strip if layout allows.
- In `LiveBriefingRail`, render field label and source badge, with the field summary available through `title` or a visually compact secondary line. Avoid `label · summary` as the primary text.
- In `DailyCheckInCard`, shorten helper copy and empty states while preserving validation errors and submit state labels.
- In `LiveAlertFeed`, shorten standby messages to direct state labels plus one sentence.

- [ ] **Step 3: Run focused dashboard tests**

Run the same command from Step 1.

Expected: PASS with concise copy and preserved functionality.

- [ ] **Step 4: Run dashboard E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/dashboard.spec.ts
```

Expected: PASS. The dashboard opens, navigation remains usable, and no tested dashboard copy is stale.

### Task 3: Reduce Start Smart setup overload

**Depends on:** Task 1.

**Files:**
- Modify: `src/components/start-smart/start-smart-shell.tsx`
- Modify: `src/components/start-smart/template-picker.tsx`
- Modify: `src/components/start-smart/profile-form.tsx`
- Modify: `src/components/start-smart/blueprint-panel.tsx`
- Modify: `src/components/start-smart/start-smart-shell.test.tsx`
- Modify: `src/components/start-smart/blueprint-panel.test.tsx`
- Create: `src/components/start-smart/template-picker.test.tsx` if the simplified lane behavior is not already covered.
- Modify: `tests/e2e/start-smart.spec.ts`

- [ ] **Step 1: Write failing Start Smart tests**

Cover these expectations:

- The shell renders one concise page heading and no more than two summary cards above the active panel.
- The panel deck exposes step labels and current step state without repeating long cue sentences in every location.
- Template cards show template label, active state, and one short summary.
- Blueprint results preserve priority stack, risk warnings, next 7 days, next 30 days, learn next, integrations, and assumption quality.

Run:

```bash
npm test -- src/components/start-smart/start-smart-shell.test.tsx src/components/start-smart/blueprint-panel.test.tsx
```

If adding a template picker test, run:

```bash
npm test -- src/components/start-smart/template-picker.test.tsx
```

Expected: FAIL where tests assert the new reduced summary structure.

- [ ] **Step 2: Implement Start Smart simplification**

Apply these changes:

- Shorten `wizardStepMeta.cue` strings.
- Replace the four header stat cards with at most two compact status cards: selected template and active panel.
- Move home-base and household snapshot details into `renderRouteSummary` only.
- In the footer, replace repeated cue copy with a short step counter such as `Panel 2 of 4`.
- In `ProfileForm`, shorten default description and country/region hints.
- In `BlueprintPanel`, group each section into compact cards with small list caps and stable spacing. Preserve all result arrays.

- [ ] **Step 3: Run Start Smart tests**

Run:

```bash
npm test -- src/components/start-smart/start-smart-shell.test.tsx src/components/start-smart/blueprint-panel.test.tsx
```

Expected: PASS. Existing validation, fetch submit, home-location storage, and result rendering still work.

- [ ] **Step 4: Run Start Smart E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/start-smart.spec.ts
```

Expected: PASS. The user can choose a lane, set home base, enter the snapshot, generate the blueprint, and see results.

### Task 4: Make jobs scan-first with detail-page depth

**Depends on:** Task 1.

**Files:**
- Modify: `src/app/(app)/jobs/page.tsx`
- Modify: `src/components/jobs/jobs-filter-panel.tsx`
- Modify: `src/components/jobs/job-card.tsx`
- Modify: `src/app/(app)/jobs/[slug]/page.tsx`
- Modify: `src/modules/jobs/job-catalog.ts` only if source summaries are still too long after card restructuring.
- Modify: `src/components/jobs/job-card.test.tsx`
- Modify: `src/app/(app)/jobs/page.test.tsx`
- Modify: `src/app/(app)/jobs/[slug]/page.test.tsx`
- Modify: `tests/e2e/jobs.spec.ts`

- [ ] **Step 1: Update failing jobs tests**

Cover these expectations:

- `JobCard` shows title, company, salary, location, workplace, schedule, posting age, up to three fit badges, a short fit cue, and `Open job details`.
- `JobCard` does not require full `summary` text to be visible on the list card.
- Jobs page still renders lane headings and recommendation cards.
- Job detail page renders the full summary and benefits that are not shown on the card.
- The filter panel renders compact filter facts and home-base action without long explanatory paragraphs.

Run:

```bash
npm test -- src/components/jobs/job-card.test.tsx 'src/app/(app)/jobs/page.test.tsx' 'src/app/(app)/jobs/[slug]/page.test.tsx'
```

Expected: FAIL until card and page expectations match the simplified design.

- [ ] **Step 2: Implement jobs simplification**

Apply these changes:

- Replace the card summary paragraph with a shorter `fitSummary` area or one-line `job.summary` clamp.
- Keep the metadata row stable with icon, label, and value where helpful.
- Limit badges to three and ensure long badge text wraps safely.
- Shorten quick stat cues in `JobsPage`.
- Shorten lane summaries to one line.
- In `JobsFilterPanel`, keep Workplace, Salary floor, Lane count, Priority fit, Home base, and total match count, but remove repeated paragraphs.
- In the job detail page, keep the full summary and benefits so depth remains available after `Open job details`.

- [ ] **Step 3: Run jobs unit tests**

Run the same command from Step 1.

Expected: PASS with scan-first cards and preserved route links.

- [ ] **Step 4: Run jobs E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/jobs.spec.ts
```

Expected: PASS. The jobs hub loads, route lanes are visible, job detail navigation works, and the CTA copy remains explicit.

### Task 5: Calm the learn surface without removing lesson depth

**Depends on:** Task 1.

**Files:**
- Modify: `src/app/(app)/learn/page.tsx`
- Modify: `src/components/learn/lesson-card.tsx`
- Modify: `src/components/learn/recommended-lessons.tsx`
- Modify: `src/app/(app)/learn/[slug]/page.tsx`
- Modify: `src/modules/learn/module-catalog.ts` only where source summaries should become shorter and calmer.
- Modify: `src/components/learn/lesson-card.test.tsx`
- Modify: `src/app/(app)/learn/page.test.tsx`
- Modify: `src/app/(app)/learn/[slug]/page.test.tsx`
- Modify: `tests/e2e/learn.spec.ts`

- [ ] **Step 1: Update failing learn tests**

Cover these expectations:

- Learn page hero uses one short description.
- Story cues show at most one primary scene cue and one action cue per card.
- Lesson cards show title, category, one short summary, up to two takeaways, and the launch link.
- Detail pages retain the deeper lesson explanation and action content.

Run:

```bash
npm test -- src/components/learn/lesson-card.test.tsx 'src/app/(app)/learn/page.test.tsx' 'src/app/(app)/learn/[slug]/page.test.tsx'
```

Expected: FAIL where tests still expect all old visible scene text.

- [ ] **Step 2: Implement learn simplification**

Apply these changes:

- Remove or reduce explainer pills in the learn page header if they repeat section content.
- In story-cue cards, show only the plain-English cue and apply-now cue. Keep the full scene in the lesson detail page.
- In `LessonCard`, show summary plus one highlighted action or takeaway cluster, not multiple long paragraphs.
- If source summaries are too colorful or long for a calm UI, shorten only the visible summary strings in `module-catalog.ts` and update schema tests that assert them.

- [ ] **Step 3: Run learn tests**

Run the same command from Step 1.

Expected: PASS. Cards are compact and lesson depth remains accessible.

- [ ] **Step 4: Run learn E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/learn.spec.ts
```

Expected: PASS. The learn route opens and lessons can still be opened.

### Task 6: Simplify integrations while preserving trust cues

**Depends on:** Task 1.

**Files:**
- Modify: `src/app/(app)/settings/integrations/page.tsx`
- Modify: `src/components/integrations/provider-card.tsx`
- Modify: `src/components/integrations/provider-wizard-shell.tsx`
- Modify: `src/components/integrations/privacy-disclosure-panel.tsx`
- Modify: `src/components/integrations/risk-checklist.tsx`
- Modify: `src/components/integrations/system-access-warning.tsx`
- Modify: `src/i18n/messages.ts`
- Modify: integration component tests, provider route tests, and `tests/e2e/integrations-*.spec.ts`

- [ ] **Step 1: Update failing integration tests**

Cover these expectations:

- Provider cards keep provider label, category, risk, privacy badge, setup state, and explicit action labels.
- Quick actions remain outside the heading outline.
- Hub category sections render provider counts and provider cards with shorter descriptions.
- Provider setup pages still show the back link, tools rail, official docs/login links, and safety content.

Run:

```bash
npm test -- src/components/integrations/provider-card.test.tsx src/components/integrations/provider-wizard-shell.test.tsx src/components/integrations/privacy-disclosure-panel.test.tsx src/components/integrations/risk-checklist.test.tsx src/components/integrations/tool-rail.test.tsx 'src/app/(app)/settings/integrations/page.test.tsx' 'src/app/(app)/settings/integrations/provider-route-pages.test.tsx'
```

Expected: FAIL on old copy and old density assertions.

- [ ] **Step 2: Implement integrations simplification**

Apply these changes:

- Shorten hub guardrails to three compact labels with optional `title` text for the fuller meaning.
- In provider cards, keep category summary to one short line and move risk/setup details into badges.
- Keep `ToolRail` action labels explicit and unchanged.
- In provider wizard shell, reduce top description length and keep details in the child safety panels.
- In risk and privacy panels, convert long paragraphs into short bullets with clear headings while preserving all required warnings.

- [ ] **Step 3: Run integration unit tests**

Run the same command from Step 1.

Expected: PASS. Trust cues and action labels remain intact.

- [ ] **Step 4: Run targeted integration E2E**

Run:

```bash
npm run test:e2e -- tests/e2e/integrations-tool-rail.spec.ts tests/e2e/integrations-openai.spec.ts tests/e2e/integrations-claude.spec.ts tests/e2e/integrations-copilot.spec.ts tests/e2e/integrations-gemini.spec.ts tests/e2e/integrations-openclaw.spec.ts
```

Expected: PASS. Hub and setup pages remain navigable and official action links are visible.

### Task 7: Polish notes, calculator, and remaining text-heavy shells

**Depends on:** Task 1. Prefer after Tasks 2 through 6 so shared patterns are known.

**Files:**
- Modify: `src/app/(app)/notes/page.tsx`
- Modify: `src/components/notes/notes-board.tsx`
- Modify: `src/app/(app)/calculator/page.tsx` if needed.
- Modify: `src/components/calculator/calculator.tsx` if needed.
- Modify: `src/i18n/messages.ts`
- Modify: related tests and `tests/e2e/notes.spec.ts`, `tests/e2e/calculator.spec.ts`

- [ ] **Step 1: Update failing notes/calculator tests**

Cover these expectations:

- Notes page uses concise heading and helper copy.
- Empty notes state is short and calm.
- Note deletion remains accessible by label.
- Calculator controls remain reachable and any helper copy is concise.

Run:

```bash
npm test -- 'src/app/(app)/notes/page.test.tsx' src/components/notes/notes-board.test.tsx 'src/app/(app)/calculator/page.test.tsx' src/components/calculator/calculator.test.tsx
```

Expected: FAIL only where visible text expectations change.

- [ ] **Step 2: Implement remaining polish**

Apply these changes:

- Shorten notes page description and empty state.
- Keep the note input and add/delete controls unchanged except for spacing or label clarity.
- For calculator, avoid adding explanatory display text. Keep controls direct and stable.

- [ ] **Step 3: Run focused tests and E2E**

Run:

```bash
npm test -- 'src/app/(app)/notes/page.test.tsx' src/components/notes/notes-board.test.tsx 'src/app/(app)/calculator/page.test.tsx' src/components/calculator/calculator.test.tsx
npm run test:e2e -- tests/e2e/notes.spec.ts tests/e2e/calculator.spec.ts
```

Expected: PASS. Notes and calculator remain usable with less visible helper text.

### Task 8: Cross-surface visual and regression verification

**Depends on:** Tasks 1 through 7.

**Files:**
- Modify tests only if final copy or layout assertions need updated.
- Do not change production code in this task unless verification finds a blocking bug.

- [ ] **Step 1: Run full repo validation commands**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected: PASS. If unrelated failures appear, capture the failing file/test and confirm whether it is pre-existing before changing scope.

- [ ] **Step 2: Run targeted E2E suite for changed routes**

Run:

```bash
npm run test:e2e -- tests/e2e/dashboard.spec.ts tests/e2e/start-smart.spec.ts tests/e2e/jobs.spec.ts tests/e2e/learn.spec.ts tests/e2e/notes.spec.ts tests/e2e/calculator.spec.ts tests/e2e/integrations-tool-rail.spec.ts tests/e2e/integrations-openai.spec.ts tests/e2e/integrations-claude.spec.ts tests/e2e/integrations-copilot.spec.ts tests/e2e/integrations-gemini.spec.ts tests/e2e/integrations-openclaw.spec.ts
```

Expected: PASS. UI routes open, primary actions work, and copy assertions match the new concise display.

- [ ] **Step 3: Run full E2E if targeted checks pass**

Run:

```bash
npm run test:e2e
```

Expected: PASS. The repo note says Playwright uses the webpack-backed dev server on port `3100`; keep that behavior intact.

- [ ] **Step 4: Manual display review**

Inspect these routes at 390px, 768px, and desktop width:

- `/dashboard`
- `/start-smart`
- `/jobs`
- `/jobs/remote-customer-support-specialist`
- `/learn`
- `/learn/budgeting-basics`
- `/settings/integrations`
- `/settings/integrations/openai`
- `/notes`
- `/calculator`

Expected:

- No text overlaps or clips in buttons, cards, pills, nav, or status rows.
- Headings are readable with letter spacing at `0`.
- Cards do not visually nest as floating panels inside floating panels unless they are repeated item cards or genuine tool frames.
- Text density is lower than the starting state, especially on dashboard, Start Smart, jobs, learn, and integrations.
- Critical privacy, risk, auth, setup, and error states remain visible.

---

## Review Gates

- **Copy review:** Confirm every changed visible string is shorter, calmer, and still specific enough to act on.
- **Accessibility review:** Confirm heading order, `aria-current`, form error linkage, button/link names, and keyboard focus still work.
- **Responsive review:** Confirm no mobile card, pill, or button text overlaps at 390px width.
- **Behavior review:** Confirm no auth, workspace, Prisma, Convex, or integration authorization behavior changed.
- **Design review:** Confirm the palette no longer reads as a single saturated green theme and that hierarchy is driven by spacing, weight, and concise content rather than long paragraphs.

---

## Deployment Steps

1. Complete Tasks 1 through 8 with all checked boxes updated.
2. Run final validation:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Expected: all commands exit `0`.

3. Review the diff:

```bash
git diff -- src/app src/components src/modules src/i18n tests docs/superpowers/plans/2026-05-01-low-stimulation-display-redesign.md
```

Expected: only display/copy/test changes plus this plan. No schema, migration, generated, auth-provider, or nested prototype churn.

4. Request code review focused on low-stimulation display, copy meaning preservation, accessibility, and route behavior.
5. After approval, deploy through the repo's normal hosting workflow. No data migration or environment-variable change is expected.

---

## Self-Review Checklist

| Check | Question | Expected Answer |
|-------|----------|-----------------|
| Coverage | Does every approved design requirement map to a task? | Yes. Copy reduction, visual calm, scan hierarchy, and display experience are covered across shared styles and key app surfaces. |
| Order | Can tasks run without hidden dependencies? | Yes. Shared CSS comes first; surface tasks can run independently after that; verification comes last. |
| Specificity | Are paths, commands, and expected results explicit? | Yes. Each task names files, commands, and expected fail/pass outcomes. |
| Testability | Is each behavior change verifiable? | Yes. Unit/component tests cover copy and component behavior; Playwright covers route flows. |
| Scope | Did the plan avoid unrelated refactoring? | Yes. It leaves data, auth, API, generated files, and the nested prototype untouched unless a targeted display test requires a small copy update. |
