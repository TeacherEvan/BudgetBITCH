# Phase 3: INVESTIGATION Report — Accounts & Syncing Features

This report provides the detailed reproduction, root cause analysis, and minimal fix designs for all findings identified in Phase 2.

---

## Issue F1: Mismatched Lookup Index in `listMyAccounts` for Joined Accounts
**Severity**: CRITICAL  
**File**: `convex/accounts/accountCrud.ts:161-167`  

### Reproduction
- **Test Case**: Call `createAccount` as User A (`accountId: A`, `boardId: B`). Invite User B. User B accepts invite. Call `listMyAccounts` as User B.
- **Observed Behavior**: `acc` in `listMyAccounts` returns `null` because `ctx.db.query("accounts").withIndex("by_accountId", q => q.eq("accountId", board.boardId))` queries `accountId = B`, but the account's `accountId` field is `A`. `inviteCode` is returned as `null`.
- **Expected Behavior**: `accountId` lookup uses `board.accountId` (`A`), correctly locating the `accounts` document and returning `inviteCode: acc.inviteCode`.

### Root Cause
In `createAccount`, `accountId` and `boardId` are generated as two distinct UUIDs:
```typescript
const accountId = crypto.randomUUID(); // e.g. "acc-123"
const boardId = crypto.randomUUID();   // e.g. "board-456"
```
The `accountBoards` table document contains `{ boardId: "board-456", accountId: "acc-123", ... }`.
In `listMyAccounts`, for joined boards (members), line 161 queried:
```typescript
const acc = await ctx.db
  .query("accounts")
  .withIndex("by_accountId", (q) =>
    q.eq("accountId", board.boardId), // <-- Bug: board.boardId is "board-456"
  )
  .unique();
```

### Fix Design
Change `board.boardId` to `board.accountId`:
```typescript
const acc = await ctx.db
  .query("accounts")
  .withIndex("by_accountId", (q) =>
    q.eq("accountId", board.accountId),
  )
  .unique();
```

---

## Issue F2: Race Condition in Push Timer on Account Switch
**Severity**: HIGH  
**File**: `src/hooks/use-account-sync.ts:195-203, 219-235`  

### Reproduction
1. User edits an item on Account 1. `schedulePush()` is called, setting `pushTimer.current` for 800ms.
2. User immediately switches to Account 2. `onChanged` handles `source === "switch"` and calls `resolveActiveBoard()`, which updates `boardIdRef.current` to Account 2's boardId.
3. The 800ms timer fires. `doPush()` executes: it reads `boardIdRef.current` (Account 2's boardId) and serializes IndexedDB (which now contains Account 2's data or transient state).
4. Edits intended for Account 1 are lost or pushed targeting Account 2's board ID.

### Root Cause
`pushTimer.current` is not cancelled when switching accounts, nor when `boardId` changes.

### Fix Design
1. In `useAccountSync`, clear `pushTimer.current` and set `pendingRef.current = false` when `source === "switch"` is received in `onChanged` or when `boardId` changes:
```typescript
useEffect(() => {
  lastAppliedAt.current = 0;
  if (pushTimer.current) {
    clearTimeout(pushTimer.current);
    pushTimer.current = null;
  }
  pendingRef.current = false;
  setPushPending(false);
}, [boardId]);
```
2. In `onChanged`:
```typescript
if (customEvent.detail?.source === "switch") {
  if (pushTimer.current) {
    clearTimeout(pushTimer.current);
    pushTimer.current = null;
  }
  pendingRef.current = false;
  setPushPending(false);
  lastAppliedAt.current = 0;
  void resolveActiveBoard();
  return;
}
```

---

## Issue F3: Pull Guard Blocks Merged Remote Updates After Push
**Severity**: HIGH  
**File**: `src/hooks/use-account-sync.ts:173-174, 262`  

### Reproduction
1. User A pushes local edits to shared board at `updatedAt = 1000`.
2. Convex backend `pushAccountBoard` merges User A's data with existing server data (including User B's edits at `updatedAt = 900`). `newUpdatedAt` is set to `1001`. Server returns `{ updatedAt: 1001 }`.
3. Client A receives push response and sets `lastAppliedAt.current = 1001`.
4. Reactive subscription `getAccountBoard` returns updated board with `updatedAt: 1001` containing User B's merged edits.
5. Client A's pull effect checks `if (remote.updatedAt <= lastAppliedAt.current) return;`.
6. Since `1001 <= 1001` is true, Client A skips `applyRemoteBoard()`. User A does not receive User B's edits locally until refreshing.

### Root Cause
Setting `lastAppliedAt.current = res.updatedAt` inside `doPush` tricks the reactive pull effect into believing that the client has ALREADY applied the full server board snapshot at timestamp `res.updatedAt`, when in reality the client only has its local pre-push state.

### Fix Design
In `doPush`, do not set `lastAppliedAt.current` to `res.updatedAt` directly if we want the reactive query to deliver the merged board to `applyRemoteBoard`. Instead, let the reactive `useEffect([boardId, getBoard])` receive the updated board and apply any new/merged remote records via `applyRemoteBoard(remote.data)`.
`applyRemoteBoard` already checks per-record local write timestamps (`item.updatedAt <= localTs`) so applying the merged remote board will NOT overwrite any newer local edits!

---

## Issue F4: Inconsistent Error Throwing (`new Error` vs `new ConvexError`)
**Severity**: MEDIUM  
**Files**: `convex/accounts/accountCrud.ts` and `convex/accounts/accountInvites.ts`  

### Reproduction
- Call `renameAccount` as non-owner. Catch error on client.
- Observed: Error is `[ConvexError: Server Error]` (message details masked by Convex).
- Expected: Error is `ConvexError: Only the owner can rename`.

### Root Cause
`renameAccount`, `rotateInviteCode`, `deleteAccount`, `inviteByCode` throw standard JS `new Error(...)` instead of `new ConvexError(...)`.

### Fix Design
Replace all instances of `throw new Error(...)` with `throw new ConvexError(...)` in `convex/accounts/accountCrud.ts` and `convex/accounts/accountInvites.ts`.

---

## Issue F5: Deduplication of `accountBoards.members` Array
**Severity**: MEDIUM  
**File**: `convex/accounts/accountInvites.ts:256-258`  

### Reproduction
Call `redeemInviteToken` for User B, then call `acceptInvite` for User B on the same board.
Observed: `board.members` contains `[UserA, UserB, UserB]`.

### Root Cause
`acceptInvite` appends `userId` to `board.members` without checking for existence or deduplicating.

### Fix Design
Use set deduplication when updating `board.members`:
```typescript
await ctx.db.patch(board._id, {
  members: Array.from(new Set([...board.members, userId])),
});
```

---
*Phase 3 Complete — Ready for Phase 4 (Fix & Validation)*
