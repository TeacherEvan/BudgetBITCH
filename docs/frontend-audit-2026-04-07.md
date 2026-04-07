# Frontend Audit — 2026-04-07

Scope: root Next.js app under `src/`.

Method: source inspection across the main app routes and shared UI components, targeted grep-based verification for accessibility and theming patterns, and a production build check with `npm run build`.

Note: the requested frontend-design skill is not available in this environment, so this audit uses the supplied design criteria directly.

## Anti-Patterns Verdict

**Verdict: Fail. The current branch reads as unfinished AI-generated UI, not a production-grade interface.**

Specific tells:

- **Unresolved merge markers are still committed** in primary routes and shared components, which is the strongest possible sign of unfinished generation/merge churn rather than intentional design.
- **One radial gradient + frosted dark panel pattern is repeated** across Learn, Jobs, Integrations, Start Smart, and detail pages instead of giving each workflow a distinct visual job.
- **Nested panels inside panels** remain common in Start Smart and the blueprint surfaces, flattening hierarchy.
- **Dark-only hard-coding** dominates route shells and overrides the new token layer.
- **Conflicting copy directions coexist in the same files**, which makes tone and IA feel machine-spliced rather than deliberately edited.

## Executive Summary

- **Total issues found:** 11
- **Critical:** 1
- **High:** 4
- **Medium:** 4
- **Low:** 2
- **Overall quality score:** **28/100**

### Most critical issues

1. The frontend does not currently build because unresolved merge conflict markers are present in production routes and shared components.
2. The regression surface is also corrupted by conflict markers in multiple frontend test files, so the UI has no trustworthy safety net.
3. The theming system is only partially adopted: major routes still hard-code dark gradients, frosted surfaces, and non-token colors.
4. The Start Smart lane switcher exposes tab semantics without implementing a complete tab pattern.
5. Several actionable links and buttons fall below the requested 44x44 touch-target threshold.

### Recommended next steps

1. Resolve all merge conflicts in production and test files before any design polish work.
2. Normalize route shells onto the token system before making further aesthetic changes.
3. Fix the incomplete tab semantics and the undersized action targets.
4. Only after the app builds cleanly should the repeated panel/glass composition be redesigned.

## Detailed Findings By Severity

### Critical Issues

#### 1. Unresolved merge markers break the production frontend

- **Location:** `src/app/page.tsx:1`, `src/app/page.tsx:125`, `src/app/(app)/dashboard/page.tsx:13`, `src/app/(app)/learn/page.tsx:72`, `src/app/(app)/jobs/page.tsx:161`, `src/app/(app)/settings/integrations/page.tsx:59`, `src/components/start-smart/start-smart-shell.tsx:241`, `src/components/start-smart/template-picker.tsx:66`, `src/components/integrations/provider-card.tsx:38`, `src/components/learn/lesson-card.tsx:13`, `src/components/jobs/jobs-filter-panel.tsx:38`
- **Severity:** Critical
- **Category:** Core functionality
- **Description:** Git merge markers (`<<<<<<<`, `=======`, `>>>>>>>`) remain in 10 production frontend files. `npm run build` fails with 23 parsing errors as a direct result.
- **Impact:** Core routes cannot be shipped or trusted. Learn, Jobs, Integrations, Start Smart, Dashboard, and the landing page are all in a broken state.
- **WCAG/Standard:** Blocks conformance indirectly because users cannot reliably access core content.
- **Recommendation:** Resolve every conflicted file, choose one branch of each UI direction, then rerun build and route-level tests before any design iteration.
- **Suggested command:** `/normalize`

### High-Severity Issues

#### 2. Frontend tests also contain merge markers, so regressions cannot be verified

