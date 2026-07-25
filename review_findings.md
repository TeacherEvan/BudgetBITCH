# Phase 2: REVIEW Findings Report — Accounts & Syncing Features

## Summary of Findings

| ID | File / Component | Severity | Description |
|---|---|---|---|
| F1 | `convex/accounts/accountCrud.ts` | **CRITICAL** | Mismatched lookup index in `listMyAccounts` for joined members (`accountId` vs `boardId`). Query uses `board.boardId` instead of `board.accountId`, returning `null` for `acc` and omitting `inviteCode`. |
| F2 | `src/hooks/use-account-sync.ts` | **HIGH** | Race condition in push timer when switching accounts. Pending debounced push timer is not cleared on account switch, causing edits from Account A to potentially push to Account B's board ID. |
| F3 | `src/hooks/use-account-sync.ts` | **HIGH** | `lastAppliedAt` guard blocks reactive pull of merged remote data after push. Client sets `lastAppliedAt = res.updatedAt`, causing the subsequent reactive `getAccountBoard` pull containing partner edits to be ignored. |
| F4 | `convex/accounts/accountCrud.ts` & `accountInvites.ts` | **MEDIUM** | Inconsistent error throwing (`new Error` vs `new ConvexError`). Standard JS `Error` is masked as an unhelpful `Server Error` by Convex, preventing clean client-side error handling in UI. |
| F5 | `convex/accounts/accountInvites.ts` | **MEDIUM** | Potential duplicate user IDs in `accountBoards.members` array during `acceptInvite` if not deduplicated. |

---

## Detailed Findings & Line References

### Finding F1: Mismatched Lookup Index in `listMyAccounts`
- **File**: `convex/accounts/accountCrud.ts:161-167`
- **Severity**: CRITICAL
- **Code Reference**:
  ```typescript
  const acc = await ctx.db
    .query("accounts")
    .withIndex("by_accountId", (q) =>
      q.eq("accountId", board.boardId), // <-- BUG: board.boardId is the board ID, not the account ID!
    )
    .unique();
  ```
- **Analysis**:
  In `createAccount`, `accountId` and `boardId` are distinct UUIDs (`accountId` = account record key, `boardId` = board record key). In `accountBoards`, the document stores `{ boardId: B, accountId: A }`. When `listMyAccounts` looks up joined accounts for a member, it iterates through `accountBoards` and queries `accounts` by `accountId = board.boardId`. Since `board.boardId` is B, `accounts` query by `accountId` returns `null`.
- **Impact**: `acc` is `null`, causing `acc?.inviteCode ?? null` to evaluate to `null` for joined members instead of showing the account's invite code or resolving metadata.
- **Recommended Refactor**: Change `board.boardId` to `board.accountId`.

---

### Finding F2: Race Condition in Push Timer on Account Switch
- **File**: `src/hooks/use-account-sync.ts:195-203, 219-235`
- **Severity**: HIGH
- **Code Reference**:
  ```typescript
  const schedulePush = () => {
    pendingRef.current = true;
    setPushPending(true);

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      void doPush();
    }, PUSH_DEBOUNCE_MS);
  };
  ```
- **Analysis**:
  When a user edits an account board, `schedulePush()` starts an 800ms timer. If the user switches accounts during this window, `resolveActiveBoard()` updates `boardIdRef.current` to the new account's `boardId`. However, `pushTimer.current` is not cancelled on switch! When the 800ms timer expires, `doPush()` executes using `boardIdRef.current` (the NEW account boardId) and serializes the local IndexedDB state, leading to cross-account data push contamination.
- **Impact**: Edits made right before switching accounts can overwrite or leak into the target account board on Convex.
- **Recommended Refactor**:
  1. Clear `pushTimer.current` and reset `pendingRef.current` whenever `boardId` changes or when a `source: "switch"` event occurs.
  2. Capture `bid` at the moment `schedulePush()` is called, or ensure pending pushes are flushed for the outgoing board before completing the switch.

---

