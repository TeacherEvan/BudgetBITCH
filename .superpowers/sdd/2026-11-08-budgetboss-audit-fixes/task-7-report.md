# Task 7 Report: Atomic Timestamp Writes + Restore Preservation

## Status: DONE (inline after rate-limit)

## Changes
- `src/lib/db/local-db.ts`: new `putWithStamp` / `putManyWithStamp` — ONE
  cross-store transaction `[store, 'localWrites']`. All local-db helpers
  (wizardProfile, budgets, bills, savingsGoals, debts) migrated.
- `src/lib/db/stores/expenses-store.ts`: addExpense/update/delete + bulk
  (previously 2 tx for bulk) migrated; bulk BOARD_CHANGED now emits once.
- `src/lib/convex/sync-snapshots.ts`: restoreFromCloudSnapshot writes
  localWrites stamps IN the same transaction as the clear+put loop, and
  preserves per-record `updatedAt` when present as `max(now, payloadTs)`
  instead of flattening to `now`.
- Tests: `local-db.test.tsx` — txCount===1 counting-stub for addExpense
  (guards regression); `sync-snapshots-restore.test.ts` — restore
  preserves newer remote updatedAt. Fixed `expenses-store.test.ts` mock
  to provide putWithStamp/putManyWithStamp.

## Verification
- `npm test -- src/lib/db`: 87 passed; `src/lib/convex`: 24 passed
- `npm run typecheck`: clean
