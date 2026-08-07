# Copilot Instructions

`AGENTS.md` (mirrored in `CLAUDE.md`) is the canonical rule set. This file is a
short Copilot-facing summary — when the two disagree, `AGENTS.md` wins.

## Scope
- Work from the repository root app. (The prior nested `budgetbitch/` prototype subtree was removed on 2026-07-20.)
- Prefer surgical edits that keep the current Next.js App Router, Convex backend, and `@convex-dev/auth` auth wiring intact.
- The user-facing display name is **Budget Boss**; `BudgetBITCH` is the repo/package name only.

## Validation
- Run `npm run lint`, `npm run typecheck`, `npm run check:idb`, `npm test`, `npm run test:convex`, and `npm run build` after code changes — or `npm run ci` for the whole chain.
- Run targeted Playwright coverage for UI copy or navigation changes, especially under `tests/e2e/wizard.spec.ts` and `tests/e2e/dashboard.spec.ts`.
- Vitest discovers tests under `src/**/*.{test,spec}.{ts,tsx}`; colocate new unit and component tests there. Convex backend tests use `convex-test`.

## UI conventions
- Use explicit action copy over vague CTAs. Prefer labels like `Open setup wizard`, `Open official login`, and `Open official docs`.
- Keep scan-first cards dense but readable: headline, key facts, one clear fit cue, then the primary action.
- Preserve heading order inside reusable card components; avoid introducing nested heading levels that break the page outline.
- Server Components by default; add `'use client'` only for hooks/interactivity.

## Auth
- Convex Auth (email/password) is the shipped path; tokens live in `localStorage` for in-app webview support.
- There is no `src/middleware.ts` — protection is client-side via `<RequireAuth />` and `src/lib/auth/routes.ts`.
- `src/auth.ts` + `src/app/api/auth/[...nextauth]` are an unwired NextAuth Google scaffold. Do not build on them.

## Dashboard & Wizard surfaces
- `src/components/wizard/wizard-shell.tsx` governs the 10-step money survival blueprint onboarding flow.
- `src/components/dashboard/dashboard-shell.tsx` coordinates bento grid panels. Ensure mobile responsive layouts are verified using Playwright.
- Multi-board account switcher and shared couple boards should follow keyed-merge sync and offline queues.

## Convex, Receipts & local-first
- Read `convex/_generated/ai/guidelines.md` before changing Convex functions, schema, or auth.
- Use `.withIndex()` (never `.filter()`), bounded reads (`.take()`/pagination), and `ctx.auth.getUserIdentity()` for identity.
- Keep receipt parser provider secrets server-side only (`GEMINI_API_KEY` lives in Convex env).
- Receipts mutations and Gemini OCR parsing (`convex/receipts.ts`) must remain authorized.
- Local-first offline sync writes to the IndexedDB wrapper (`src/lib/db/local-db.ts`) and synchronizes daily; new stores need a `createObjectStore` call in `upgrade()` or `npm run check:idb` fails.