- **Location:** `src/app/page.test.tsx:10`, `src/app/(app)/dashboard/page.test.tsx:6`, `src/app/(app)/learn/page.test.tsx:5`, `src/app/(app)/jobs/page.test.tsx:10`, `src/app/(app)/settings/integrations/page.test.tsx:33`, `src/app/(app)/start-smart/page.test.tsx:8`, `src/components/start-smart/start-smart-shell.test.tsx:40`, `src/components/integrations/provider-card.test.tsx:7`
- **Severity:** High
- **Category:** Verification
- **Description:** Eight frontend test files still contain unresolved conflict markers.
- **Impact:** Even after the source compiles, the review loop is compromised because the tests that should validate UI behavior are themselves broken.
- **WCAG/Standard:** No direct WCAG mapping; this is release-risk and verification debt.
- **Recommendation:** Resolve test-file conflicts in lockstep with production files and restore a green frontend test baseline before continuing design work.
- **Suggested command:** `/normalize`

#### 3. Dark-only hard-coding bypasses the token system across major routes

- **Location:** `src/app/globals.css:4`, `src/app/(app)/learn/page.tsx:71`, `src/app/(app)/jobs/page.tsx:160`, `src/app/(app)/settings/integrations/page.tsx:61`, `src/app/(app)/learn/[slug]/page.tsx:20`, `src/app/(app)/jobs/[slug]/page.tsx:18`, `src/components/start-smart/start-smart-shell.tsx:238`
- **Severity:** High
- **Category:** Theming
- **Description:** The app declares a token layer in `globals.css`, but major route shells still hard-code the same emerald radial gradient, `bg-black/20`, `bg-white/5`, and `backdrop-blur` combinations. `:root` is also locked to `color-scheme: dark`.
- **Impact:** Theme consistency is fragile, dark mode is effectively mandatory, and any future theme or accessibility tuning requires route-by-route rewrites instead of token updates.
- **WCAG/Standard:** Risks WCAG 1.4.3 and 1.4.11 over time because contrast and theming must be audited per route instead of centrally.
- **Recommendation:** Move route shells and major surfaces onto semantic tokens and decide explicitly whether dark-only is a brand requirement or an implementation shortcut.
- **Suggested command:** `/normalize`

#### 4. The Start Smart lane selector declares tabs without implementing a complete tab pattern

- **Location:** `src/components/start-smart/template-picker.tsx:83`, `src/components/start-smart/template-picker.tsx:91`, `src/components/start-smart/template-picker.tsx:92`
- **Severity:** High
- **Category:** Accessibility
- **Description:** The lane switcher uses `role="tablist"` and `role="tab"` with `aria-selected`, but there is no associated `tabpanel`, no `aria-controls`, and no evidence of keyboard-specific arrow navigation.
- **Impact:** Screen-reader and keyboard users are told this is a tabs widget, but the component does not fulfill the contract of that pattern.
- **WCAG/Standard:** WCAG 4.1.2 Name, Role, Value; WCAG 2.1.1 Keyboard
- **Recommendation:** Either implement a full tabs pattern with linked tabpanels and arrow-key behavior, or remove tab roles and use plain buttons with simpler semantics.
- **Suggested command:** `/harden`

#### 5. Several actionable controls fall below the requested 44x44 touch-target threshold

- **Location:** `src/components/integrations/provider-wizard-shell.tsx:20`, `src/components/integrations/provider-card.tsx:84`, `src/components/integrations/provider-card.tsx:92`, `src/components/integrations/provider-card.tsx:100`, `src/components/learn/lesson-card.tsx:54`, `src/components/jobs/job-card.tsx:63`
- **Severity:** High
- **Category:** Responsive
- **Description:** Multiple interactive links use `px-4 py-2` or similar compact sizing. These controls are likely around the mid-30px range in height, below the requested 44x44 target.
- **Impact:** Mobile and motor-impaired users get less reliable tap targets, especially in dense card layouts.
- **WCAG/Standard:** Fails the requested audit threshold; also falls short of WCAG 2.5.5 Target Size (Enhanced) and is close to WCAG 2.5.8 concerns in dense layouts.
- **Recommendation:** Increase minimum hit area for card CTAs and compact back links, ideally by applying a shared minimum target-size utility.
- **Suggested command:** `/normalize`

### Medium-Severity Issues

#### 6. Repeated glass-panel composition creates systemic hierarchy flattening

