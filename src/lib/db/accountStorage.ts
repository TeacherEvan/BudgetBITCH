// lib/db/accountStorage.ts
//
// Local-first multi-board storage for the Accounts feature.
//
// MODEL (swap, NOT composite keys):
//   - The 8 flat user-data stores (expenses, budgets, …) always hold the
//     ACTIVE board — exactly how the legacy couple board already works. The
//     dashboard and every hook read/write those stores with zero changes.
//   - `accountsData` store: keyed by accountId → a full BoardSnapshot stash of
//     that account's data. Switching boards stashes the current 8 stores into
//     accountsData[<current>] and restores accountsData[<next>] into the 8 stores.
//   - `localAccounts` store: keyed by accountId → LocalAccountMeta (listing cache).
//   - `bb:currentAccount` key in `settings` store: the active accountId
//     (PERSONAL_ACCOUNT_ID for the personal board).

import {
  serializeBoard,
  replaceBoardData,
  applyRemoteBoard,
  clearAllUserData,
  getDB,
  getWizardProfile,
  getAllLocalWrites,
  clearAllLocalWrites,
  recordLocalWritesBulk,
} from "./local-db";
import {
  PERSONAL_ACCOUNT_ID,
  LocalAccountMeta,
  UmbrellaKey,
} from "@/lib/types/accounts";
import { notifyBoardChanged, type BoardSnapshot } from "@/lib/types/budget";

// Re-export so callers don't need to know the raw store name.
export const ACCOUNTS_DATA_STORE = "accountsData";
export const LOCAL_ACCOUNTS_STORE = "localAccounts";
export const CURRENT_ACCOUNT_KEY = "bb:currentAccount";

export interface StashedAccount {
  accountId: string;
  // A full BoardSnapshot clone (the 8 shared stores).
  snapshot: BoardSnapshot;
  stashedAt: number;
  // Scoped write timestamps for LWW sync so account switching does not leak tombstones
  localWrites?: Record<string, number>;
}

async function db() {
  return getDB();
}

function clone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));
}

// ── single-flight board swaps ───────────────────────────────────────────────
// A swap spans several IDB transactions (exact boundary list below). Without
// serialization, a double-click or a crash-recovery retry interleaves two
// swaps' stash/clear/restore/pointer writes and mixes boards. Every swap entry
// point funnels through this chain; the next one starts only after the previous
// one has settled, successfully or not.
let swapChain: Promise<unknown> = Promise.resolve();
function serializeSwap<T>(op: () => Promise<T>): Promise<T> {
  const run = swapChain.then(op, op);
  swapChain = run.catch(() => undefined);
  return run;
}

/**
 * Re-verify the active pointer after an await inside a swap. Another tab (or a
 * direct setCurrentAccountId call) may have moved it while we awaited; writing
 * the restored board under a different pointer would blend two boards.
 */
async function assertPointerStill(expected: string, phase: string): Promise<void> {
  const actual = await getCurrentAccountId();
  if (actual !== expected) {
    throw new Error(
      `Board swap aborted: active account changed from "${expected}" to "${actual}" during ${phase}`,
    );
  }
}

// REMAINING TRANSACTION BOUNDARY (explicitly out of scope for this workstream):
// the shared helpers in local-db.ts each open and await their own transaction,
// so a swap still performs these discrete commits:
//   1. stashCurrentAccount -> serializeBoard reads (9 get/all reads)
//   2. stashCurrentAccount -> accountsData put
//   3. getStashedAccount   -> accountsData get
//   4. clearAllUserData    -> multi-store clear of the 8 shared stores
//   5. clearAllLocalWrites -> localWrites clear
//   6. replaceBoardData    -> multi-store put of the 8 shared stores
//   7. recordLocalWritesBulk -> localWrites put (when a stash had clocks)
//   8. setCurrentAccountId -> bbMeta put (the pointer flip)
// Closing this into ONE transaction requires a new exported
// `swapBoardAtomically()` inside local-db.ts that stages stash + clear +
// restore + clocks + pointer against a single
// db.transaction([...8 stores, 'localWrites', 'accountsData', 'bbMeta'],
// 'readwrite') and emits BOARD_CHANGED_EVENT only after `tx.done`. local-db.ts
// is outside this workstream's exclusive edit scope, so this pass closes the
// interleaving with the single-flight chain plus pointer re-verification.

// ── current account ────────────────────────────────────────────────────────

export async function getCurrentAccountId(): Promise<string> {
  const database = await db();
  const id = await database.get("bbMeta", CURRENT_ACCOUNT_KEY);
  return (id as string | undefined) ?? PERSONAL_ACCOUNT_ID;
}

