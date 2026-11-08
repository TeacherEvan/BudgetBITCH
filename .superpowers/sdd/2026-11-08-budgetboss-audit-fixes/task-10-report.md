# Task 10 Report: Share-Code Uniqueness + Split-Brain Profile

## Status: DONE (inline after rate-limit)

## Changes
- `convex/sharedBoards.ts`: deleted duplicate `ensureProfileDoc`/
  `generateShareCode`, now imports the single factory from
  `convex/accounts/helpers.ts` (accounts shape wins). `resolveShareCode`
  and `linkByCode` use `.take(2)` and fail closed with "Share code
  ambiguous — contact support" on duplicates instead of `.unique()`'s
  opaque Server Error.
- `convex/accounts/accountInvites.ts`: `inviteByCode` same duplicate-tolerant
  pattern.
- `convex/accounts/types.ts`: added optional `memberDisplayNames` to
  AccountSummary (Task 8 fix, typecheck surfaced it).
- `convex/accounts.test.ts`: duplicate-code safety test for both
  resolveShareCode and inviteByCode.

## Verification
- `npm run test:convex -- convex/accounts.test.ts`: 26 passed
- `npm run typecheck`: clean (two pre-existing type issues surfaced and
  fixed: continuation return type, snapshots userId Id type)
