# Task 5 Report: Invite Edge Cases & Consent Matrix Fixes

## Status: DONE

## Summary
Fixed invite edge cases in `accountInvites.ts` and consent matrix issues in `pendingDeletes.ts` as identified in the Budget Boss audit. All tests pass and all CI quality gates pass.

## Changes Made

### 1. `convex/accounts/accountInvites.ts`

#### `declineInvite` mutation
- **Added status check**: `if (invite.status !== 'pending') throw new ConvexError("Invite already handled");`
- Prevents declining an invite that has already been accepted or declined

#### `acceptInvite` mutation
- **Fixed concurrent race condition**: Changed from check-then-insert to insert-then-recheck pattern
- Now inserts the `boardMembers` row first, then re-checks member count inside the transaction
- If over cap (MAX_MEMBERS = 8), rolls back by deleting the just-inserted row and throws error
- This ensures exactly MAX_MEMBERS rows can be created even under concurrent acceptance

### 2. `convex/pendingDeletes.ts`

#### `approveItemDelete` mutation
- **Restricted approval to only the OTHER member**: Added check using `otherMemberId(ref, pending.requestedBy)`
- Only the specific other board member (the one who must approve per two-party consent) can approve
- For 2-person boards, this is exactly the other member; for multi-member account boards, it's the first other member
- Throws "Only the other board member can approve this request" if unauthorized user tries to approve

#### `rejectItemDelete` mutation
- **Restricted rejection to requester or other member**: Added explicit check
- Only the requester (cancelling their own request) OR the other member (rejecting) can reject
- Throws "Only the requester or the other board member can reject this request" if unauthorized

### 3. `convex/accountInvites.test.ts` (NEW FILE)
Created comprehensive tests verifying:
- `declineInvite` throws after accept ("Invite already handled")
- Concurrent accepts fill exactly MAX_MEMBERS rows (8)
- Over-cap accept throws and rolls back ("at most 8 members")
- Third member cannot approve delete request ("Only the other board member can approve")
- Requester can cancel their own pending request via rejectItemDelete

## Test Results

### Convex Backend Tests
```
Test Files  34 passed (34)
Tests  212 passed (212)
```

### New Tests (accountInvites.test.ts)
```
Test Files  1 passed (1)
Tests  5 passed (5)
```

### Existing Tests (accounts.test.ts, pendingDeletes.test.ts)
- All 24 account tests pass
- All 5 pendingDeletes tests pass

### Full Quality Gates
- ✅ Lint (ESLint)
- ✅ TypeCheck (tsc --noEmit)
- ✅ IndexedDB Schema Guard
- ✅ CSP / Source-host Drift Guard
- ✅ Unit & Component Tests (744 tests pass)
- ✅ Convex Backend Tests (212 tests pass)
- ✅ Production Build (Next.js)

## Commits
```
fix: add status check to declineInvite to prevent double-handling
fix: fix acceptInvite concurrent race with insert-then-recheck pattern
fix: restrict approveItemDelete to only the other board member
fix: restrict rejectItemDelete to requester or other member only
test: add comprehensive tests for invite edge cases and consent matrix
```

## Observations
- The `acceptInvite` fix uses the "patch-then-check" pattern as specified: insert boardMember row, then re-check count, roll back by deleting the inserted row if over cap
- The `pendingDeletes` consent matrix now correctly enforces two-party consent for both approve and reject actions
- For accountBoards with >2 members, `otherMemberId` returns the first other member, which is the deterministic "approver" per the existing design
- All existing functionality preserved - no breaking changes to happy paths

## Verification Commands Run
```bash
npm run test:convex -- convex/accountInvites.test.ts convex/pendingDeletes.test.ts  # Pass
npm run lint  # Pass
npm run typecheck  # Pass
npm test  # Pass (744 tests)
npm run build  # Pass
npm run ci  # Pass (all 8 local gates)
```