export async function setCurrentAccountId(accountId: string): Promise<void> {
  const database = await db();
  await database.put("bbMeta", accountId, CURRENT_ACCOUNT_KEY);
  notifyBoardChanged("switch");
}

// ── local accounts meta ──────────────────────────────────────────────────────

export async function getLocalAccounts(): Promise<LocalAccountMeta[]> {
  const database = await db();
  const all = (await database.getAll(LOCAL_ACCOUNTS_STORE)) as LocalAccountMeta[];
  return all;
}

export async function getLocalAccount(
  accountId: string,
): Promise<LocalAccountMeta | undefined> {
  const database = await db();
  return (await database.get(LOCAL_ACCOUNTS_STORE, accountId)) as
    | LocalAccountMeta
    | undefined;
}

export async function saveLocalAccount(meta: LocalAccountMeta): Promise<void> {
  const database = await db();
  await database.put(LOCAL_ACCOUNTS_STORE, meta as never, meta.accountId);
}

export async function removeLocalAccount(accountId: string): Promise<void> {
  const database = await db();
  await database.delete(LOCAL_ACCOUNTS_STORE, accountId);
}

/** Drop a board's stashed snapshot (used when an account is deleted). */
export async function removeStashedAccount(accountId: string): Promise<void> {
  const database = await db();
  await database.delete(ACCOUNTS_DATA_STORE, accountId);
}

// ── stash / restore ──────────────────────────────────────────────────────────

/**
 * Persist the current 8 flat stores as a stash for `accountId`.
 * Call BEFORE overwriting the flat stores with another account's data.
 */
export async function stashCurrentAccount(accountId: string): Promise<void> {
  const database = await db();
  const [board, writesMap] = await Promise.all([
    serializeBoard(),
    getAllLocalWrites(),
  ]);
  const snapshot = clone(board);
  const localWrites: Record<string, number> = {};
  for (const [k, v] of writesMap.entries()) {
    localWrites[k] = v;
  }
  const stashed: StashedAccount = {
    accountId,
    snapshot,
    stashedAt: Date.now(),
    localWrites,
  };
  await database.put(ACCOUNTS_DATA_STORE, stashed, accountId);
}

/**
 * Write a given BoardSnapshot into the 8 flat stores (the active board).
 * Used when SWITCHING boards: the outgoing board was already stashed, so we
 * fully replace the active stores (clear + write) rather than merge — otherwise
 * the previous account's records would leak into the new account.
 */
export async function restoreAccountToActive(
  snapshot: BoardSnapshot,
  localWrites?: Record<string, number>,
): Promise<void> {
  await clearAllUserData();
  await clearAllLocalWrites();
  await replaceBoardData(snapshot);
  if (localWrites) {
    const entries: Array<{ store: string; key: string; timestamp?: number }> = [];
    for (const [compositeKey, ts] of Object.entries(localWrites)) {
      const idx = compositeKey.indexOf(":");
      if (idx !== -1) {
        entries.push({
          store: compositeKey.slice(0, idx),
          key: compositeKey.slice(idx + 1),
          timestamp: ts,
        });
      }
    }
    if (entries.length > 0) {
      await recordLocalWritesBulk(entries);
    }
  }
}

export async function getStashedAccount(
  accountId: string,
): Promise<StashedAccount | undefined> {
  const database = await db();
  return database.get(ACCOUNTS_DATA_STORE, accountId) as Promise<
    StashedAccount | undefined
  >;
}

export async function hasStashedAccount(accountId: string): Promise<boolean> {
  const stashed = await getStashedAccount(accountId);
  return !!stashed;
}

/**
 * Switch the active board. Stashes the current account (if it has live data),
 * then restores the target. For the personal board we never clobber the live
 * personal 8 stores; we stash them into accountsData[personal] on first switch
 * so returning to personal restores exactly what the user had.
 */
