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
  clearAllUserData,
  getDB,
} from "./local-db";
import {
  PERSONAL_ACCOUNT_ID,
  LocalAccountMeta,
  UmbrellaKey,
} from "@/lib/types/accounts";

// Re-export so callers don't need to know the raw store name.
export const ACCOUNTS_DATA_STORE = "accountsData";
export const LOCAL_ACCOUNTS_STORE = "localAccounts";
export const CURRENT_ACCOUNT_KEY = "bb:currentAccount";

export interface StashedAccount {
  accountId: string;
  // A full BoardSnapshot clone (the 8 shared stores).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any;
  stashedAt: number;
}

async function db() {
  return getDB();
}

function clone<T>(v: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));
}

// ── current account ────────────────────────────────────────────────────────

export async function getCurrentAccountId(): Promise<string> {
  const database = await db();
  const id = await database.get("bbMeta", CURRENT_ACCOUNT_KEY);
  return (id as string | undefined) ?? PERSONAL_ACCOUNT_ID;
}

export async function setCurrentAccountId(accountId: string): Promise<void> {
  const database = await db();
  await database.put("bbMeta", accountId, CURRENT_ACCOUNT_KEY);
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
  const snapshot = clone(await serializeBoard());
  const stashed: StashedAccount = {
    accountId,
    snapshot,
    stashedAt: Date.now(),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any,
): Promise<void> {
  await clearAllUserData();
  await replaceBoardData(snapshot);
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
export async function switchAccount(
  targetAccountId: string,
): Promise<void> {
  const current = await getCurrentAccountId();
  if (current === targetAccountId) return;

  // Stash the outgoing board (including personal — legacy data migrated here).
  await stashCurrentAccount(current);

  const stashed = await getStashedAccount(targetAccountId);
  if (stashed) {
    await restoreAccountToActive(stashed.snapshot);
  } else if (targetAccountId === PERSONAL_ACCOUNT_ID) {
    // No personal stash yet (fresh local user): leave the 8 stores as-is.
    // The live personal data is already in them. Mark so we don't re-stash empty.
    await setCurrentAccountId(PERSONAL_ACCOUNT_ID);
    return;
  } else {
    // New account never opened locally: start from an empty board so the
    // server copy (when pulled) fills in. Clear the 8 stores to a blank slate.
    const blank = {
      wizardProfile: null,
      expenses: [],
      budgets: [],
      bills: [],
      savingsGoals: [],
      netWorthSnapshots: [],
      debts: [],
      criticalExpenseCommitments: [],
    };
    await restoreAccountToActive(blank);
  }

  await setCurrentAccountId(targetAccountId);
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
export async function adoptRemoteAccount(
  meta: LocalAccountMeta,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  snapshot: any,
): Promise<void> {
  // Stash outgoing before adopting.
  const current = await getCurrentAccountId();
  if (current !== meta.accountId) {
    await stashCurrentAccount(current);
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
  await setCurrentAccountId(meta.accountId);
}

export type { UmbrellaKey };
