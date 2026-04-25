# API Workspace Auth And Learn Navigation Regressions Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore authorization for the three workspace-scoped `/api/v1` routes without re-breaking the repo's no-Clerk local harness flows, and restore meaningful Learn navigation coverage from the Start Smart blueprint result.

**Architecture:** Keep middleware narrow and treat these regressions at the actual control points. Use a small shared route-level workspace access resolver for the three affected handlers so production/live Clerk requests require authenticated workspace membership, while no-Clerk local/demo mode is explicitly limited to the existing demo workspace path instead of allowing arbitrary `workspaceId` input.

**Tech Stack:** Next.js App Router, TypeScript, Clerk, Prisma, Vitest, Playwright.

---

## Short recommended approach

Do not widen `src/middleware.ts` back to all of `/api/v1`. That was the previous blast-radius mistake.

Instead, add one shared route-level guard/resolver used only by:

- `src/app/api/v1/start-smart/blueprint/route.ts`
- `src/app/api/v1/jobs/recommendations/route.ts`
- `src/app/api/v1/learn/recommendations/route.ts`

That resolver should enforce two explicit modes:

- Live/authenticated mode: when Clerk is configured, require an authenticated user with membership in the requested workspace and pass only the trusted workspace identity downstream.
- Local/demo mode: when Clerk is not configured, allow only the existing demo workspace path used by the repo's local Start Smart, Jobs, and Learn flows; reject any other `workspaceId` so arbitrary workspace access is no longer possible.

This keeps the middleware surface stable, fixes the real authorization gap, and preserves the current Playwright-friendly local harness behavior.

## Ordered implementation steps

- [ ] **Step 1: Lock the boundary in tests before changing auth behavior.**
Add or expand focused Vitest coverage for `src/middleware.test.ts` so the three affected routes are explicitly documented as remaining outside middleware protection, while the already-protected API prefixes stay protected. This prevents a future “protect all `/api/v1`” regression from returning silently.

- [ ] **Step 2: Introduce one shared workspace API access resolver for the three affected routes.**
Create a small auth helper under `src/lib/auth/` that resolves trusted workspace access for workspace-scoped API handlers. Reuse the current Clerk and Prisma membership patterns from `src/lib/auth/workspace-route-guard.ts`, but add an explicit no-Clerk local/demo branch that only accepts the known demo workspace identifier.

- [ ] **Step 3: Wire the three affected routes to the shared resolver with minimal handler churn.**
Update `src/app/api/v1/start-smart/blueprint/route.ts`, `src/app/api/v1/jobs/recommendations/route.ts`, and `src/app/api/v1/learn/recommendations/route.ts` to stop trusting raw client `workspaceId` after validation. Each handler should resolve trusted workspace access first, use the returned trusted workspace identifier for Prisma reads or writes, and translate resolver errors into consistent JSON status codes.

- [ ] **Step 4: Add route-level regression coverage for live auth and local demo behavior.**
Expand the three route test files so each route covers four cases: successful authorized access, unauthenticated live access, authenticated non-member access, and no-Clerk local/demo access limited to the approved demo workspace. Add one negative no-Clerk test proving an arbitrary non-demo `workspaceId` is rejected.

- [ ] **Step 5: Stabilize and restore Learn navigation coverage from the actual blueprint result.**
Update `tests/e2e/learn.spec.ts` so it clicks the real Learn link rendered in the Start Smart blueprint panel instead of opening a fresh page and deep-linking directly. Use the repo's stable navigation pattern with `Promise.all([page.waitForURL(..., { waitUntil: "commit" }), click])`, and assert both the destination URL and the lesson page content.

- [ ] **Step 6: Tighten any nearby unit coverage that documents the link source.**
Keep `src/components/start-smart/blueprint-panel.test.tsx` aligned with the E2E expectation so the link text and href remain intentional. Only expand this if needed to make the Playwright test's locator contract explicit and durable.

- [ ] **Step 7: Run focused validation first, then full repo checks.**
Run the touched Vitest slices first, then the targeted Playwright Learn spec, then the required repo validations: `npm run lint`, `npm test`, and `npm run build`.

## Files likely to change

- Modify: `src/middleware.test.ts`
- Create: `src/lib/auth/<new workspace api access helper>.ts`
- Create: `src/lib/auth/<new workspace api access helper>.test.ts`
- Modify: `src/app/api/v1/start-smart/blueprint/route.ts`
- Modify: `src/app/api/v1/start-smart/blueprint/route.test.ts`
- Modify: `src/app/api/v1/jobs/recommendations/route.ts`
- Modify: `src/app/api/v1/jobs/recommendations/route.test.ts`
- Modify: `src/app/api/v1/learn/recommendations/route.ts`
- Modify: `src/app/api/v1/learn/recommendations/route.test.ts`
- Modify: `tests/e2e/learn.spec.ts`
- Possibly modify: `src/components/start-smart/blueprint-panel.test.tsx`

## Focused validation plan

- Run the new shared helper test file first to prove the live-auth, membership, and local-demo branches behave as intended.
- Run the three touched route test files to confirm handlers consume only trusted workspace identity and return the expected error statuses.
- Run `npm test -- src/middleware.test.ts src/app/api/v1/start-smart/blueprint/route.test.ts src/app/api/v1/jobs/recommendations/route.test.ts src/app/api/v1/learn/recommendations/route.test.ts`.
- Run `npm run test:e2e -- tests/e2e/learn.spec.ts` or the equivalent targeted Playwright invocation used in this repo.
- Run the required repository checks after focused validation passes: `npm run lint`, `npm test`, and `npm run build`.

## Main risks and rollback points

- **Risk: breaking no-Clerk local flows again.**
Mitigation: keep middleware prefixes unchanged and prove the explicit no-Clerk demo branch in helper and route tests before touching Playwright.
Rollback point: revert only the new route-helper wiring and helper tests; do not widen middleware.

- **Risk: hard-coding the wrong local exception.**
Mitigation: centralize the approved demo workspace identifier in one helper path instead of duplicating string checks across three routes.
Rollback point: revert the helper constant/branch and re-enable the prior local behavior while preserving the added tests that describe the expected contract.

- **Risk: route tests pass but live membership semantics drift from existing auth patterns.**
Mitigation: mirror the same Clerk profile lookup and `workspaceMember` membership checks already used in `src/lib/auth/workspace-route-guard.ts`.
Rollback point: keep the helper file isolated so the three routes can be switched back independently if one handler behaves differently.

- **Risk: E2E navigation remains flaky under webpack dev startup.**
Mitigation: avoid `newPage()` and direct `goto()` for the lesson assertion, and use `waitForURL(..., { waitUntil: "commit" })` around the actual click.
Rollback point: if the full end-to-end click remains unstable, keep the restored click assertion and add one intermediate URL assertion before narrowing the final content assertion.

## Self-review

- Review item 1 is covered by the shared route-level resolver, the three handler updates, middleware boundary tests, and the live-vs-demo regression cases.
- Review item 2 is covered by the Playwright Learn step and the optional blueprint-panel unit alignment.
- The plan keeps scope surgical: no Clerk provider rewiring, no broad middleware expansion, no nested `budgetbitch/` work.
