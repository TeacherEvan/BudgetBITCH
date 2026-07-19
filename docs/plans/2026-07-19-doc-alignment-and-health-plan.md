# 2026-07-19 — Doc Alignment + Codebase Health Plan

## Audit scope
Active root app (`src/`, `convex/`) only. The `.worktrees/authjs-google-i18n-a11y/`
subtree is an abandoned experimental branch (different architecture: Prisma/Clerk/
Inngest/integrations/jobs/learn) and is explicitly excluded. `budgetbitch/` nested
subtree is a separate Convex prototype — excluded.

## Health status (measured 2026-07-19)
| Check | Result |
|-------|--------|
| `npm run lint` | 0 errors, 29 unused-var warnings |
| `npm run test` | 182 passed / 33 files |
| `npm run build` | Compiled successfully; clean TS; all routes build |
| `npm run test:convex` | not yet run this pass (see P1) |
| `npx tsc --noEmit` | passes via build step |

Green. No blocking defects.

## Doc-vs-implementation findings (pinned 3-tier review)

### Tier 1 — locally committed docs
- `README.md` (uncommitted edit): already corrected — drops non-existent
  `dashboard-data.ts`/`demo-factory`/`mappers`, notes `src/modules/**` =
  budgeting + home-base, flags `/settings/integrations` as not-yet-implemented,
  notes e2e lives in `tests/e2e/dogfood.spec.ts`. **Good — keep.**
- `docs/CODEBASE_INDEX.md` (uncommitted edit): already fixed sign-in/sign-up
  routes, added providers/shared-board/start-smart/modules, bento-grid, panels/.
  Minor leftover: lists `src/components/dashboard/bento-grid.tsx` (exists ✓) but
  still implies `budget-visual/bills/cash-flow-forecast/debt-payoff` as standalone
  top-level files that are actually under `panels/` (the panels/ line is correct;
  the 4 standalone lines were removed in the diff — verified clean).
- `docs/dev-tree-diagram.md` (uncommitted edit): only fixed the plans/.archive
  path. **STILL STALE** (see Tier 3).

### Tier 2 — source claims in tests/plans
- Archived plans (`docs/plans/.archive/*`) got a doc-reference-only edit; no code
  claim changes. Fine.
- `tests/e2e/dogfood.spec.ts` exists and matches README claim. ✓

### Tier 3 — actual code paths (the gaps)
1. **`docs/dev-tree-diagram.md` stale file references** (HIGH doc accuracy):
   - `src/hooks/use-daily-snapshot.ts` — does NOT exist. Actual: snapshot sync is
     in `src/lib/convex/sync-snapshots.ts` + `convex/snapshots.ts`.
   - `src/hooks/use-locale.ts` — does NOT exist. Actual locale handling is
     `src/i18n/*` + `src/components/onboarding/language-select-modal.tsx`.
   - `src/lib/db/local-db.ts` described as "migrations v1" — **ACCURATE**: file
     defines `DB_VERSION = 1` and opens the DB with it. No change needed.
   - `src/lib/news/rss-fetcher.ts` referenced (exists ✓) but the per-feed
     `RSS_FEEDS` constant edit task is fine.
2. **`docs/dev-tree-diagram.md` panel list** under-counts: actual `panels/` has
   budget-alerts, budget-ring, voice-expense-input, net-worth-* (5 files),
   emergency-fund(-skeleton), empty-state, subscriptions(-skeleton) — more than
   the 9 listed. `bento-grid.tsx` + `mobile-panel-tabs.tsx` not in diagram.
3. **`ARCHITECTURE.MD`** correctly describes root + nested subtree split. ✓ no change.

## Codebase health findings

### C1 — Next 16 `middleware.ts` deprecation (MEDIUM)
Build warns: `"middleware" file convention is deprecated. Please use "proxy" instead.`
Next 16.2.10 introduces `proxy.ts` (`isProxy = page === '/proxy'`). The root
`src/middleware.ts` uses `convexAuthNextjsMiddleware` default export.
- Convex auth `@convex-dev/auth@0.0.92` does NOT yet export a `proxy` variant
  (grep of `nextjs/server` found only `convexAuthNextjsMiddleware`).
