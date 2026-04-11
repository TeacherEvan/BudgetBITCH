# Visual Dashboard Billboard Implementation Plan

Goal: Ship a required app-start customization wizard and a fixed-window interactive billboard dashboard with no vertical page scroll, a launcher-first tool surface, a local-area ticker, and a live trusted-source briefing across Politics, Science, Agriculture, Entertainment, and Investments.

Architecture: Next.js App Router plus a server-side briefing aggregation module, client motion surfaces, and the existing root dashboard route. No new database or Convex table in V1; keep the live briefing reversible through a bounded API route and client refresh.

Tech Stack: Next.js 16, React 19, TypeScript, Tailwind v4, existing dashboard components, existing landing flow.

Estimated Complexity: 6 feature tasks.

Highest-risk task: trusted-source open-web briefing normalization.
Mitigation: start with an allowlisted source registry, fixed 5-element schema, strict text caps, and cached fallback before touching the dashboard UI.

Critical path: T0 -> T1 -> T2 -> T4 -> T5 -> T6

Milestones:
1. Foundation: T0-T2. Trusted-source briefing contract and ingestion path defined and tested.
2. Entry wizard: T3. Required launch wizard replaces the current landing gate.
3. Billboard dashboard: T4-T5. No-scroll cinematic dashboard with launcher grid and live briefing.
4. Hardening: T6. Docs, full validation, and targeted e2e coverage.

Dependency notes:
- T1 depends on T0.
- T2 depends on T1.
- T3 depends on T0.
- T4 depends on T2 and T3.
- T5 depends on T4.
- T6 depends on T5.

Rollback points:
- After T2: briefing pipeline exists with no landing/dashboard UI changes required yet.
- After T3: wizard is isolated to / entry flow.
- After T5: full feature slice present and test-covered.

Task plan:

T0. Baseline verification [XS]
Files: none
Commands: npm run lint; npm test; npm run build
Expected output: lint exits 0, vitest shows PASS, and Next build completes successfully.

T1. Write failing tests for the trusted-source briefing contract [S]
Files: src/modules/dashboard/briefing/source-registry.test.ts; src/modules/dashboard/briefing/fetch-briefing.test.ts
Intent: registry returns exactly 5 core elements; each element normalizes to exactly 3 related fields; field labels are dynamic but bounded; facts are short, deduped, attributed, and safe for UI rendering; fallback content is returned when source fetch fails.
Command: npm test -- src/modules/dashboard/briefing/source-registry.test.ts src/modules/dashboard/briefing/fetch-briefing.test.ts
Expected failure: missing module errors for the new briefing files.

T2. Implement briefing registry, normalization, and API route [M]
Files: src/modules/dashboard/briefing/types.ts; src/modules/dashboard/briefing/source-registry.ts; src/modules/dashboard/briefing/fetch-briefing.ts; src/app/api/v1/dashboard/briefing/route.ts; src/app/api/v1/dashboard/briefing/route.test.ts
Implementation: add typed element and field contracts; add trusted-source allowlist with per-element source definitions; fetch server-side only; normalize to a fixed UI-safe shape; enforce text truncation, dedupe, attribution, TTL cache, and fallback payloads; expose the normalized payload through one dashboard briefing route.
Command: npm test -- src/modules/dashboard/briefing/source-registry.test.ts src/modules/dashboard/briefing/fetch-briefing.test.ts src/app/api/v1/dashboard/briefing/route.test.ts
Expected success: all new briefing tests pass.

T3. Write failing tests for the required app-start wizard, then implement it [M]
Files: src/app/page.test.tsx; tests/e2e/smoke.spec.ts; src/components/launch/launch-wizard.tsx; src/components/launch/launch-wizard.test.tsx; src/app/page.tsx
Intent: / no longer drops users into the old route-lane landing first; wizard is required on first run; wizard collects full customization choices; city-level permission copy explicitly says no location data is collected by the app; crypto choice appears only as a placeholder option, not a live integration; returning users bypass wizard based on saved choice.
Commands: npm test -- src/app/page.test.tsx src/components/launch/launch-wizard.test.tsx; npm run test:e2e -- tests/e2e/smoke.spec.ts
Implementation: replace the current welcome and landing reveal with the required launch wizard gate; persist wizard completion plus persona, theme, and layout selections client-side; keep city-only permission and skip-safe behavior.

T4. Write failing dashboard shell tests for fixed-window no-scroll billboard layout [S]
Files: src/app/(app)/dashboard/page.test.tsx; src/components/dashboard/broadcast-bar.test.tsx; src/components/dashboard/launcher-grid.test.tsx; src/components/dashboard/live-briefing-rail.test.tsx
Intent: dashboard headline and hierarchy change to launcher-first billboard layout; tool launcher grid is the first-glance action surface; broadcast bar shows local area plus left-to-right motion strip copy; live briefing rail renders 5 core elements with 3 fields each; fixed tile counts and truncation rules prevent vertical overflow at target window size.
Command: npm test -- src/app/(app)/dashboard/page.test.tsx src/components/dashboard/broadcast-bar.test.tsx src/components/dashboard/launcher-grid.test.tsx src/components/dashboard/live-briefing-rail.test.tsx
Expected failure: headings and locators fail because new surfaces do not exist yet.

T5. Implement the billboard dashboard and e2e hardening [M]
Files: src/app/(app)/dashboard/page.tsx; src/modules/dashboard/dashboard-data.ts; src/components/dashboard/broadcast-bar.tsx; src/components/dashboard/launcher-grid.tsx; src/components/dashboard/live-briefing-rail.tsx; src/app/globals.css; tests/e2e/dashboard.spec.ts
Implementation: compose dashboard data with persona/customization plus city label plus live briefing feed; build top broadcast bar with local area ticker; replace current action area with an oversized launcher grid for popular budgeting tools; add a cinematic hero stage without breaking heading order; add the live briefing rail for the 5 core elements; enforce height budgets and overflow rules in CSS; hydrate briefing after first paint if needed, but keep the initial shell stable.
Commands: npm test -- src/app/(app)/dashboard/page.test.tsx src/components/dashboard/*.test.tsx; npm run test:e2e -- tests/e2e/dashboard.spec.ts
Expected success: all dashboard unit and component tests pass; dashboard e2e verifies the no-scroll billboard slice and required surfaces.

T6. Documentation, regression pass, and release validation [S]
Files: README.md; docs/CODEBASE_INDEX.md
Doc updates: note the required app-start wizard; note the dashboard billboard layout and trusted-source live briefing route; note crypto is placeholder-only in this phase.
Validation: npm run lint; npm test; npm run build; npm run test:e2e -- tests/e2e/smoke.spec.ts tests/e2e/dashboard.spec.ts
Expected success: all commands exit 0.

Performance and UX budgets:
- No vertical page scroll at the target fixed window size.
- Max concurrent motion zones: 3.
- Briefing payload: bounded to 5 elements x 3 fields.
- Each field body: truncated to scan-friendly short copy.
- Fallback behavior: cached last-known-good or seeded trusted fallback, never blank raw scrape text.

Best-practice constraints baked into the plan:
- no raw client-side scraping
- trusted-source allowlist only
- city-level permission only
- no exact location storage
- no crypto integration in this phase; placeholder only
- no new data store introduced for V1
- no Convex expansion unless V1 proves the need for live subscriptions later
