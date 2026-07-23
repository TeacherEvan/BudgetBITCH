# Deep Architectural & Security Code Review Audit — BudgetBITCH

**Date:** 2026-07-23  
**Audit Scope:** Full Stack (`src/app`, `src/components`, `src/hooks`, `src/lib`, `convex/`)  
**Methodology:** Static Code Inventory, Dynamic Test Execution, Convex Best Practices Audit, IndexedDB Concurrency Analysis, Anti-Pattern Scan  

---

## Executive Summary & Matrix of Findings

An exhaustive multi-dimensional review of the BudgetBITCH codebase was conducted across backend cloud functions, local IndexedDB persistence, React state hooks, security boundaries, and code quality. A total of **10 actionable issues** were identified across Critical, High, Medium, Low, and Style categories.

| Ref ID | Subsystem | File & Location | Severity | Vulnerability / Anti-Pattern Category | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Convex API | [`convex/receipts.ts:4-38`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/receipts.ts#L4-L38) | **CRITICAL** | Security / Unauthenticated Action | Public `parseReceipt` action invokes external Gemini AI API using project secret `GEMINI_API_KEY` without checking caller `getAuthUserId(ctx)`. Anyone can exhaust API quota over HTTP/WS. |
| **CONV-01** | Convex DB | [`convex/accounts.ts:154,234,387...`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/accounts.ts#L154) | **HIGH** | Performance / Unbounded Queries | Multiple Convex database queries use `.collect()` without `.take()` caps or pagination (`boardMembers`, `invites`, `accountBoards`), exposing database read amplification as tables grow. |
| **CONV-02** | Convex Schema | [`convex/schema.ts:14,31,67`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/schema.ts#L14) | **MEDIUM** | Schema / Type Safety | Overly permissive `v.any()` validators used on `wizardProfile`, `fullBackupData`, and `data` fields, bypassing Convex schema validation and payload size guards. |
| **CONV-03** | Convex Schema | [`convex/schema.ts:50-58`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/schema.ts#L50-L58) | **MEDIUM** | Schema / Index Optimization | `boardMembers` table lacks a compound index `by_user_and_board` (`["userId", "boardId"]`), forcing filter scans for user-board lookup queries. |
| **LOCAL-01** | Local Storage | [`src/lib/db/local-db.ts:165-173`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/db/local-db.ts#L165-L173) | **HIGH** | Concurrency / Race Condition | `getDB()` does not cache the in-flight `openDB()` promise. Simultaneous callers during app startup invoke `openDB()` concurrently, risking IndexedDB `blocked` state or version conflicts. |
| **LOCAL-02** | Local Storage | [`src/lib/convex/sync-snapshots.ts:45`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/convex/sync-snapshots.ts#L45) | **MEDIUM** | Network / Error Recovery | Background snapshot sync flusher swallows offline queue flush errors silently without backoff retry timers or user status notifications. |
| **CODE-01** | SMS Parser | [`src/lib/sms-parser/patterns/generic.ts:2`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/sms-parser/patterns/generic.ts#L2) | **STYLE** | Code Quality / Lint | 4 unused function imports (`normalizeDate`, `extractMerchant`, `detectType`, `countryToCurrency`) producing ESLint warnings. |
| **CODE-02** | SMS Parser | [`src/lib/sms-parser/patterns/sg.ts:2`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/sms-parser/patterns/sg.ts#L2) | **STYLE** | Code Quality / Lint | 1 unused function import (`extractMerchant`) producing ESLint warning. |
| **CODE-03** | SMS Parser | [`src/lib/sms-parser/patterns/th.ts:2`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/sms-parser/patterns/th.ts#L2) | **STYLE** | Code Quality / Lint | 1 unused function import (`extractMerchant`) producing ESLint warning. |
| **CODE-04** | SMS Parser | [`src/lib/sms-parser/patterns/us.ts:2`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/sms-parser/patterns/us.ts#L2) | **STYLE** | Code Quality / Lint | 1 unused function import (`extractMerchant`) producing ESLint warning. |
| **HYG-01** | Repo Hygiene | [`src/hooks/use-local-db.ts.backup`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/hooks/use-local-db.ts.backup) | **LOW** | Repository Hygiene | Orphaned `.backup` file remaining in `src/hooks/` directory. |

---

## Detailed Vulnerability & Architectural Analysis

### 1. [SEC-01] CRITICAL: Unauthenticated Public Action in `convex/receipts.ts`
- **Location:** [`convex/receipts.ts:4-38`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/receipts.ts#L4-L38)
- **Root Cause:** `parseReceipt` is declared as a public Convex `action` taking `base64Image: v.string()`. It sends the image payload to Google's Gemini Flash 2.5 API using server `GEMINI_API_KEY`. However, it does not call `getAuthUserId(ctx)` or verify authentication.
- **Risk:** Any unauthenticated client or external script can call `parseReceipt` via standard Convex WebSocket/HTTP client and burn the project's Gemini API quota.
- **Fix:** Add caller authentication:
  ```typescript
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError("Authentication required to parse receipts");
  }
  ```

### 2. [LOCAL-01] HIGH: IndexedDB `openDB()` Race Condition in `src/lib/db/local-db.ts`
- **Location:** [`src/lib/db/local-db.ts:165-173`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/src/lib/db/local-db.ts#L165-L173)
- **Root Cause:**
  ```typescript
  let dbInstance: IDBPDatabase<BudgetBITCHDB> | null = null;
  export async function getDB(): Promise<IDBPDatabase<BudgetBITCHDB>> {
    if (dbInstance) return dbInstance;
    dbInstance = await openDB<BudgetBITCHDB>(DB_NAME, DB_VERSION, { ... });
  }
  ```
  `dbInstance` is only assigned *after* `openDB()` resolves. When multiple React components (e.g. `useAccounts`, `useExpenses`, `useBudgets`) trigger `getDB()` on initial render in parallel, `dbInstance` is `null` for all of them, causing multiple simultaneous calls to `openDB()`.
- **Risk:** In browsers, concurrent `openDB` calls on the same database name during upgrade or open can cause blocked events, connection lockups, or `InvalidStateError`.
- **Fix:** Store the pending `dbPromise` in module scope so concurrent invocations await the exact same promise:
  ```typescript
  let dbPromise: Promise<IDBPDatabase<BudgetBITCHDB>> | null = null;
  export function getDB(): Promise<IDBPDatabase<BudgetBITCHDB>> {
    if (typeof window === 'undefined') return Promise.resolve(DUMMY_SSR_DB);
    if (!dbPromise) {
      dbPromise = openDB<BudgetBITCHDB>(DB_NAME, DB_VERSION, { ... });
    }
    return dbPromise;
  }
  ```

### 3. [CONV-01] HIGH: Unbounded `.collect()` Database Scans in `convex/accounts.ts`
- **Location:** [`convex/accounts.ts:154, 234, 387, 459, 514`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/accounts.ts#L154)
- **Root Cause:** Functions like `listMyAccounts`, `getAccount`, and `inviteByCode` perform `.collect()` queries across `boardMembers` and `accountBoards`. Per official Convex guidelines (`convex/_generated/ai/guidelines.md`), queries without explicit limits should use `.take(n)` or `.paginate()` to prevent read amplification as user data grows.
- **Fix:** Replace unbounded `.collect()` queries with `.take(MAX_OWNED_ACCOUNTS)` or `.take(50)` bounds.

### 4. [CONV-02] MEDIUM: Schema Type Validation Loosening (`v.any()`)
- **Location:** [`convex/schema.ts:28, 67, 91, 108`](file:///home/ewaldt/Documents/VS/GAMES/BudgetBITCH/convex/schema.ts#L28)
- **Root Cause:** `wizardProfile`, `fullBackupData`, and `sharedBoards.data` use `v.any()`. This disables server-side runtime validation and allows arbitrary oversized payloads.
- **Fix:** Use structured validators (`v.object(...)` or `v.record(...)`) where feasible, or enforce client payload size checks before database persistence.

### 5. [CODE-01 to CODE-04] STYLE: 13 ESLint Warnings in SMS Pattern Imports
- **Location:** `src/lib/sms-parser/patterns/{generic,sg,th,us}.ts`
- **Fix:** Remove unused imports (`normalizeDate`, `extractMerchant`, `detectType`, `countryToCurrency`).

---

## Action Plan & Remediation Strategy

1. **Step 1: Security Fix (SEC-01)** — Require `getAuthUserId(ctx)` in `convex/receipts.ts:parseReceipt` and update `convex/receipts.test.ts`.
2. **Step 2: Concurrency Fix (LOCAL-01)** — Refactor `getDB()` in `src/lib/db/local-db.ts` to cache the open promise (`dbPromise`).
3. **Step 3: Convex Query Optimization (CONV-01 & CONV-03)** — Add `.take(n)` bounds to `.collect()` queries in `convex/accounts.ts` and compound index `by_user_and_board` in `convex/schema.ts`.
4. **Step 4: Clean ESLint Warnings & Orphan Files (CODE-01..04, HYG-01)** — Clean imports and remove `src/hooks/use-local-db.ts.backup`.
5. **Step 5: Full Regression Testing** — Run `npm run lint`, `npm run test`, and `npm run test:convex` to verify clean builds.