- **Action:** do NOT blindly rename. Verify Convex auth supports a proxy export;
  if not, this is a no-op until the lib catches up. Track as known gap, keep
  `middleware.ts` (still works, warning only).

### C2 — "additional lockfiles" build warning (LOW)
`budgetbitch/package-lock.json` (nested prototype subtree) triggers Next's
multiple-lockfile warning. Benign. Options: (a) add `budgetbitch/` to a ignore in
next config, or (b) leave + document. Recommend document-only (don't touch the
prototype).

### C3 — 29 unused-var lint warnings (LOW, cleanup)
Full warning set captured via `npm run lint`. Most are harmless; a few are
genuinely dead symbols worth removing. **Leave** test mocks (`_args`, `alice`,
`QueryCtx` in convex test) and intentional prop pass-throughs.

Genuinely dead (safe to remove):
- `src/lib/news/rss-fetcher.ts:33` `isActionable` assigned, never used
- `src/lib/utils/budget-alerts.ts:12` `BudgetAlert` type import unused; `:32` `index`, `:39` `categoryLabel` unused
- `src/components/wizard/steps/step-savings-rate.tsx:14` `error` unused
- `src/modules/home-base/location-permission.ts:19` `locationGranted` unused
- `src/lib/utils/currency.ts` or date util: `addDays`/`endOfMonth` unused imports
- `src/lib/utils/thai-category-mapper.ts` `THAI_CATEGORY_ALIASES` unused
- unused icon imports (`Link`, `Menu`, `X`, `TrendingUp`, `AlertCircle`) in their components

Borderline / verify before touching:
- `dashboard-shell.tsx:64-67` `profile`, `commitment`, `sidebarOpen`, `setSidebarOpen`
  may be conditionally used — confirm not just shadowed before removing.

- **Action:** remove the clearly-dead symbols only; keep `_`-prefixed test mocks
  and any intentionally-forwarded props. Lint-gated (0 errors already).

### C4 — console/debugger in source (LOW)
18 hits across 6 files (sync-snapshots 10, dashboard-client 3, api/news 2, etc.).
Most are legitimate debug logging. Recommend: leave unless noisy; optional
guard behind `import.meta.env.DEV`.

## Prioritized task plan

### P0 — Finish + commit in-flight doc alignment
1. `docs/dev-tree-diagram.md`: remove `use-daily-snapshot.ts` + `use-locale.ts`
   references; replace with `src/lib/convex/sync-snapshots.ts` + `src/i18n/*`;
   add `bento-grid.tsx`, `mobile-panel-tabs.tsx`, and expand `panels/` list.
2. Verify `src/lib/db/local-db.ts` "migrations v1" claim; correct if inaccurate.
3. Stage + commit README.md, CODEBASE_INDEX.md, dev-tree-diagram.md, archived
   plan doc-reference edits as one docs-alignment commit.

### P1 — Verify backend tests
4. Run `npm run test:convex` (`convex/sharedBoards.test.ts`); record pass/fail.

### P2 — Low-risk code cleanups (optional, no behavior change)
5. Remove genuinely-dead unused vars (C3 list) — TDD not required, lint-gated.
6. Add a one-line note in ARCHITECTURE.MD / dev-tree-diagram about the
   `middleware.ts`→`proxy.ts` deprecation + that Convex auth lacks a proxy export
   yet (known gap, no code change).

### P3 — Enhancements (deferred, propose separately)
- Shared-board E2E coverage (currently unit-only).
- Net-worth panel consolidation (5 sub-files) if redundancy found.
- Voice-expense-input persistence hardening.

## Verification
- After P0: `npm run lint` (warnings count should drop), `npm run build` (docs
  don't affect build, but confirm no regression).
- After P2: `npm run lint` 0 errors; `npm run test` still 182 passing.
- Doc accuracy re-checked by grepping referenced paths against `find src convex`.

## Out of scope
- The `.worktrees/authjs-google-i18n-a11y/` experimental branch.
- The `budgetbitch/` nested prototype.
- New feature builds (P3 only proposed, not executed here).
