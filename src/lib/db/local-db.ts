// lib/db/local-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  WizardProfile, 
  ExpenseEntry, 
  BudgetCategory, 
  Bill, 
  SavingsGoal, 
  CriticalExpenseCommitment,
  NewsItem,
  LocationCache,
  ExpenseCategory,
  NetWorthSnapshot,
  Debt,
  BoardSnapshot,
} from '@/lib/types/budget';
import { notifyBoardChanged } from '@/lib/types/budget';

export type { BoardSnapshot } from '@/lib/types/budget';

interface BudgetBITCHDB extends DBSchema {
  wizardProfile: {
    key: string;
    value: WizardProfile;
  };
  expenses: {
    key: string;
    value: ExpenseEntry;
    indexes: { 'by-date': string; 'by-category': string; 'by-recurring': string };
  };
  budgets: {
    key: string;
    value: BudgetCategory;
  };
  bills: {
    key: string;
    value: Bill;
  };
  savingsGoals: {
    key: string;
    value: SavingsGoal;
  };
  netWorthSnapshots: {
    key: string;
    value: NetWorthSnapshot;
  };
  debts: {
    key: string;
    value: Debt;
  };
  criticalExpenseCommitments: {
    key: string;
    value: CriticalExpenseCommitment;
  };
  newsCache: {
    key: string;
    value: NewsItem;
    indexes: { 'by-locale': string; 'by-category': string; 'by-date': string };
  };
  locationCache: {
    key: string;
    value: LocationCache;
  };
  settings: {
    key: string;
    value: {
      preferredLocale: 'th' | 'en';
      voiceSettings: { enabled: boolean; rate: number; pitch: number };
      privacyDisclaimerAccepted: boolean;
    };
  };
}

const DB_NAME = 'budgetbitch';
const DB_VERSION = 1;
let dbInstance: IDBPDatabase<BudgetBITCHDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BudgetBITCHDB>> {
  if (typeof window === 'undefined') {
    // Return a dummy DB proxy to prevent SSR crashes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Proxy({} as any, {
      get(target, prop) {
        if (prop === 'then') {
          return undefined;
        }
        if (prop === 'transaction') {
          return () => ({
            store: new Proxy({}, {
              get(t, p) {
                if (p === 'index') {
                  return () => new Proxy({}, {
                    get(ti, pi) {
                      if (pi === 'iterate') {
                        return async function* () {};
                      }
                      return () => Promise.resolve();
                    }
                  });
                }
                return () => Promise.resolve();
              }
            }),
            done: Promise.resolve(),
            objectStore: () => ({
              clear: () => Promise.resolve()
            })
          });
        }
        if (typeof prop === 'string' && (prop.startsWith('getAll') || prop.includes('Index'))) {
          return () => Promise.resolve([]);
        }
        return () => Promise.resolve(undefined);
      }
    });
  }

  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BudgetBITCHDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // wizardProfile
      if (!db.objectStoreNames.contains('wizardProfile')) {
        db.createObjectStore('wizardProfile');
      }

      // expenses
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-date', 'date');
        expenseStore.createIndex('by-category', 'category');
        expenseStore.createIndex('by-recurring', 'recurringId');
      }

      // budgets
      if (!db.objectStoreNames.contains('budgets')) {
        db.createObjectStore('budgets', { keyPath: 'category' });
      }

      // bills
      if (!db.objectStoreNames.contains('bills')) {
        db.createObjectStore('bills', { keyPath: 'id' });
      }

      // savingsGoals
      if (!db.objectStoreNames.contains('savingsGoals')) {
        db.createObjectStore('savingsGoals', { keyPath: 'id' });
      }

      // netWorthSnapshots
      if (!db.objectStoreNames.contains('netWorthSnapshots')) {
        db.createObjectStore('netWorthSnapshots', { keyPath: 'date' });
      }

      // debts
      if (!db.objectStoreNames.contains('debts')) {
        db.createObjectStore('debts', { keyPath: 'id' });
      }

      // criticalExpenseCommitments
      if (!db.objectStoreNames.contains('criticalExpenseCommitments')) {
        db.createObjectStore('criticalExpenseCommitments', { keyPath: 'month' });
      }

      // newsCache
      if (!db.objectStoreNames.contains('newsCache')) {
        const newsStore = db.createObjectStore('newsCache', { keyPath: 'link' });
        newsStore.createIndex('by-locale', 'locale');
        newsStore.createIndex('by-category', 'category');
        newsStore.createIndex('by-date', 'pubDate');
      }

      // locationCache
      if (!db.objectStoreNames.contains('locationCache')) {
        db.createObjectStore('locationCache');
      }

      // settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });

  return dbInstance;
}