- **Location:** `src/components/start-smart/start-smart-shell.tsx:238`, `src/components/start-smart/profile-form.tsx:35`, `src/components/start-smart/blueprint-panel.tsx:42`, `src/components/learn/recommended-lessons.tsx:22`, `src/app/(app)/learn/[slug]/page.tsx:21`, `src/app/(app)/jobs/[slug]/page.tsx:19`, `src/app/(app)/settings/integrations/page.tsx:102`
- **Severity:** Medium
- **Category:** Anti-patterns
- **Description:** The UI repeatedly wraps pages in a large frosted shell, then nests secondary bordered panels, then tertiary boxed content inside those panels.
- **Impact:** Every section competes at the same visual weight. The app feels templated and harder to scan because grouping depends on more boxes instead of clearer information architecture.
- **WCAG/Standard:** No direct WCAG violation; this is a design-system and usability issue.
- **Recommendation:** Reduce container nesting and let spacing, type scale, and a smaller set of emphasized surfaces define hierarchy.
- **Suggested command:** `/normalize`

#### 7. Fixed 320px and 360px side rails make the layout brittle at zoom and mid-size widths

- **Location:** `src/components/start-smart/start-smart-shell.tsx:239`, `src/components/start-smart/start-smart-shell.tsx:344`, `src/app/(app)/jobs/page.tsx:163`, `src/app/(app)/jobs/page.tsx:201`
- **Severity:** Medium
- **Category:** Responsive
- **Description:** Start Smart and Jobs hard-code side columns at `320px` and `360px` in custom grid templates.
- **Impact:** The layouts may feel acceptable at full width, but they are more likely to pinch content at browser zoom, small laptops, split-screen use, or future copy growth.
- **WCAG/Standard:** Risks WCAG 1.4.10 Reflow when content or zoom pressure increases.
- **Recommendation:** Replace fixed rails with fluid `minmax()` constraints, container-query adaptations, or stack earlier for mid-size viewports.
- **Suggested command:** `/normalize`

#### 8. The token system is undermined by leftover raw black/white RGBA values

- **Location:** `src/app/globals.css:22`, `src/app/globals.css:23`, `src/app/globals.css:146`, `src/app/globals.css:165`, `src/app/globals.css:206`, `src/app/globals.css:223`, `src/app/globals.css:251`
- **Severity:** Medium
- **Category:** Theming
- **Description:** Even after introducing semantic tokens, core shadows, focus layers, and several surfaces still rely on direct `rgba()` white/black values.
- **Impact:** Theme changes will remain inconsistent, and visual tuning still requires low-level color edits rather than token adjustments.
- **WCAG/Standard:** No direct violation, but it weakens contrast governance and maintainability.
- **Recommendation:** Complete tokenization for overlays, strokes, shadows, and translucent surfaces.
- **Suggested command:** `/normalize`

#### 9. The visual language is too repetitive across major workflows

- **Location:** `src/app/(app)/learn/page.tsx:71`, `src/app/(app)/jobs/page.tsx:160`, `src/app/(app)/settings/integrations/page.tsx:61`, `src/app/(app)/learn/[slug]/page.tsx:20`, `src/app/(app)/jobs/[slug]/page.tsx:18`
- **Severity:** Medium
- **Category:** Anti-patterns
- **Description:** Learn, Jobs, Integrations, and both detail routes all reuse nearly the same wrapper recipe: emerald radial background, dark frosted shell, rounded border, uppercase yellow kicker.
- **Impact:** Different tasks do not feel meaningfully different. The product reads as one template with swapped copy rather than a set of intentionally designed experiences.
- **WCAG/Standard:** No direct WCAG mapping.
- **Recommendation:** Define distinct visual roles for overview, exploration, detail, and setup flows instead of cloning one route shell everywhere.
- **Suggested command:** `/normalize`

### Low-Severity Issues

#### 10. Small uppercase meta labels are overused and reduce scan efficiency

- **Location:** `src/app/globals.css:93`, `src/app/(app)/learn/page.tsx:117`, `src/app/(app)/jobs/page.tsx:219`, `src/app/(app)/settings/integrations/page.tsx:109`
- **Severity:** Low
- **Category:** Accessibility
- **Description:** Tiny, high-tracking uppercase labels are used frequently for kickers, pills, and section metadata.
- **Impact:** They look intentional in moderation, but repeated use increases reading friction and makes the hierarchy rely on styling flourishes instead of simpler labels.
- **WCAG/Standard:** No direct failure; readability quality issue.
- **Recommendation:** Reserve uppercase kicker styling for a smaller number of navigation anchors and let normal-case labels carry the rest.
- **Suggested command:** `/normalize`

