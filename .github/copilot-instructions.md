# Copilot Instructions

## Scope
- Work from the repository root app. (The prior nested `budgetbitch/` prototype subtree was removed on 2026-07-20.)
- Prefer surgical edits that keep the current Next.js App Router, Convex backend, and `@convex-dev/auth` auth wiring intact.

## Validation
- Run `npm run lint`, `npm test`, and `npm run build` after code changes.
- Run targeted Playwright coverage for UI copy or navigation changes, especially under `tests/e2e/wizard.spec.ts` and `tests/e2e/dashboard.spec.ts`.
- Vitest discovers tests under `src/**/*.{test,spec}.{ts,tsx}`; colocate new unit and component tests there.

## UI conventions
- Use explicit action copy over vague CTAs. Prefer labels like `Open setup wizard`, `Open official login`, and `Open official docs`.
- Keep scan-first cards dense but readable: headline, key facts, one clear fit cue, then the primary action.
- Preserve heading order inside reusable card components; avoid introducing nested heading levels that break the page outline.

## Dashboard & Wizard surfaces
- `src/components/wizard/wizard-shell.tsx` governs the 10-step money survival blueprint onboarding flow.
- `src/components/dashboard/dashboard-shell.tsx` coordinates bento grid panels. Ensure mobile responsive layouts are verified using Playwright.
- Multi-board account switcher and shared couple boards should follow keyed-merge sync and offline queues.

## Integrations & Receipts surfaces
- Keep receipt parser provider secrets server-side only.
- Receipts mutations and Gemini OCR parsing (`convex/receipts.ts`) must remain authorized.
- Local-first offline sync writes to IndexedDB wrapper (`src/lib/db/local-db.ts`) and synchronizes daily.