async function switchAccountImpl(
  targetAccountId: string,
): Promise<void> {
  const current = await getCurrentAccountId();
  if (current === targetAccountId) return;

  // Stash the outgoing board (including personal — legacy data migrated here).
  await stashCurrentAccount(current);
  await assertPointerStill(current, "stashing the outgoing board");

  const stashed = await getStashedAccount(targetAccountId);
  if (stashed) {
    await restoreAccountToActive(stashed.snapshot, stashed.localWrites);
  } else if (targetAccountId === PERSONAL_ACCOUNT_ID) {
    // No personal stash yet (fresh local user): leave the 8 stores as-is.
    // The live personal data is already in them. Mark so we don't re-stash empty.
    await assertPointerStill(current, "returning to the personal board");
    await setCurrentAccountId(PERSONAL_ACCOUNT_ID);
    return;
  } else {
    // New account never opened locally: start from an empty board so the
    // server copy (when pulled) fills in. Inherit the personal wizard profile
    // if available so the user doesn't have to repeatedly do onboarding.
    const personalStash = await getStashedAccount(PERSONAL_ACCOUNT_ID);
    const personalProfile = personalStash?.snapshot?.wizardProfile || (await getWizardProfile());
    const blank = {
      wizardProfile: personalProfile ?? null,
      expenses: [],
      incomes: [],
      budgets: [],
      bills: [],
      savingsGoals: [],
      netWorthSnapshots: [],
      debts: [],
      criticalExpenseCommitments: [],
    };
    await restoreAccountToActive(blank);
  }

  await assertPointerStill(current, "restoring the incoming board");
  await setCurrentAccountId(targetAccountId);
}

export async function switchAccount(targetAccountId: string): Promise<void> {
  return serializeSwap(() => switchAccountImpl(targetAccountId));
}

/**
 * Seed the local listing with the user's personal board entry (always present).
 */
export async function ensurePersonalAccount(): Promise<void> {
  const existing = await getLocalAccount(PERSONAL_ACCOUNT_ID);
  if (!existing) {
    await saveLocalAccount({
      accountId: PERSONAL_ACCOUNT_ID,
      umbrella: "personal",
      name: "Personal",
      boardId: null,
      inviteCode: null,
      role: "owner",
      hasLocalData: true,
    });
  }
}

/**
 * Save an account's server-side snapshot into its local stash and meta, then
 * make it the active board. Used after a successful join/sync.
 */
async function adoptRemoteAccountImpl(
  meta: LocalAccountMeta,
  snapshot: BoardSnapshot,
): Promise<void> {
  // Stash outgoing before adopting.
  const current = await getCurrentAccountId();
  if (current !== meta.accountId) {
    await stashCurrentAccount(current);
    await assertPointerStill(current, "stashing before adopting an account");
  }
  const database = await db();
  await database.put(
    ACCOUNTS_DATA_STORE,
    {
      accountId: meta.accountId,
      snapshot: clone(snapshot),
      stashedAt: Date.now(),
    } as StashedAccount,
    meta.accountId,
  );
  await saveLocalAccount({ ...meta, hasLocalData: true });
  await restoreAccountToActive(snapshot);
  await assertPointerStill(current, "restoring an adopted account");
  await setCurrentAccountId(meta.accountId);
}

export async function adoptRemoteAccount(
  meta: LocalAccountMeta,
  snapshot: BoardSnapshot,
): Promise<void> {
  return serializeSwap(() => adoptRemoteAccountImpl(meta, snapshot));
}

/**
 * Adopt a remote board returned as a keyed map from Convex (getAccountBoard)
 * into local storage and set it as active.
 */
async function adoptRemoteBoardMapImpl(
  meta: LocalAccountMeta,
  remoteMap: Record<string, { value: unknown; updatedAt: number }>,
): Promise<void> {
  const current = await getCurrentAccountId();
  if (current !== meta.accountId) {
    await stashCurrentAccount(current);
    await assertPointerStill(current, "stashing before adopting a remote board");
  }
  await clearAllUserData();
  await clearAllLocalWrites();
  await applyRemoteBoard(remoteMap);
  const [hydratedSnapshot, writesMap] = await Promise.all([
    serializeBoard(),
    getAllLocalWrites(),
  ]);
  const localWrites: Record<string, number> = {};
  for (const [k, v] of writesMap.entries()) {
    localWrites[k] = v;
  }
  const database = await db();
  await database.put(
    ACCOUNTS_DATA_STORE,
    {
      accountId: meta.accountId,
      snapshot: clone(hydratedSnapshot),
      stashedAt: Date.now(),
      localWrites,
    } as StashedAccount,
    meta.accountId,
  );
  await saveLocalAccount({ ...meta, hasLocalData: true });
  await assertPointerStill(current, "restoring an adopted remote board");
  await setCurrentAccountId(meta.accountId);
  notifyBoardChanged('switch');
}

export async function adoptRemoteBoardMap(
  meta: LocalAccountMeta,
  remoteMap: Record<string, { value: unknown; updatedAt: number }>,
): Promise<void> {
  return serializeSwap(() => adoptRemoteBoardMapImpl(meta, remoteMap));
}

export type { UmbrellaKey };
