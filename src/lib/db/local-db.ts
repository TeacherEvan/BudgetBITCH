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
} from '@/lib/types/budget';
import { notifyBoardChanged } from '@/lib/types/budget';

export type { BoardSnapshot } from '@/lib/types/budget';

export interface BudgetBITCHDB extends DBSchema {
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
  // Accounts feature (local-first multi-board): per-account stashed BoardSnapshot.
  accountsData: {
    key: string; // accountId
    value: {
      accountId: string;
      snapshot: unknown;
      stashedAt: number;
    };
  };
  // Local cache of account metadata for the Accounts listing (mirror of Convex listMyAccounts).
  localAccounts: {
    key: string; // accountId
    value: {
      accountId: string;
      umbrella: string;
      name: string;
      boardId: string | null;
      inviteCode: string | null;
      role: 'owner' | 'member';
      hasLocalData?: boolean;
    };
  };
  // Misc cross-cutting string flags (e.g. bb:currentAccount). Untyped
  bbMeta: {
    key: string;
    value: string;
  };
  // Per-record local write timestamps (ms).
  localWrites: {
    key: string;
    value: number;
  };
}

const DB_NAME = 'budgetbitch';
const DB_VERSION = 3;
let dbInstance: IDBPDatabase<BudgetBITCHDB> | null = null;

// Test-only hook: drop the cached connection so the next getDB() re-opens the
// SAME persisted IndexedDB.
export function __closeDbForTest(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close errors
    }
    dbInstance = null;
  }
}

// Singleton proxy for SSR rendering to avoid re-allocating proxies per SSR invocation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DUMMY_SSR_DB = new Proxy({} as any, {
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

export async function getDB(): Promise<IDBPDatabase<BudgetBITCHDB>> {
  if (typeof window === 'undefined') {
    return DUMMY_SSR_DB;
  }

  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BudgetBITCHDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('wizardProfile')) db.createObjectStore('wizardProfile');
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-date', 'date');
        expenseStore.createIndex('by-category', 'category');
        expenseStore.createIndex('by-recurring', 'recurringId');
      }
      if (!db.objectStoreNames.contains('budgets')) db.createObjectStore('budgets', { keyPath: 'category' });
      if (!db.objectStoreNames.contains('bills')) db.createObjectStore('bills', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('savingsGoals')) db.createObjectStore('savingsGoals', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('netWorthSnapshots')) db.createObjectStore('netWorthSnapshots', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('debts')) db.createObjectStore('debts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('criticalExpenseCommitments')) db.createObjectStore('criticalExpenseCommitments', { keyPath: 'month' });
      if (!db.objectStoreNames.contains('newsCache')) {
        const newsStore = db.createObjectStore('newsCache', { keyPath: 'link' });
        newsStore.createIndex('by-locale', 'locale');
        newsStore.createIndex('by-category', 'category');
        newsStore.createIndex('by-date', 'pubDate');
      }
      if (!db.objectStoreNames.contains('locationCache')) db.createObjectStore('locationCache');
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
      if (!db.objectStoreNames.contains('accountsData')) db.createObjectStore('accountsData');
      if (!db.objectStoreNames.contains('localAccounts')) db.createObjectStore('localAccounts');
      if (!db.objectStoreNames.contains('bbMeta')) db.createObjectStore('bbMeta');
      if (!db.objectStoreNames.contains('localWrites')) db.createObjectStore('localWrites');
    },
  });

  return dbInstance;
}

// Lossless-sync write bookkeeping
function writeKey(store: string, key: string): string {
  return `${store}:${key}`;
}

export async function recordLocalWrite(store: string, key: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put('localWrites', Date.now(), writeKey(store, key));
  } catch {
    // Non-fatal
  }
}

export async function getLocalWrite(store: string, key: string): Promise<number> {
  try {
    const db = await getDB();
    return (await db.get('localWrites', writeKey(store, key))) ?? 0;
  } catch {
    return 0;
  }
}

export async function afterBoardMutation(store: string, key: string): Promise<void> {
  await recordLocalWrite(store, key);
  notifyBoardChanged('local');
}

// Wizard Profile
export async function saveWizardProfile(profile: WizardProfile): Promise<void> {
  const db = await getDB();
  await db.put('wizardProfile', profile, 'current');
  await afterBoardMutation('wizardProfile', 'current');
}

export async function getWizardProfile(): Promise<WizardProfile | undefined> {
  const db = await getDB();
  return db.get('wizardProfile', 'current');
}

export async function clearWizardProfile(): Promise<void> {
  const db = await getDB();
  await db.delete('wizardProfile', 'current');
}

// Budgets
export async function saveBudgetCategory(budget: BudgetCategory): Promise<void> {
  const db = await getDB();
  await db.put('budgets', budget);
  await afterBoardMutation('budgets', budget.category);
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
  await afterBoardMutation('bills', bill.id);
}

export async function updateBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.put('bills', bill);
  await afterBoardMutation('bills', bill.id);
}

export async function deleteBill(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bills', id);
  await afterBoardMutation('bills', id);
}

export async function getAllBills(): Promise<Bill[]> {
  const db = await getDB();
  return db.getAll('bills');
}

// Savings Goals
export async function addSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.add('savingsGoals', goal);
  await afterBoardMutation('savingsGoals', goal.id);
}

export async function updateSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.put('savingsGoals', goal);
  await afterBoardMutation('savingsGoals', goal.id);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('savingsGoals', id);
  await afterBoardMutation('savingsGoals', id);
}

export async function getAllSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDB();
  return db.getAll('savingsGoals');
}

// Debts
export async function addDebt(debt: Debt): Promise<void> {
  const db = await getDB();
  await db.add('debts', debt);
  await afterBoardMutation('debts', debt.id);
}

export async function updateDebt(debt: Debt): Promise<void> {
  const db = await getDB();
  await db.put('debts', debt);
  await afterBoardMutation('debts', debt.id);
}

export async function deleteDebt(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('debts', id);
  await afterBoardMutation('debts', id);
}

export async function getAllDebts(): Promise<Debt[]> {
  const db = await getDB();
  return db.getAll('debts');
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

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const stores = [
    'wizardProfile', 'expenses', 'budgets', 'bills', 'savingsGoals',
    'netWorthSnapshots', 'debts', 'criticalExpenseCommitments', 'newsCache',
    'locationCache', 'settings',
    'accountsData', 'localAccounts', 'bbMeta',
  ] as const;
  const tx = db.transaction(stores, 'readwrite');
  for (const store of stores) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}

export async function clearAllUserData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(USER_DATA_STORES, 'readwrite');
  for (const store of USER_DATA_STORES) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Re-export store modules
export * from './stores/expenses-store';
export * from './stores/snapshots-store';
export * from './stores/accounts-store';
