# God-Module Audit — Resolution Note

**Original branch:** `refactor/budgetboss-god-module-audit`
**Audit date:** 2026-08-18
**Final status (verified):** READY WITH WARNINGS

## What was audited
G&L Auditor V2 god-module audit of the Budget Boss codebase (decomposition of
oversized modules, dead-dep pruning, sync-queue compaction, Convex receipts
barrel). Verified empirically (not by self-report): lint / typecheck / build /
Convex backend all green; full unit suite showed 2 failing specs that were
isolated to uncommitted WIP, not to the committed refactor.

## Resolution (2026-08-18, surgical-implementation close-out)
The two unrelated WIP changesets that remained on the branch were split into
standalone PRs and committed on clean branches off `origin/main`:

- **PR `fix/accsync-flushing-ref`** — `use-account-sync.ts` + `.test.tsx`:
  moved the module-level `isFlushingBoard` singleton into a `useRef` to stop
  Vitest worker poisoning (root cause of the accsync CI flake). Committed
  `23e1eac`.
- **PR `feat/dashboard-critical-expenses-lazy`** — `critical-expenses-modal.tsx`
  + `dashboard-shell.tsx` (lazy-load via `next/dynamic`), `spending-panel.tsx`,
  `wizard-shell.tsx`, plus the required companion test fix in
  `dashboard-shell.test.tsx` (await code-split modal via `findByRole`).
  Committed `ac1fdc2`.

Both PRs pass typecheck / lint / their isolated specs.

## Artifacts archived
- `docs/.scratch-audit/2026-08-18-god-module-audit-verify-{DEBRIEF,CODEBASE-STATE,TRACEABILITY}.md`
- `docs/.scratch-audit/2026-08-18-god-module-audit-verify-runtime.json`
- `docs/.scratch-audit/2026-08-18-accsync-flake-debrief.md` (prior flake investigation)
- Root `HERMES_PLAN.ai.json` / `HERMES_PLAN.html` — PROPOSED plan, no approval
  ticks; left as authoritative evidence of "no approved scope to implement."
- `docs/AUDIT.html`, `docs/AUDIT ERROR.log`, `docs/GLE_MERGER_PLAN.md`,
  `docs/surgical-pruning-0818-BudgetBITCH.html` — prior-run scratch, not source.

## Open items
- `HERMES_PLAN.ai.json` workstreams (OCR pipeline, reliability hardening,
  daily-figure/line-bot, i18n/UX) remain UNAPPROVED/proposed. Implement only
  after explicit user approval on the correct target branch.
- `docs/RELIABILITY_HARDENING_PLAN.md` still references `fix/ci-lockfile-sync`
  (a separate branch) — the accsync half landed via `fix/accsync-flushing-ref`.