// Wizard Profile
export async function saveWizardProfile(profile: WizardProfile): Promise<void> {
  const db = await getDB();
  await db.put('wizardProfile', profile, 'current');
  notifyBoardChanged();
}

export async function getWizardProfile(): Promise<WizardProfile | undefined> {
  const db = await getDB();
  return db.get('wizardProfile', 'current');
}

export async function clearWizardProfile(): Promise<void> {
  const db = await getDB();
  await db.delete('wizardProfile', 'current');
}

// Expenses
export async function addExpense(expense: ExpenseEntry): Promise<void> {
  const db = await getDB();
  await db.add('expenses', expense);
  notifyBoardChanged();
}

export async function updateExpense(expense: ExpenseEntry): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
  notifyBoardChanged();
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
  notifyBoardChanged();
}

export async function getExpenses(): Promise<ExpenseEntry[]> {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<ExpenseEntry[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('expenses', 'by-date', IDBKeyRange.bound(startDate, endDate));
  return all;
}

export async function getExpensesByCategory(category: ExpenseCategory): Promise<ExpenseEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('expenses', 'by-category', category);
}

// Budgets
export async function saveBudgetCategory(budget: BudgetCategory): Promise<void> {
  const db = await getDB();
  await db.put('budgets', budget);
  notifyBoardChanged();
}

export async function getBudgetCategory(category: ExpenseCategory): Promise<BudgetCategory | undefined> {
  const db = await getDB();
  return db.get('budgets', category);
}

export async function getAllBudgets(): Promise<BudgetCategory[]> {
  const db = await getDB();
  return db.getAll('budgets');
}

// Bills
export async function addBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.add('bills', bill);
  notifyBoardChanged();
}

export async function updateBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.put('bills', bill);
  notifyBoardChanged();
}

export async function deleteBill(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bills', id);
  notifyBoardChanged();
}

export async function getAllBills(): Promise<Bill[]> {
  const db = await getDB();
  return db.getAll('bills');
}

// Savings Goals
export async function addSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.add('savingsGoals', goal);
  notifyBoardChanged();
}

export async function updateSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.put('savingsGoals', goal);
  notifyBoardChanged();
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('savingsGoals', id);
  notifyBoardChanged();
}

export async function getAllSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDB();
  return db.getAll('savingsGoals');
}

// Net Worth Snapshots
export async function saveNetWorthSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
  const db = await getDB();
  await db.put('netWorthSnapshots', snapshot);
  notifyBoardChanged();
}

export async function getLatestNetWorthSnapshot(): Promise<NetWorthSnapshot | undefined> {
  const db = await getDB();
  const all = await db.getAll('netWorthSnapshots');
  return all.sort((a, b) => b.date.localeCompare(a.date))[0];
}

// Debts
export async function addDebt(debt: Debt): Promise<void> {
  const db = await getDB();
  await db.add('debts', debt);
  notifyBoardChanged();
}

export async function updateDebt(debt: Debt): Promise<void> {
  const db = await getDB();
  await db.put('debts', debt);
  notifyBoardChanged();
}

export async function deleteDebt(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('debts', id);
  notifyBoardChanged();
}

export async function getAllDebts(): Promise<Debt[]> {
  const db = await getDB();
  return db.getAll('debts');
}

// Critical Expense Commitments
export async function saveCriticalExpenseCommitment(commitment: CriticalExpenseCommitment): Promise<void> {
  const db = await getDB();
  await db.put('criticalExpenseCommitments', commitment);
  notifyBoardChanged();
}

export async function getCriticalExpenseCommitment(month: string): Promise<CriticalExpenseCommitment | undefined> {
  const db = await getDB();
  return db.get('criticalExpenseCommitments', month);
}

export async function deleteCriticalExpenseCommitment(month: string): Promise<void> {
  const db = await getDB();
  await db.delete('criticalExpenseCommitments', month);
  notifyBoardChanged();
}

// News Cache
export async function addNewsItem(item: NewsItem): Promise<void> {
  const db = await getDB();
  await db.put('newsCache', item);
}

export async function getNewsByLocale(locale: 'th' | 'en'): Promise<NewsItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('newsCache', 'by-locale', locale);
}

export async function getNewsByCategory(category: NewsItem['category']): Promise<NewsItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('newsCache', 'by-category', category);
}

export async function clearOldNews(olderThan: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('newsCache', 'readwrite');
  const index = tx.store.index('by-date');
  const range = IDBKeyRange.upperBound(olderThan);
  for await (const cursor of index.iterate(range)) {
    await cursor.delete();
  }
  await tx.done;
}