### Finding F3: Pull Guard Blocks Merged Remote Updates After Push
- **File**: `src/hooks/use-account-sync.ts:173-174, 262`
- **Severity**: HIGH
- **Code Reference**:
  ```typescript
  // In doPush():
  const res = (await pushBoard({ boardId: bid, data: data as never, updatedAt })) as { updatedAt?: number } | undefined;
  lastAppliedAt.current = res?.updatedAt ?? updatedAt;

  // In pull effect:
  if (remote.updatedAt <= lastAppliedAt.current) return; // <-- Blocks applying merged board!
  ```
- **Analysis**:
  `pushAccountBoard` on the server performs a Last-Write-Wins merge between the incoming records and existing server records (which may include recent edits from other board members). When `pushBoard` succeeds, the client sets `lastAppliedAt.current = res.updatedAt`. Immediately afterward, the reactive `useQuery(api.accounts.getAccountBoard)` subscription fires with the updated server board containing merged records from partner devices. However, the pull effect sees `remote.updatedAt <= lastAppliedAt.current` and aborts without calling `applyRemoteBoard()`.
- **Impact**: Device A does not receive Device B's merged edits until the page is reloaded or the board is re-switched.
- **Recommended Refactor**:
  Allow `applyRemoteBoard` to process remote data updates when the remote board data contains merged keys that local storage does not have, or handle push completion timestamps without prematurely blocking reactive query updates.

---

### Finding F4: Inconsistent Error Handling (`new Error` vs `new ConvexError`)
- **Files**: `convex/accounts/accountCrud.ts` and `convex/accounts/accountInvites.ts`
- **Severity**: MEDIUM
- **Code Reference**:
  - `accountCrud.ts:253` — `throw new Error("Account not found");`
  - `accountCrud.ts:254` — `throw new Error("Only the owner can rename");`
  - `accountCrud.ts:282` — `throw new Error("Account not found");`
  - `accountCrud.ts:283` — `throw new Error("Only the owner can rotate");`
  - `accountCrud.ts:315` — `throw new Error("Account not found");`
  - `accountCrud.ts:316` — `throw new Error("Only the owner can delete");`
  - `accountInvites.ts:25` — `throw new Error("Account not found");`
  - `accountInvites.ts:26` — `throw new Error("Only the owner can invite");`
- **Analysis**:
  Convex automatically masks standard JS `Error` objects as `Server Error` when sent to client applications. Throwing `ConvexError` ensures that custom error messages are safely sent to the client and accessible via `err.message` / `err.data`.
- **Impact**: UI receives generic `Server Error` messages instead of clear feedback (e.g. "Only the owner can rename").
- **Recommended Refactor**: Replace all `throw new Error(...)` with `throw new ConvexError(...)` in Convex functions.

---

### Finding F5: Deduplication of `accountBoards.members` Array
- **File**: `convex/accounts/accountInvites.ts:256-258`
- **Severity**: MEDIUM
- **Code Reference**:
  ```typescript
  await ctx.db.patch(board._id, {
    members: [...board.members, userId],
  });
  ```
- **Analysis**:
  In `acceptInvite`, `userId` is appended to `board.members`. If `userId` was already present in `board.members` (e.g. from a prior `redeemInviteToken` call), `board.members` will accumulate duplicate user IDs.
- **Impact**: Array bloated with duplicate user IDs, affecting `memberCount` calculations.
- **Recommended Refactor**: Use `Array.from(new Set([...board.members, userId]))`.

---

## Architectural Alignment Check
- **Convex AI Guidelines**: Checked against `convex/_generated/ai/guidelines.md`. Functions use proper `query`/`mutation`/`action` exports with `v` validators. `getAuthUserId` is used consistently for authentication. Indexes `by_accountId`, `by_boardId`, `by_user`, `by_board`, `by_token`, `by_shareCode` exist in `convex/schema.ts`.
- **Local-first IndexedDB Swap Model**: `accountStorage.ts` properly isolates active board data in 8 flat stores and stashes un-opened/switch-away accounts in `accountsData`.

---
*Phase 2 Complete — Ready for Phase 3 (Investigation & Root Cause)*
