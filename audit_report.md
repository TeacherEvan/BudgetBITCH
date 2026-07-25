# Phase 1: AUDIT Report — Accounts & Syncing Features

## Scope Definition
- **Target Feature Area**: Accounts management (umbrella multi-board budgeting) & syncing engine (local IndexedDB <-> Convex shared boards).
- **Core Backend Files**:
  - `convex/schema.ts` (accounts, accountBoards, boardMembers, userProfiles, invites)
  - `convex/accounts.ts` (barrel export)
  - `convex/accounts/index.ts` (barrel export)
  - `convex/accounts/types.ts`
  - `convex/accounts/helpers.ts`
  - `convex/accounts/accountCrud.ts`
  - `convex/accounts/accountBoardSync.ts`
  - `convex/accounts/accountInvites.ts`
  - `convex/boardMerge.ts` (Last-Write-Wins merging algorithm)
  - `convex/accounts.test.ts`
- **Core Client Files**:
  - `src/lib/db/accountStorage.ts` (multi-board stash & swap model)
  - `src/lib/db/local-db.ts` (IndexedDB 8-store persistence & board serialization)
  - `src/hooks/use-accounts.ts` (client Accounts state & actions orchestration)
  - `src/hooks/use-accounts.test.tsx`
  - `src/hooks/use-account-sync.ts` (background sync engine, push debouncing & queueing)
  - `src/hooks/use-account-sync.test.tsx`
  - `src/components/accounts/accounts-view.tsx` (UI for accounts management)
  - `src/components/accounts/synced-account-dashboard.tsx`

## File Inventory & Line Counts
| Language | Directory | File Path | Line Count |
|---|---|---|---|
| TypeScript (Convex) | `convex/` | `schema.ts` | 161 |
| TypeScript (Convex) | `convex/accounts/` | `accountCrud.ts` | 361 |
| TypeScript (Convex) | `convex/accounts/` | `accountBoardSync.ts` | 132 |
| TypeScript (Convex) | `convex/accounts/` | `accountInvites.ts` | 406 |
| TypeScript (Convex) | `convex/accounts/` | `helpers.ts` | 58 |
| TypeScript (Convex) | `convex/accounts/` | `types.ts` | 29 |
| TypeScript (Convex) | `convex/` | `accounts.ts` | 50 |
| TypeScript (Convex) | `convex/` | `accounts.test.ts` | 502 |
| TypeScript (Client) | `src/lib/db/` | `accountStorage.ts` | 238 |
| TypeScript (Client) | `src/hooks/` | `use-accounts.ts` | 544 |
| TypeScript (Client) | `src/hooks/` | `use-account-sync.ts` | 283 |
| TSX (Client) | `src/components/accounts/` | `accounts-view.tsx` | 366 |

## Dependency Graph
```
UI Layer:
  src/components/accounts/accounts-view.tsx
    ├── useAccounts (src/hooks/use-accounts.ts)
    │     ├── accountStorage (src/lib/db/accountStorage.ts)
    │     │     └── local-db (src/lib/db/local-db.ts)
    │     └── convex/api (accounts.listMyAccounts, createAccount, etc.)
    └── useAccountSync (src/hooks/use-account-sync.ts)
          ├── local-db (serializeBoardForSync, applyRemoteBoard)
          ├── accountStorage (getCurrentAccountId, getLocalAccount)
          └── convex/api (getAccountBoard, pushAccountBoard)

Convex Backend Layer:
  convex/accounts.ts -> convex/accounts/index.ts
    ├── accountCrud.ts (createAccount, listMyAccounts, getAccount, renameAccount, rotateInviteCode, deleteAccount)
    ├── accountBoardSync.ts (pushAccountBoard, getAccountBoard, changePassword)
    │     └── boardMerge.ts (mergeRecords - LWW timestamp merge)
    ├── accountInvites.ts (inviteByCode, createInviteToken, redeemInviteToken, listInvites, acceptInvite, declineInvite, removeMember, leaveAccount)
    └── helpers.ts (generateInviteCode, ensureProfileDoc, getBoardMemberIds)
```

## Test Coverage Baseline
- **Vitest Runner**: `vitest run`
- **Total Test Files**: 85 / 85 passed (100%)
- **Total Tests**: 521 / 521 passed (100%)
- **Accounts-specific tests**:
  - `convex/accounts.test.ts`: 21 tests passed
  - `src/hooks/use-accounts.test.tsx`: 8 tests passed
  - `src/hooks/use-account-sync.test.tsx`: 7 tests passed
  - `src/components/accounts/accounts-view.test.tsx`: 9 tests passed
  - `src/components/accounts/synced-account-dashboard.test.tsx`: 1 test passed

## Lint & Typecheck Baseline
- **TypeScript (`tsc --noEmit`)**: 0 errors
- **ESLint (`eslint .`)**: 0 errors, 11 warnings (none in accounts/syncing files)
- **TODOs / FIXMEs**: 0 found

---
*Phase 1 Complete — Ready for Phase 2 (Review)*
