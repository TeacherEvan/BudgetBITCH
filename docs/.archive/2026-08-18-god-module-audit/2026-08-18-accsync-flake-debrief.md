# Re-diagnosis — use-account-sync.test.tsx Parallel Flake

**Date:** 2026-08-18
**Branch:** `refactor/budgetboss-god-module-audit` (BudgetBITCH)
**Scope:** verify the accsync worker-state flake + correct the prior (wrong) root-cause theory.

## Symptom
`src/hooks/use-account-sync.test.tsx` failed intermittently in the FULL parallel suite
but passed in isolation. The prior agent (Gemini/antigravity, separate session) edited
`use-account-sync.ts` + `.test.tsx` and then claimed the `isFlushingBoardRef` fix
"wasn't the root cause," speculating that `fake-indexeddb/auto` shares a global IDB across
test files and leaks state between `use-shared-board.test.tsx` and `use-account-sync.test.tsx`.

## Verdict on that theory: WRONG
- `vitest.config.ts` uses `pool: "forks"` with `maxWorkers: 4`. Under `forks`, each test
  FILE runs in a SEPARATE process. Module-level singletons (`isFlushingBoard`,
  `dbInstance`, `myAccountsResult`) CANNOT cross file boundaries. The cross-file
  "fake-indexeddb shared global" contamination theory is impossible under this pool.
- `fake-indexeddb/auto` is imported per test file and installs its own `indexedDB` global
  within that file's process; it does not persist shared state to sibling files.

## The real fix (on disk, valid)
The genuine leak was INTRA-FILE: `let isFlushingBoard = false;` was a module-level
singleton inside `use-account-sync.ts`. In a `forks` run, all 10 tests of the file share
one module instance within that file's process. If a test left `isFlushingBoard = true`
(via an interrupted/async flush that didn't hit the `finally` reset, or a prior test's
in-flight flush still settling), the next test's `flushQueue()` took the early-return
guard and `pushBoard` was never called → `waitFor(() => expect(pushBoard).toHaveBeenCalledTimes(1))`
timed out. Isolation passed because the module was freshly imported with the flag `false`.

Fix (already applied in `ca15bcd`, confirmed on disk): moved the guard into the hook as
`const isFlushingBoardRef = useRef(false);`. `beforeEach` calls `cleanup()` which unmounts
the probe, so `isFlushingBoardRef` resets to `false` every test. Runtime single-flight
semantics are preserved (one hook instance per mounted component).

## Empirical proof (this run)
- Isolated file: 10/10 PASS — run 12 consecutive times, all green.
- Full parallel suite (WITH your 4-file confetti/dashboard WIP present):
  - Run 1: 124 files / 684 passed / 0 failed / 3 skipped
  - Run 2: 124 files / 684 passed / 0 failed / 3 skipped
  - Run 3: 124 files / 684 passed / 0 failed / 3 skipped
  - `FULL_EXIT=0` on all three.
- Lint / typecheck: 0 errors.

## Note on the earlier "dashboard-shell" failure
Turn 1 of the god-module audit showed `dashboard-shell.test.tsx` red WITH the WIP present
and green WITHOUT it. Three consecutive full runs now show it GREEN with the WIP present —
i.e. that earlier failure was itself a non-deterministic parallel flake (timing/ordering),
NOT a stable WIP regression. The WIP is not the proven cause; it was a coincidental
correlate in one run. Recommend a dedicated flake hunt on `dashboard-shell.test.tsx`
(scroll/overflow assertion) if it recurs, but do not assume the WIP is at fault.

## Conclusion
- The `isFlushingBoardRef` fix is CORRECT and resolves the accsync flake.
- The prior agent's "cross-file fake-indexeddb contamination" diagnosis is INVALID under
  the `forks` pool and must not be acted on (no fake-indexeddb reset/harness changes needed).
- Branch is currently FULLY GREEN. No further source changes required for this flake.

## Recommendation
Leave `use-account-sync.ts`/`.test.tsx` as-is. Do NOT add a fake-indexeddb teardown hack —
it addresses a non-existent problem and would be dead/confusing code.
