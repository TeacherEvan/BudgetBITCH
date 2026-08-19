# Codebase State — God-Module Audit VERIFY Run

## Run metadata
- Date: 2026-08-18
- Repository: BudgetBITCH (`/home/ewaldt/Documents/VS/GAMES/BudgetBITCH`)
- Branch: `refactor/budgetboss-god-module-audit` (up to date with `origin/refactor/budgetboss-god-module-audit`)
- Starting commit: a83edeb
- Mode: VERIFY_AND_RECONCILE — no source files were mutated (read-only audit).

## Technology
- Next.js 16.3 (App Router, Turbopack) + React 18 + TypeScript strict
- Convex 1.34 (backend) + IndexedDB (`idb`) local-first
- next-intl 4.13 (6 locales), Tailwind v4, Vitest 4.1.10, Playwright 1.62.1

## Gate commands + exit codes (empirical, this run)
| Command | Purpose | Exit | Notes |
|---|---|---|---|
| `npm run lint` | ESLint 9 flat | 0 | clean |
| `npm run typecheck` | tsc --noEmit | 0 | clean |
| `npm run build` | Next.js prod build | 0 | (prior run, commit 75596b4) |
| `npm test` | Vitest full unit | 1 | 682 pass / 2 fail / 3 skip (124 files) |
| `npm run test:convex` | convex-test | 0 | 195/195 pass |

## The 2 failing unit specs (isolated empirically)
| Spec | Stashed your 4-file WIP | With WIP present | Verdict |
|---|---|---|---|
| `src/components/dashboard/dashboard-shell.test.tsx` > "Critical Expenses modal body is scrollable" | PASS (8/8) | FAIL | Caused by your uncommitted WIP (confetti/dynamic-import work) |
| `src/hooks/use-account-sync.test.tsx` > "queues an offline edit to localStorage instead of pushing" | PASS (10/10) | FAIL in full run (ordering artifact) | Pre-existing flakiness tied to WIP co-loaded in same worker; green when isolated |

## Test counts (full suite)
- Unit: 682 passing / 684 total (2 fail)
- Convex: 195 passing / 195 total
- Lint/Typecheck: 0 errors

## Git state (at audit start, before any action)
- Working tree: dirty — 4 WIP files (confetti/dashboard) + 2 accsync files (prior `ca15bcd` WIP)
- Untracked: `.prune/`, `HERMES_PLAN.ai.json/html`, `docs/GLE_MERGER_PLAN.md`, `docs/surgical-pruning-0818-BudgetBITCH.html`, `docs/AUDIT*.{log,html}`, `.prune-run.log`
- Remote: up to date with origin

## Prior refactor artifacts confirmed ON DISK (committed, commit 75596b4)
- `src/lib/quick-add/parse-entry.ts` (NEW) + test
- `src/lib/convex/sync-queue-compaction.ts` (NEW) + test
- `convex/receipts.ts` → thin `export *` barrel over `convex/receipts/index.ts` (+ `convex/receipts/internal.ts`)
- `package.json`: `@auth/core`, `@rive-app/canvas`, `agent-browser`, `unrs-resolver` removed; `next-auth` RETAINED (type-imported by session-claims.ts / next-auth.d.ts — not dead)

## Known issues
- `dashboard-shell.test.tsx` scroll test fails under your WIP → fix in the WIP's own PR, not the refactor.
- `convex/receipts-scrape.test.ts` schema-type error on `origin/main` (pre-existing, out of scope).

## Initial risks
- Cross-repo contamination: `docs/GLE_MERGER_PLAN.md` references `gle-platform` (a DIFFERENT repo). Per user instruction, NO edits were made outside BudgetBITCH; GLE plan treated as reference only.
