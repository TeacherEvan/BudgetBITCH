# Task 3 Report: Snapshot Date Idempotency Bug Fix

## Status: DONE

## Summary
Fixed the snapshot date idempotency bug in `convex/snapshots.ts` where parallel upserts could create two rows for the same day.

## Changes Made

### 1. `convex/snapshots.ts` - Fixed `upsertDailySnapshot` mutation
**Before:** Read-then-write pattern (vulnerable to race conditions)
- Query for existing snapshot
- If exists: patch
- If not: insert

**After:** Insert-then-read pattern (idempotent, like `saveReceiptIdempotent`)
- Insert new snapshot
- Query `by_user_and_date` index ordered by `_creationTime` asc to find the oldest (winner)
- If our insert is the winner: patch with latest data, return `created: true`
- If another insert won: delete our insert, patch the winner with latest data, return `updated: true`

This pattern uses the existing `by_user_and_date` index (which includes `_creationTime` as the last column) as the "claim" for the daily slot. No schema changes required.

### 2. `convex/snapshots.test.ts` - Added regression tests
- Test 1: Fires two concurrent `upsertDailySnapshot` calls with same `userId` and `date`, asserts exactly one snapshot is created, one returns `created=true`, one returns `updated=true`
- Test 2: Sequential upserts - first returns `created=true`, second returns `updated=true`, only one snapshot exists

## Test Results

### Convex Tests (207 tests)
- All 207 tests pass ✅
- New tests: 2 passing ✅

### Unit Tests (739 tests)
- All 739 tests pass ✅

### Lint & Typecheck
- `npm run lint`: Pass ✅
- `npm run typecheck`: Pass ✅

### Build
- `npm run build`: Pass ✅

### Other Checks
- `npm run check:idb`: Pass ✅
- `npm run check:csp`: Pass ✅
- `npm run check:comments`: Pass ✅

## Commits Made
- `9b040f0` - fix: make upsertDailySnapshot idempotent with insert-then-read pattern

## Pattern Reference
The fix follows the same pattern used in `convex/receipts/draftCrud.ts` (`saveReceiptIdempotent` mutation), which was already in the codebase for handling idempotent receipt ingestion from the LINE bot.

## Concerns/Observations
- The test uses `convex-test` which may not perfectly simulate true production concurrency, but the pattern is proven in production by the `saveReceiptIdempotent` mutation
- No schema/index changes were needed - leveraged existing `by_user_and_date` index
- The fix ensures the winner (first insert) always gets updated with the latest data from whichever call won
