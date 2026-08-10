# Frontend Audit — 2026-04-07 (Updated after staged fixes)

Scope: root Next.js app under `src/` plus `WelcomeWindow-startup/WelcomeScreen.tsx`, refreshed to match the current staged tree.

Method: source review, staged diff review, targeted UI validation, and follow-up verification after the accessibility and navigation fixes landed.

## Anti-Patterns Verdict

**Verdict: Still stylistically opinionated, but materially improved.**

The staged fixes removed the most important correctness and accessibility gaps, but the product still leans hard on a theatrical intro, dark glass surfaces, and repeated panel patterns that make parts of the UI feel more systematized than bespoke.

Most obvious remaining tells:

- The welcome flow still uses **gradient text**, **glassmorphism**, and ornamental theatrics, even though reduced-motion support is now in place.
- The app still repeats a closely related **panel-based shell** across landing, dashboard, Start Smart, Learn, and Jobs.
- Some feature pages still rely on **nested panels/cards** instead of composition, spacing, and contrast alone.

## Executive Summary

- **Resolved since the initial scan:** 8 major issues
- **Remaining issues worth tracking:** 5
  - **Medium:** 4
  - **Low:** 1
- **Overall quality score:** **72/100**

### What was fixed in the staged tree

1. Reduced-motion handling was added to the welcome experience.
2. Start Smart inputs now expose visible focus treatments.
3. Start Smart now validates regional fields before submit and shows field-level guidance.
4. Submission errors in Start Smart now use announced alert semantics.
5. Internal integration navigation now uses app navigation primitives.
6. Integrations provider heading hierarchy was improved.
7. A tokenized visual system was introduced in `src/app/globals.css`.
8. The app shell now uses explicit body/display font loading in `src/app/layout.tsx`.

## Remaining Findings by Severity

### Medium-Severity Issues

#### 1. Welcome screen still leans on ornamental spectacle over interface restraint

- **Location:** `WelcomeWindow-startup/WelcomeScreen.tsx`
- **Severity:** Medium
- **Category:** Anti-Patterns / Motion
- **Description:** The welcome experience now respects reduced motion, but the default path still foregrounds gradient text, shimmer, pulse, and glass-heavy presentation.
- **Impact:** The product remains memorable, but the opening still risks feeling decorative-first rather than task-first.
- **Recommendation:** Keep the reduced-motion work, but simplify the default presentation so the welcome surface reinforces the product’s authority more than its novelty.
- **Suggested command:** `/normalize`

#### 2. Dashboard hierarchy is better, but still panel-led rather than insight-led

- **Location:** `src/app/(app)/dashboard/page.tsx`
- **Severity:** Medium
- **Category:** Responsive / Anti-Patterns
- **Description:** The staged dashboard is a clear improvement over the old same-weight card grid, but it still depends heavily on repeated panels and short descriptive blocks rather than a more differentiated command surface.
- **Impact:** Users get a cleaner overview, but the screen still feels like an index of destinations rather than the operational center of the app.
- **Recommendation:** Continue evolving the dashboard toward one dominant decision area, one secondary action rail, and less repeated card framing.
- **Suggested command:** `/normalize`

#### 3. Tokenization is in place, but the visual system is still dark-only and partially transitional

- **Location:** `src/app/globals.css`, route shells under `src/app/**`
- **Severity:** Medium
- **Category:** Theming
- **Description:** The new token layer is a strong step forward, but the app still enforces a dark visual mode and not every surface has fully converged on the token vocabulary yet.
- **Impact:** Maintainability improved, but the system is not yet fully generalized or theme-flexible.
- **Recommendation:** Continue migrating route-level styling to semantic tokens and decide whether dark-only is an intentional brand constraint or temporary implementation state.
- **Suggested command:** `/normalize`

#### 4. Nested panel composition still appears in several feature surfaces

- **Location:** `src/components/start-smart/blueprint-panel.tsx`, `src/app/(app)/learn/[slug]/page.tsx`, `src/app/(app)/jobs/[slug]/page.tsx`
- **Severity:** Medium
- **Category:** Anti-Patterns / Layout
- **Description:** Several screens still stack interior panels inside larger framed shells.
- **Impact:** Hierarchy is clearer than before, but the visual language can still flatten when every content chunk is boxed.
- **Recommendation:** Reduce container nesting and let spacing, headings, and selective emphasis carry more of the structure.
- **Suggested command:** `/normalize`

### Low-Severity Issues

#### 5. The audit report itself must be kept synchronized with future staged fixes

- **Location:** `docs/frontend-audit-2026-04-07.md`
- **Severity:** Low
- **Category:** Documentation
- **Description:** The original version of this file became stale as fixes landed quickly afterward.
- **Impact:** Audit artifacts lose value fast if they preserve already-fixed blockers as current defects.
- **Recommendation:** Treat audit docs as living snapshots and refresh them whenever follow-up fixes materially change the severity landscape.
- **Suggested command:** `/normalize`

## Positive Findings

- **Reduced-motion support now exists** in the welcome experience.
- **Focus visibility is restored** for the Start Smart form controls.
- **Field-level validation and required guidance now exist** for regional profile inputs.
- **Dynamic submission errors are now announced** with alert semantics.
- **Internal integration routes now use app-native navigation** instead of raw anchors.
- **Typography is materially improved** with explicit body and display font pairing.
- **A design-token foundation now exists** and is already improving consistency.

## Recommendations by Priority

### Immediate

1. Preserve the welcome-gate behavior so first-time users do not see the landing shell before the entry experience resolves.
2. Keep the audit file synchronized with current staged behavior whenever fixes land.

### Short-term

1. Simplify the default welcome styling now that the motion/accessibility issues are fixed.
2. Continue converting repeated route shells into more differentiated, task-specific layouts.

### Medium-term

1. Finish migrating remaining surfaces onto the semantic token system.
2. Reduce nested panel usage in Learn, Jobs, and Blueprint detail surfaces.
3. Push the dashboard farther from a destination list and closer to a true operating surface.

## Suggested Commands for Follow-up Design Work

- **Use `/normalize`** to continue unifying the visual system and reducing repeated panel patterns.
- **Use `/optimize`** if the welcome experience needs another pass to reduce non-essential flourish on the default path.

## Audit Notes

- This file has been refreshed to match the current staged branch state.
- Earlier high-severity findings around reduced motion, focus visibility, field validation, status semantics, and internal link primitives are now considered resolved in the staged tree.
