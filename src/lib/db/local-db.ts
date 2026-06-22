// lib/db/local-db.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { 
  WizardProfile, 
  ExpenseEntry, 
  BudgetCategory, 
  Bill, 
  SavingsGoal, 
  NetWorthSnapshot, 
  Debt, 
  CriticalExpenseCommitment,
  NewsItem,
  LocationCache,
  ExpenseCategory
} from '@/lib/types/budget';

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
}

export async function updateExpense(expense: ExpenseEntry): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
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
}

export async function updateBill(bill: Bill): Promise<void> {
  const db = await getDB();
  await db.put('bills', bill);
}

export async function deleteBill(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bills', id);
}

export async function getAllBills(): Promise<Bill[]> {
  const db = await getDB();
  return db.getAll('bills');
}

// Savings Goals
export async function addSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.add('savingsGoals', goal);
}

export async function updateSavingsGoal(goal: SavingsGoal): Promise<void> {
  const db = await getDB();
  await db.put('savingsGoals', goal);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('savingsGoals', id);
}

export async function getAllSavingsGoals(): Promise<SavingsGoal[]> {
  const db = await getDB();
  return db.getAll('savingsGoals');
}

// Net Worth Snapshots
export async function saveNetWorthSnapshot(snapshot: NetWorthSnapshot): Promise<void> {
  const db = await getDB();
  await db.put('netWorthSnapshots', snapshot);
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
}

export async function updateDebt(debt: Debt): Promise<void> {
  const db = await getDB();
  await db.put('debts', debt);
}

export async function deleteDebt(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('debts', id);
}

export async function getAllDebts(): Promise<Debt[]> {
  const db = await getDB();
  return db.getAll('debts');
}

// Critical Expense Commitments
export async function saveCriticalExpenseCommitment(commitment: CriticalExpenseCommitment): Promise<void> {
  const db = await getDB();
  await db.put('criticalExpenseCommitments', commitment);
}

export async function getCriticalExpenseCommitment(month: string): Promise<CriticalExpenseCommitment | undefined> {
  const db = await getDB();
  return db.get('criticalExpenseCommitments', month);
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

// Utility: Clear all data (for reset)
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

// Utility: Generate UUID
export function generateId(): string {
  return crypto.randomUUID();
}