#### 11. Build configuration emits a root-detection warning because workspace boundaries are ambiguous

- **Location:** build output from `npm run build`
- **Severity:** Low
- **Category:** Performance
- **Description:** Next.js warns that Turbopack inferred the workspace root from a lockfile outside the repo and suggests setting `turbopack.root` or removing extra lockfiles.
- **Impact:** This does not currently block shipping beyond the merge conflicts, but it adds avoidable build ambiguity and can complicate tooling behavior.
- **WCAG/Standard:** Not applicable.
- **Recommendation:** Pin the intended Turbopack root in Next config or eliminate stray lockfiles influencing detection.
- **Suggested command:** `/optimize`

## Patterns & Systemic Issues

- **Conflict churn is widespread:** 18 frontend files contain merge markers, including 10 production files and 8 test files.
- **Route shells are cloned instead of composed:** Learn, Jobs, Integrations, and detail flows all reuse near-identical wrappers.
- **Token adoption is incomplete:** semantic tokens exist, but route shells and translucent surfaces still hard-code colors.
- **Panel nesting is a default habit:** large shell, inner panel, inner-inner card shows up repeatedly.
- **Accessibility work is uneven:** some components show careful focus and error semantics, while others use incomplete ARIA patterns or undersized hit areas.

## Positive Findings

- `src/app/layout.tsx:2` introduces a deliberate body/display font pairing with `Public Sans` and `Source Serif 4`, which is materially stronger than a default system stack.
- `src/app/globals.css:172` provides explicit `:focus-visible` styling for the shared button and link-card system.
- `src/components/start-smart/profile-form.tsx:53` and `src/components/start-smart/profile-form.tsx:84` show good field wiring with labels, `aria-describedby`, `aria-invalid`, and required-state handling.
- `src/components/start-smart/start-smart-shell.tsx:418` announces submission failures with `role="alert"` and `aria-live="assertive"`.
- `src/components/start-smart/start-smart-shell.tsx:309` uses `aria-current="step"` in the step map, which is a good semantic choice for wizard progress.
- The product direction is already moving toward a more practical voice. Once the conflicts are resolved, the practical branch is the stronger base to continue from.

## Recommendations By Priority

### Immediate

1. Resolve all merge conflicts in production routes and shared components.
2. Resolve all merge conflicts in frontend tests and restore a passing verification baseline.
3. Re-run `npm run build` and frontend tests before making any design decisions from screenshots or browser output.

### Short-term

1. Normalize major route shells to the token system and remove hard-coded gradient wrappers.
2. Fix the Start Smart lane control so it is either a real tabs widget or a simpler button group.
3. Increase minimum target sizes for small CTAs and navigation links.

### Medium-term

1. Replace fixed 320px and 360px side rails with fluid responsive patterns.
2. Reduce nested panel composition in Start Smart, Learn, Jobs, and Integrations.
3. Finish tokenizing overlays, borders, shadows, and translucent surfaces.

### Long-term

1. Give each major workflow a distinct visual role instead of repeating one global shell.
2. Simplify kicker and badge usage so metadata feels editorial, not ornamental.
3. Clean up build-root ambiguity to keep tooling predictable.

## Suggested Commands For Fixes

- **Use `/normalize`** to resolve merge-selected UI direction, unify route shells, complete token adoption, enlarge targets, and reduce panel nesting.
- **Use `/harden`** to repair the incomplete tab semantics and any remaining keyboard/ARIA mismatches.
- **Use `/optimize`** after the branch builds cleanly to address build-root ambiguity and reduce repeated wrapper overhead.

## Verification Notes

- `npm run build` was executed from the repo root.
- The build failed with 23 parse errors caused by unresolved merge markers in frontend source files.
- This report intentionally does **not** propose design polish ahead of build recovery, because the current branch state is not yet a valid UI baseline.