// Location Cache
export async function saveLocationCache(location: LocationCache): Promise<void> {
  const db = await getDB();
  await db.put('locationCache', location, 'current');
}

export async function getLocationCache(): Promise<LocationCache | undefined> {
  const db = await getDB();
  return db.get('locationCache', 'current');
}

// Settings
export async function saveSettings(settings: { 
  preferredLocale: 'th' | 'en'; 
  voiceSettings: { enabled: boolean; rate: number; pitch: number };
  privacyDisclaimerAccepted: boolean;
}): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'current');
}

export async function getSettings(): Promise<{ 
  preferredLocale: 'th' | 'en'; 
  voiceSettings: { enabled: boolean; rate: number; pitch: number };
  privacyDisclaimerAccepted: boolean;
} | undefined> {
  const db = await getDB();
  return db.get('settings', 'current');
}

// The 8 user-data object stores. Excludes caches (newsCache, locationCache) and
// the persistent settings store so a "reset" never silently discards preferences
// or offline/board sync queues.
export const USER_DATA_STORES = [
  'wizardProfile',
  'expenses',
  'budgets',
  'bills',
  'savingsGoals',
  'netWorthSnapshots',
  'debts',
  'criticalExpenseCommitments',
] as const;

export type UserDataStore = (typeof USER_DATA_STORES)[number];

// Utility: Clear all data (for full wipe, e.g. dev/test)
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const stores = [
    'wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals',
    'netWorthSnapshots', 'debts', 'criticalExpenseCommitments', 'newsCache',
    'locationCache', 'settings'
  ] as const;
  const tx = db.transaction(stores, 'readwrite');
  for (const store of stores) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}

// Utility: Clear only user-owned data (settings + caches preserved)
export async function clearAllUserData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(USER_DATA_STORES, 'readwrite');
  for (const store of USER_DATA_STORES) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}

// Utility: Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}

// ── Shared board (couple sync) ──────────────────────────────────────────────

/**
 * Serialize the 8 shared local stores into a single BoardSnapshot.
 * User-local stores (settings, newsCache, locationCache) are intentionally excluded.
 */
export async function serializeBoard(): Promise<BoardSnapshot> {
  const db = await getDB();
  const [
    wizardProfile,
    expenses,
    budgets,
    bills,
    savingsGoals,
    netWorthSnapshots,
    debts,
    criticalExpenseCommitments,
  ] = await Promise.all([
    db.get('wizardProfile', 'current'),
    db.getAll('expenses'),
    db.getAll('budgets'),
    db.getAll('bills'),
    db.getAll('savingsGoals'),
    db.getAll('netWorthSnapshots'),
    db.getAll('debts'),
    db.getAll('criticalExpenseCommitments'),
  ]);

  return {
    wizardProfile: wizardProfile ?? null,
    expenses,
    budgets,
    bills,
    savingsGoals,
    netWorthSnapshots,
    debts,
    criticalExpenseCommitments,
  };
}

/**
 * Merge the 8 shared local stores from a BoardSnapshot (union by key).
 * Local records whose keys are absent from the incoming snapshot are preserved;
 * incoming records overwrite same-key local records. This prevents a partner's
 * snapshot from clobbering local edits (e.g. an expense you just added on this
 * device) during the 2-way sync pull.
 *
 * Does NOT emit BOARD_CHANGED_EVENT — applying a remote board must not echo
 * back as a push.
 */
