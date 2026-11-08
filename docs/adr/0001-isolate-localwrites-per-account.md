# 0001: Isolate Local-First Write Timestamps (`localWrites`) per Budgeting Account

- **Status:** Proposed
- **Date:** 2026-11-08
- **Context:**
  Budget Boss uses an active-board swapping architecture where the 8 user data object stores (`expenses`, `incomes`, `budgets`, etc.) hold the active account's rows. When a user switches accounts, `accountStorage.ts` stashes the active stores into `accountsData` and restores the target account. However, `localWrites` (which tracks LWW write timestamps per composite key `${store}:${key}`) was shared globally across accounts.
  When `serializeBoardForSync()` runs, it checks all keys in `localWrites` that are not present in the active board and emits an explicit deletion tombstone (`{ value: null, updatedAt, deleted: true }`). Switching from Account A to Account B causes Account A's IDs to be treated as deleted on Account B, injecting false deletion tombstones into Account B's remote server board.
- **Decision:**
  Scope `localWrites` per account by including the account's write-timestamp map inside `StashedAccount` in `accountsData`. On `switchAccount` or `restoreAccountToActive`, clear the live `localWrites` store and restore the target account's timestamps.
- **Consequences:**
  - Positive: Eliminates false deletion tombstones during multi-account and couple-board synchronization.
  - Positive: Prevents timestamp collision between different accounts.
  - Negative: Requires stashing and hydrating `localWrites` alongside `BoardSnapshot` during account transitions.
- **Alternatives Considered:**
  1. Prefixing every key in `localWrites` with `${accountId}:`: Rejected because the flat stores do not carry `accountId` on their item objects, requiring extensive signature changes across all store helpers.
  2. Clearing `localWrites` completely without restoring: Rejected because offline conflict-free merge timestamps would be lost when switching accounts offline.
