# Task 9 Report: Purge Scheduler Chunked Deletion

## Status: DONE (inline after rate-limit)

## Changes
- `convex/purge.ts`: `purgeMyAccountData` now offloads the profile stage via
  `ctx.scheduler.runAfter(0, internal.purge.purgeProfileFinal, ...)` once
  cumulative deletes exceed one 500-row chunk, returning
  `{success, counts, continuation:true}`. Profile remains the last stage.
  Small accounts stay fully synchronous — all 14 existing purge tests pass.
- `convex/snapshots.ts`: `deleteAllUserSnapshots` breaks after one 500-row
  chunk and schedules `deleteSnapshotsChunk` (which itself re-schedules while
  rows remain).
- `convex/crons.ts`: unchanged (existing cron pattern retained).
- `convex/purge.test.ts`: new test — 600 synthetic snapshots assert first
  chunk deletes ≥500 and reports continuation.

## Verification
- `npm run test:convex -- convex/purge.test.ts convex/snapshots.test.ts`: pass
