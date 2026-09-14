# REQUIREMENTS — 2026-08-19 Best-Practices Audit, Seek, Update & Implement

**Run id:** 2026-08-19-best-practices
**Target repo:** BudgetBITCH (Budget Boss) — `TeacherEvan/BudgetBITCH` @ `main`
**Trigger:** User directive "Audit, seek, update and implement following best practices",
invoked via `surgical-implementation` skill (V2 state machine).

## Scope (derived from empirical DISCOVER, not stale plan self-report)
Prior best-practices plans (2026-08-18 ×3) over-claimed completion (F1/F2 marked
"applied/open" but are already DONE in the live tree). This run re-derives scope
from the **current working tree** and executes only the OPEN, verifiable items.

## Request restatement
Audit the repo against best practices, seek existing gaps/open debt, update the
codebase accordingly, and implement the safe fixes — empirically verified, no
blind re-derivation of finished work.

## Functional requirements
- FR-1: Remove the unwired `next-auth` Google scaffold (`src/auth.ts`,
  `src/app/api/auth/[...nextauth]`) and uninstall `next-auth` from package.json,
  WITHOUT breaking the shipped `@convex-dev/auth` path.
- FR-2: Remove the redundant `strokeDasharray` attribute in `progress-ring.tsx`
  (keep the `style` form only) — a trivial best-practice cleanup.
- FR-3: Migrate Quick Add's inline `const labels = { en: ... }` + `const l =
  labels.en` to `next-intl` `useTranslations('QuickAdd')`, with a `QuickAdd`
  namespace populated across all 6 supported locales (en, es, fr, de, pt, zh).
- FR-4: Replace the bogus `SECURITY.md` (GitHub boilerplate referencing
  non-existent "5.1.x" versions) with an accurate security policy for the real
  stack (Convex Auth, local-first IndexedDB, web-push VAPID, no hardcoded secrets).

## Non-functional requirements
- NFR-1: Every change must keep `npm run lint`, `npm run typecheck`, `npm test`,
  and `npm run build` green (the established 11-step CI baseline).
- NFR-2: No new production secrets; no changes to Convex `api.*` contracts.
- NFR-3: Quick Add migration must not change user-facing behaviour for `en`
  users (parity), and must not break existing quick-add tests.

## Explicitly OUT OF SCOPE (flagged, not done)
- Wizard `normLocale` "harmonize to 6 locales": `WizardProfile.locale` is typed
  `string | 'en-ZA' | 'en-TH'`. Re-typing it to the 6 next-intl locales is a
  behavior/type change with cross-cutting impact (profile persistence, server
  components). SCOPE_FAILURE to silently apply — surfaced to user as a decision.
- `convex/receipts.ts` monolith split, sync-queue compaction, offline WASM
  pre-cache, dashboard code-splitting: already landed in prior sprints (verified
  green); re-implementing would fabricate diffs. Not redone.

## Constraints / Assumptions
- Auth is 100% `@convex-dev/auth`; localStorage token (mobile webview support).
  Removing `next-auth` must not touch any Convex file.
- i18n catalogs live at `src/i18n/locales/{en,es,fr,de,pt,zh}.ts` (typed
  `LocaleMessages`), imported by `src/i18n/messages.ts`. New namespaces must be
  added to all 6 and keep the `LocaleMessages` type satisfied.

## Acceptance criteria
| AC | Requirement | Pass condition |
|----|-------------|----------------|
| AC-001 | FR-1 | `next-auth` absent from package.json; `src/auth.ts` + `src/app/api/auth/**` deleted; `npm test` + `npm run typecheck` green; no remaining `next-auth`/`@auth/core` import outside deleted files. |
| AC-002 | FR-2 | `progress-ring.tsx` has exactly one `strokeDasharray` (in `style`), lint+tsc clean. |
| AC-003 | FR-3 | `quick-add/page.tsx` uses `useTranslations('QuickAdd')`; `QuickAdd` namespace present in all 6 locale catalogs; `en` rendering identical to prior `labels.en`; existing quick-add tests pass. |
| AC-004 | FR-4 | `SECURITY.md` describes the real auth/sync/push surface with no fictional version numbers; lint/docs checks unaffected. |
| AC-005 | NFR-1..3 | Full `npm run ci` green (lint, typecheck, idb, csp, convex-imports, comments, unit, convex, build). |
