# Task 11 Report: Blob Validation + Finite Timestamps

## Status: DONE (inline after rate-limit)

## Changes
- `convex/boardMerge.ts`: new `validateBoardPayload` + `VALID_BOARD_STORES`
  (8 stores). `mergeRecords` drops invalid/poisoned entries defensively.
- `convex/sharedBoards.ts` (`pushBoard`) and
  `convex/accounts/accountBoardSync.ts` (`pushAccountBoard`): validate
  `incoming` before merge; throw/return error on unknown prefixes or
  non-finite/negative timestamps.
- `convex/boardMerge.test.ts`: tests for Infinity/NaN/garbage-key rejection
  and merge-level dropping.

## Verification
- `npm run test:convex -- convex/boardMerge.test.ts`: 5 passed
- `npm run typecheck`: clean
