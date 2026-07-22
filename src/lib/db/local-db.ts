// lib/db/local-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  WizardProfile, 
  ExpenseEntry, 
  IncomeEntry,
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
  incomes: {
    key: string;
    value: IncomeEntry;
    indexes: { 'by-date': string; 'by-category': string; 'by-frequency': string };
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
    upgrade(db, oldVersion, newVersion) {
      if (!db.objectStoreNames.contains('wizardProfile')) db.createObjectStore('wizardProfile');
      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-date', 'date');
        expenseStore.createIndex('by-category', 'category');
        expenseStore.createIndex('by-recurring', 'recurringId');
      }
      if (!db.objectStoreNames.contains('incomes')) {
        const incomeStore = db.createObjectStore('incomes', { keyPath: 'id' });
        incomeStore.createIndex('by-date', 'date');
        incomeStore.createIndex('by-category', 'category');
        incomeStore.createIndex('by-frequency', 'frequency');
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

      // Version-specific migrations
      if (oldVersion > 0 && oldVersion < 3) {
        console.log(`[Storage] Migrating database from version ${oldVersion} to ${newVersion}`);
      }
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

// Record a specific timestamp (used when applying a remote record so the
// local write-clock reflects the record's true last-modified time, not "now").
export async function recordLocalWriteAt(store: string, key: string, ts: number): Promise<void> {
  try {
    const db = await getDB();
    await db.put('localWrites', ts, writeKey(store, key));
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
  'incomes',
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
    'wizardProfile', 'expenses', 'incomes', 'budgets', 'bills', 'savingsGoals',
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

// Storage Quota and Persistence helpers
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persisted storage status: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('Failed to request persistent storage:', e);
    }
  }
  return false;
}

export async function getStorageEstimate(): Promise<{ persisted: boolean; usage: number; quota: number }> {
  if (typeof window !== 'undefined' && navigator.storage) {
    try {
      const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      const estimate = navigator.storage.estimate ? await navigator.storage.estimate() : { usage: 0, quota: 0 };
      return {
        persisted,
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      };
    } catch {
      return { persisted: false, usage: 0, quota: 0 };
    }
  }
  return { persisted: false, usage: 0, quota: 0 };
}

// Rolling local checkpoints
export async function createLocalCheckpoint(label: string): Promise<void> {
  try {
    const db = await getDB();
    const backup: Record<string, unknown> = {};
    for (const store of USER_DATA_STORES) {
      backup[store] = await db.getAll(store);
    }
    const checkpointData = {
      label,
      timestamp: Date.now(),
      backup,
    };
    
    const existingStr = await db.get('bbMeta', 'checkpoints');
    const checkpointsList = existingStr ? JSON.parse(existingStr) : [];
    checkpointsList.unshift(checkpointData);
    
    if (checkpointsList.length > 3) {
      checkpointsList.pop();
    }
    
    await db.put('bbMeta', JSON.stringify(checkpointsList), 'checkpoints');
    console.log(`[Storage] Local checkpoint created: ${label}`);
  } catch (err) {
    console.error('Failed to create local checkpoint:', err);
  }
}

interface CheckpointItem {
  label: string;
  timestamp: number;
  backup: Record<string, unknown>;
}

export async function getLocalCheckpoints(): Promise<{ label: string; timestamp: number }[]> {
  try {
    const db = await getDB();
    const existingStr = await db.get('bbMeta', 'checkpoints');
    if (!existingStr) return [];
    const checkpointsList = JSON.parse(existingStr) as CheckpointItem[];
    return checkpointsList.map((c) => ({ label: c.label, timestamp: c.timestamp }));
  } catch {
    return [];
  }
}

export async function restoreCheckpoint(timestamp: number): Promise<boolean> {
  try {
    const db = await getDB();
    const existingStr = await db.get('bbMeta', 'checkpoints');
    if (!existingStr) return false;
    const checkpointsList = JSON.parse(existingStr) as CheckpointItem[];
    const checkpoint = checkpointsList.find((c) => c.timestamp === timestamp);
    if (!checkpoint) return false;

    // Clear existing stores
    const tx = db.transaction(USER_DATA_STORES, 'readwrite');
    for (const store of USER_DATA_STORES) {
      await tx.objectStore(store).clear();
    }
    await tx.done;

    // Restore data from checkpoint
    const putDb = db as unknown as { put: (store: string, val: unknown, key?: string) => Promise<unknown> };
    for (const [store, items] of Object.entries(checkpoint.backup)) {
      if (!USER_DATA_STORES.includes(store as typeof USER_DATA_STORES[number])) continue;
      if (Array.isArray(items)) {
        for (const item of items) {
          // wizardProfile & settings have no keyPath; restore under their
          // fixed 'current' key so the app (which only reads 'current') sees them.
          if (
            (store === 'wizardProfile' || store === 'settings') &&
            item && typeof item === 'object'
          ) {
            await putDb.put(store, item, 'current');
          } else {
            await putDb.put(store, item);
          }
        }
      }
    }
    console.log(`[Storage] Local checkpoint restored: ${checkpoint.label}`);
    return true;
  } catch (err) {
    console.error('Failed to restore checkpoint:', err);
    return false;
  }
}

// Database Health Audit & Repair
export async function auditAndRepairDatabase(): Promise<{ status: 'healthy' | 'repaired' | 'failed'; logs: string[] }> {
  const logs: string[] = [];
  try {
    const db = await getDB();
    logs.push('Starting comprehensive database health audit...');
    
    const budgets = await db.getAll('budgets');
    logs.push(`Found ${budgets.length} budgets.`);
    
    const expenses = await db.getAll('expenses');
    logs.push(`Found ${expenses.length} expenses.`);

    const incomes = await db.getAll('incomes');
    logs.push(`Found ${incomes.length} income entries.`);

    const bills = await db.getAll('bills');
    logs.push(`Found ${bills.length} bills.`);

    const savingsGoals = await db.getAll('savingsGoals');
    logs.push(`Found ${savingsGoals.length} savings goals.`);

    const debts = await db.getAll('debts');
    logs.push(`Found ${debts.length} debts.`);
    
    let repairedCount = 0;

    // 1. Audit Expenses
    for (const exp of expenses) {
      let patched = false;
      if (typeof exp.amount !== 'number' || isNaN(exp.amount) || exp.amount < 0) {
        exp.amount = Math.max(0, Number(exp.amount) || 0);
        patched = true;
      }
      if (!exp.category) {
        exp.category = 'other';
        patched = true;
      }
      if (patched) {
        await db.put('expenses', exp);
        repairedCount++;
      }
    }

    // 2. Audit Incomes
    for (const inc of incomes) {
      let patched = false;
      if (typeof inc.amount !== 'number' || isNaN(inc.amount) || inc.amount < 0) {
        inc.amount = Math.max(0, Number(inc.amount) || 0);
        patched = true;
      }
      if (!inc.frequency) {
        inc.frequency = 'monthly';
        patched = true;
      }
      if (patched) {
        await db.put('incomes', inc);
        repairedCount++;
      }
    }

    // 3. Audit Bills
    for (const bill of bills) {
      let patched = false;
      if (typeof bill.amount !== 'number' || isNaN(bill.amount) || bill.amount < 0) {
        bill.amount = Math.max(0, Number(bill.amount) || 0);
        patched = true;
      }
      if (typeof bill.dueDay !== 'number' || isNaN(bill.dueDay) || bill.dueDay < 1 || bill.dueDay > 31) {
        bill.dueDay = Math.min(31, Math.max(1, Number(bill.dueDay) || 1));
        patched = true;
      }
      if (patched) {
        await db.put('bills', bill);
        repairedCount++;
      }
    }

    // 4. Audit Savings Goals
    for (const goal of savingsGoals) {
      let patched = false;
      if (typeof goal.targetAmount !== 'number' || isNaN(goal.targetAmount) || goal.targetAmount <= 0) {
        goal.targetAmount = Math.max(1000, Number(goal.targetAmount) || 1000);
        patched = true;
      }
      if (typeof goal.currentAmount !== 'number' || isNaN(goal.currentAmount) || goal.currentAmount < 0) {
        goal.currentAmount = Math.max(0, Number(goal.currentAmount) || 0);
        patched = true;
      }
      if (patched) {
        await db.put('savingsGoals', goal);
        repairedCount++;
      }
    }

    // 5. Audit Debts
    for (const debt of debts) {
      let patched = false;
      if (typeof debt.balance !== 'number' || isNaN(debt.balance) || debt.balance < 0) {
        debt.balance = Math.max(0, Number(debt.balance) || 0);
        patched = true;
      }
      if (typeof debt.minimumPayment !== 'number' || isNaN(debt.minimumPayment) || debt.minimumPayment < 0) {
        debt.minimumPayment = Math.max(0, Number(debt.minimumPayment) || 0);
        patched = true;
      }
      if (patched) {
        await db.put('debts', debt);
        repairedCount++;
      }
    }
    
    if (repairedCount > 0) {
      logs.push(`Repaired ${repairedCount} corrupted or invalid records across financial stores.`);
      return { status: 'repaired', logs };
    }
    
    logs.push('All database stores are healthy.');
    return { status: 'healthy', logs };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    logs.push(`Audit failed: ${errMessage}`);
    return { status: 'failed', logs };
  }
}

// Re-export store modules
export * from './stores/expenses-store';
export * from './stores/snapshots-store';
export * from './stores/accounts-store';
export * from './stores/incomes-store';