export async function replaceBoardData(board: BoardSnapshot): Promise<void> {
  const db = await getDB();
  const stores = [
    'wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals',
    'netWorthSnapshots', 'debts', 'criticalExpenseCommitments',
  ] as const;
  const tx = db.transaction(stores, 'readwrite');

  // Capture the set of keys present in the incoming snapshot so we can keep
  // local records the remote board didn't touch (the merge, not clear).
  const incomingKeys = new Set<string>();
  const stage: { store: typeof stores[number]; value: unknown; explicitKey?: string | number }[] = [];

  if (board.wizardProfile) {
    incomingKeys.add('wizardProfile:current');
    stage.push({ store: 'wizardProfile', value: board.wizardProfile, explicitKey: 'current' });
  }
  for (const e of board.expenses ?? []) {
    incomingKeys.add(`expenses:${e.id}`);
    stage.push({ store: 'expenses', value: e });
  }
  for (const b of board.budgets ?? []) {
    incomingKeys.add(`budgets:${b.category}`);
    stage.push({ store: 'budgets', value: b });
  }
  for (const b of board.bills ?? []) {
    incomingKeys.add(`bills:${b.id}`);
    stage.push({ store: 'bills', value: b });
  }
  for (const g of board.savingsGoals ?? []) {
    incomingKeys.add(`savingsGoals:${g.id}`);
    stage.push({ store: 'savingsGoals', value: g });
  }
  for (const s of board.netWorthSnapshots ?? []) {
    incomingKeys.add(`netWorthSnapshots:${s.date}`);
    stage.push({ store: 'netWorthSnapshots', value: s });
  }
  for (const d of board.debts ?? []) {
    incomingKeys.add(`debts:${d.id}`);
    stage.push({ store: 'debts', value: d });
  }
  for (const c of board.criticalExpenseCommitments ?? []) {
    incomingKeys.add(`criticalExpenseCommitments:${c.month}`);
    stage.push({ store: 'criticalExpenseCommitments', value: c });
  }

  // Keep local records not present in the incoming snapshot (merge semantics).
  for (const store of stores) {
    const os = tx.objectStore(store);
    const all = await os.getAll();
    const keyPath = os.keyPath as string | null;
    for (const record of all) {
      const key = keyPath
        ? (record as unknown as Record<string, unknown>)[keyPath]
        : (record as { id: string }).id;
      if (!incomingKeys.has(`${store}:${String(key)}`)) {
        // Local-only record: keep it (do not delete).
        continue;
      }
    }
  }

  // Write incoming records (overwriting same-key local ones). wizardProfile has
  // no keyPath on its value, so it needs the explicit 'current' key; the rest
  // carry their key on the record (keyPath stores).
  for (const item of stage) {
    if (item.explicitKey !== undefined) {
      tx.objectStore(item.store).put(item.value as never, item.explicitKey as never);
    } else {
      tx.objectStore(item.store).put(item.value as never);
    }
  }

  await tx.done;
}

/**
 * Serialize the 8 shared stores into the keyed-map form the server expects
 * for per-record merge sync: `{ "<store>:<key>": { value, updatedAt } }`.
 * Key scheme matches `applyRemoteBoard` and the server merge.
 */
export async function serializeBoardForSync(): Promise<Record<string, { value: unknown; updatedAt: number }>> {
  const board = await serializeBoard();
  const now = Date.now();
  const out: Record<string, { value: unknown; updatedAt: number }> = {};

  if (board.wizardProfile) {
    out['wizardProfile:current'] = { value: board.wizardProfile, updatedAt: now };
  }
  for (const e of board.expenses ?? []) out[`expenses:${e.id}`] = { value: e, updatedAt: now };
  for (const b of board.budgets ?? []) out[`budgets:${b.category}`] = { value: b, updatedAt: now };
  for (const b of board.bills ?? []) out[`bills:${b.id}`] = { value: b, updatedAt: now };
  for (const g of board.savingsGoals ?? []) out[`savingsGoals:${g.id}`] = { value: g, updatedAt: now };
  for (const s of board.netWorthSnapshots ?? []) out[`netWorthSnapshots:${s.date}`] = { value: s, updatedAt: now };
  for (const d of board.debts ?? []) out[`debts:${d.id}`] = { value: d, updatedAt: now };
  for (const c of board.criticalExpenseCommitments ?? []) out[`criticalExpenseCommitments:${c.month}`] = { value: c, updatedAt: now };

  return out;
}

/**
 * Apply a server keyed-map onto local stores. Writes each record's value into
 * the matching store/key, preserving local-only records the server didn't
 * touch. Does NOT emit BOARD_CHANGED_EVENT (avoid echo-back push).
 */
export async function applyRemoteBoard(map: Record<string, { value: unknown; updatedAt: number }>): Promise<void> {
  const db = await getDB();
  const stores = [
    'wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals',
    'netWorthSnapshots', 'debts', 'criticalExpenseCommitments',
  ] as const;

  const stage: { store: typeof stores[number]; value: unknown; explicitKey?: string | number }[] = [];
  for (const [key, rec] of Object.entries(map)) {
    const [store, ...rest] = key.split(':');
    const recordKey = rest.join(':');
    if (!stores.includes(store as typeof stores[number])) continue;
    if (store === 'wizardProfile') {
      stage.push({ store: 'wizardProfile', value: rec.value, explicitKey: 'current' });
    } else {
      stage.push({ store: store as typeof stores[number], value: rec.value, explicitKey: recordKey });
    }
  }

  const tx = db.transaction(stores, 'readwrite');
  for (const item of stage) {
    if (item.explicitKey !== undefined) {
      tx.objectStore(item.store).put(item.value as never, item.explicitKey as never);
    } else {
      tx.objectStore(item.store).put(item.value as never);
    }
  }
  await tx.done;
}
