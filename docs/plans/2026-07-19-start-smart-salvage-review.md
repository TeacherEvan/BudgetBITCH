# Review Findings + Implementation Plan — 2026-07-19
## Scope: uncommitted in-flight work in `main` working tree (Start Smart / Home Base / daily-cash modules + fixed-screen shell)

## A. Review Findings (evidence-backed)

### A1. Working tree contains orphaned salvage with NO git history
`git rev-list --all` returns **0 commits** for every untracked module. They exist nowhere in any branch, stash, or reflog. They were carried over by a directory copy during the 2026-06 "major restructure" (commit c76f491, now an ancestor of main) and never re-committed.
- `src/modules/budgeting/daily-cash-snapshot.ts` (+ test) — **49 LOC, tests PASS, quality good**
- `src/modules/budgeting/subscription-trim-hints.ts` (+ test) — **64 LOC, tests PASS, good**
- `src/modules/home-base/home-base-schema.ts`, `home-base-store.ts` (+ test), `location-permission.ts` (+ test), `reverse-geocode-label.ts` (+ test) — **tests PASS, well-built (zod-validated, storage-event sync, SSR-safe)**
- `src/components/start-smart/panels/home-base-panel.tsx` — presentational panel, no test, **unwired**
- `src/components/mobile/fixed-screen-shell.tsx` (+ test) — tests PASS, **unwired**

### A2. One broken orphan: `src/modules/dashboard/dashboard-data.test.ts` — DELETE
- Test **FAILS**: `Failed to resolve import "./dashboard-data"` — the implementation was never carried over (exists only in the abandoned `feature/authjs-google-i18n-a11y` worktree, which is a **different pre-Convex codebase** using Clerk + Prisma + DATABASE_URL).
- It mocks `@/lib/auth/clerk-config` — **Clerk no longer exists anywhere in `src/`** (grep confirms only this test references clerk).
- It is the ONLY failing test in the tree and will turn CI red the moment it is committed.
- **Verdict: delete. Do not port.** The old `dashboard-data.ts` belongs to a dead stack (Clerk/Prisma); reviving it contradicts the Convex migration.

### A3. Nothing is wired in — zero production call sites
Grep for `daily-cash`, `subscription-trim`, `HomeBasePanel`, `FixedScreenShell` across `src/app`, `src/components`, `src/hooks`: **only self-references**. No page imports them. `/start-smart` route does not exist on main (only `(app)/dashboard` and `(app)/wizard`). The `start-smart-blueprint` branches are pre-restructure relics.

### A4. Alignment with task.md design brief — GOOD, worth keeping
The brief demands "fast financial orientation… compression… lead with the user's situation, pressure points, and next action." The salvaged modules are exactly that:
- `daily-cash-snapshot` = orientation primitive (money left, daily pace, at-risk status)
- `subscription-trim-hints` = next-action primitive
- `fixed-screen-shell` = compression primitive (100dvh, no page scroll)
- `home-base/*` = privacy-first location (label-only, no GPS stored) — matches "privacy-forward"
**These are keepers. The failure is process (never committed), not quality.**

### A5. Repo hygiene debts (secondary)
- 3 stale stashes (`copilot-temp-*`, `temp-main-dirty-*`) — review then drop.
- Abandoned worktree `.worktrees/authjs-google-i18n-a11y` (pre-Convex Clerk stack) with 5 modified files — dead; remove worktree.
- Dead remote branches: `feature/start-smart-blueprint`, `task/start-smart-low-stimulation-task3`, `copilot/vscode-*` — prune after confirming no salvage remains.
- `.vercel/` subfolder + stale memory notes about a `budgetbitch/` subfolder scaffold — confirmed stale; ignore.

### A6. Risk assessment of committing the keepers
`npm run test` gates CI. If committed as-is, `dashboard-data.test.ts` breaks CI. All other untracked tests pass. No conflicts with committed code (no shared imports). `main` is at parity with `origin/main` (0/0), so a clean feature branch is trivial.

---

## B. Implementation Plan

### Task 1 — Quarantine the broken orphan (2 min, no TDD needed — deletion)
- Delete `src/modules/dashboard/dashboard-data.test.ts`.
- Verify: `npx vitest run src/modules` → all pass, zero failures.
- Commit on branch `chore/start-smart-salvage`: `test: remove orphaned Clerk-era dashboard-data test (impl never migrated to Convex)`.

### Task 2 — Commit the passing salvage in logical units (3 commits, TDD already satisfied — tests exist and pass)
Branch: `chore/start-smart-salvage` off `main`.
- **2a** `src/modules/budgeting/*` → `feat(budgeting): daily cash snapshot + subscription trim hints (salvaged, tested)`
- **2b** `src/modules/home-base/*` → `feat(home-base): privacy-first area label store, geolocation permission + reverse geocode (salvaged, tested)`
- **2c** `src/components/mobile/fixed-screen-shell.*` + `src/components/start-smart/panels/home-base-panel.tsx` → `feat(ui): fixed-screen shell + home base panel (salvaged)`
- Verify after each: `npx vitest run <paths>` green; final: `npm run test` + `npm run lint` green.
- Each commit message ends: `Unfinished: no production call site yet — wired in later plan.`

### Task 3 — Mark integration seams with `Unfinished` notes (doc-only, 5 min)
- Append to this file's Section C (below) the integration backlog.
- No stub code, no dead imports — components stay unmounted until a designed plan wires them (per YAGNI + the Hard Gate: wiring is a *new feature* needing its own brainstorm → design → plan).

### Task 4 — Repo hygiene (non-destructive first, confirm before dropping)
- `git worktree remove .worktrees/authjs-google-i18n-a11y --force` (confirm: stack is dead, Convex replaced Clerk).
- Inspect 3 stashes (`git stash show -p stash@{N}`); drop only if content is confirmed dead.
- Prune dead remote branches after confirming no unique commits: `git log main..origin/feature/start-smart-blueprint` was already empty (0 ahead) — safe to delete remote.

### Task 5 — Verify + finish branch (Phase 5)
- `npm run test && npm run lint && npm run build` all green.
- Present options: merge locally to main / push + PR. Recommend: **push + PR** (Vercel auto-deploys main; PR gives preview + CI gate evidence).

---

## C. Integration Backlog (NOT in this plan — each needs its own design cycle)
1. **Daily Cash Snapshot card** on `(app)/dashboard`: feed from `use-local-db` (income/bills already exist there per grep) → `buildDailyCashSnapshot` + `buildSubscriptionTrimHints`. Design question: placement per task.md "lead with orientation".
2. **Home Base settings section**: mount `HomeBasePanel` in settings; wire `saveHomeBase`/`useSyncExternalStore(subscribeToHomeBase, getHomeBaseSnapshot, getHomeBaseServerSnapshot)`. Reverse-geocode endpoint needs a chosen provider (privacy-first: label-only, no coords stored — store already enforces this).
3. **FixedScreenShell adoption**: wrap mobile dashboard panels (extends the shipped mobile bottom-tabs work, commits fba2b6b/61667c0).
4. `/start-smart` route: old blueprint branches are dead; if revived, design fresh against current Convex stack + task.md brief.

## Verification record
- 2026-07-19 `npx vitest run src/modules src/components/mobile/fixed-screen-shell.test.tsx`: 6/7 files, 23 tests PASS; 1 FAIL = dashboard-data.test.ts (orphan, planned for deletion in Task 1).
- `git rev-list --all --count` = 0 for all untracked modules (true orphans).
- grep: no Clerk in src except the orphan test; no production imports of any salvaged module.
