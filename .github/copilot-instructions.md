# Copilot Instructions

## Scope
- Work from the repository root app unless a task explicitly targets the nested `budgetbitch/` prototype subtree.
- Prefer surgical edits that keep the current Next.js App Router, Prisma, and Clerk wiring intact.

## Validation
- Run `npm run lint`, `npm test`, and `npm run build` after code changes.
- Run targeted Playwright coverage for UI copy or navigation changes, especially under `tests/e2e/jobs.spec.ts` and `tests/e2e/integrations-*.spec.ts`.
- Vitest discovers tests under `src/**/*.{test,spec}.{ts,tsx}`; colocate new unit and component tests there.

## UI conventions
- Use explicit action copy over vague CTAs. Prefer labels like `Open job details`, `Open setup wizard`, `Open official login`, and `Open official docs`.
- Keep scan-first cards dense but readable: headline, key facts, one clear fit cue, then the primary action.
- Preserve heading order inside reusable card components; avoid introducing nested heading levels that break the page outline.

## Jobs surfaces
- `src/components/jobs/job-card.tsx` should stay scan-friendly and expose practical metadata users can compare quickly.
- When changing jobs UI, update both `src/components/jobs/job-card.test.tsx` and `src/app/(app)/jobs/page.test.tsx`, plus the relevant Playwright flow.

## Integrations surfaces
- Keep provider secrets server-side only.
- Integration mutations must remain authorized through authenticated workspace membership and server-owned connection lookup.
- Shared CTA generation belongs in the integrations modules/components layer rather than duplicated per page.
