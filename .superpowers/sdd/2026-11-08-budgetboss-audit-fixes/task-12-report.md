# Task 12 Report: use-local-db Error State + Stale Response Guard

## Status: DONE (inline after rate-limit)

## Changes
- `src/hooks/use-local-db.ts`: all 12 hooks — replaced mounted-flag with a
  shared `useRequestSeq()` counter (stale responses dropped by comparing
  request seq), surfaced `{error}` on failure instead of fake
  `loading:false` on stale data. No hook signature changes (only an added
  `error` field on returns).
- `src/hooks/use-local-db.test.ts`: tests — failed load exposes error;
  slow first load can't overwrite a fresher event load.

## Verification
- `npm test -- src/hooks/use-local-db.test.ts`: 14 passed
- `npm run typecheck`: clean (signatures preserved)
