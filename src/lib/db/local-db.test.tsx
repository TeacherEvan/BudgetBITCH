// lib/db/local-db.test.ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  serializeBoard,
  replaceBoardData,
  saveWizardProfile,
  addExpense,
  addExpensesBulk,
  getWizardProfile,
  getExpenses,
  clearAllData,
  clearAllUserData,
  USER_DATA_STORES,
  saveSettings,
  addNewsItem,
  saveLocationCache,
  getNewsByLocale,
  getLocationCache,
  saveBudgetCategory,
  getBudgetCategory,
  getAllBudgets,
  addBill,
  updateBill,
  deleteBill,
  getAllBills,
  addDebt,
  updateDebt,
  deleteDebt,
  getAllDebts,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  getAllSavingsGoals,
  saveNetWorthSnapshot,
  getLatestNetWorthSnapshot,
  saveCriticalExpenseCommitment,
  getCriticalExpenseCommitment,
  deleteCriticalExpenseCommitment,
  applyRemoteBoard,
  serializeBoardForSync,
  deleteExpense,
  recordLocalWriteAt,
  getLocalWrite,
} from './local-db';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';
import type { WizardProfile, ExpenseEntry, NewsItem } from '@/lib/types/budget';

function makeProfile(): WizardProfile {
  return {
    completed: true,
    completedAt: new Date().toISOString(),
    version: 1,
    locale: 'en',
    answers: {
      income: 50000,
      rent: 8000,
      transport: 2000,
      phoneInternet: 1000,
      subscriptions: 500,
      entertainment: 1500,
      healthcare: 1000,
      savingsRatePct: 10,
      riskTolerance: 'medium',
      locationConsent: false,
      currency: 'THB',
    },
  };
}

function makeExpense(): ExpenseEntry {
  return {
    id: 'exp-1',
    date: '2026-07-19',
    category: 'food',
    merchant: 'Test',
    amount: 100,
    source: 'manual',
  };
}

describe('shared board serialize/replace', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('serializeBoard returns empty stores when db is empty', async () => {
    const board = await serializeBoard();
    expect(board.wizardProfile).toBeNull();
    expect(board.expenses).toEqual([]);
    expect(board.budgets).toEqual([]);
    expect(board.bills).toEqual([]);
    expect(board.savingsGoals).toEqual([]);
    expect(board.netWorthSnapshots).toEqual([]);
    expect(board.debts).toEqual([]);
    expect(board.criticalExpenseCommitments).toEqual([]);
  });

  it('round-trips profile + expense through serialize -> replace', async () => {
    const profile = makeProfile();
    const expense = makeExpense();
    await saveWizardProfile(profile);
    await addExpense(expense);

    const board = await serializeBoard();
    expect(board.wizardProfile?.answers.income).toBe(50000);
    expect(board.expenses).toHaveLength(1);

    // Wipe and restore from snapshot
    await clearAllData();
    expect(await getWizardProfile()).toBeUndefined();

    await replaceBoardData(board);

    const restored = await getWizardProfile();
    expect(restored?.answers.income).toBe(50000);
    expect(await getExpenses()).toHaveLength(1);
  });

  it('replaceBoardData MERGES (preserves local records absent from the snapshot)', async () => {
    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense());
    await addExpense({ ...makeExpense(), id: 'exp-2' });
    expect((await getExpenses())).toHaveLength(2);

    // Remote snapshot only knows about one of the two local expenses.
    const partial = await serializeBoard();
    partial.expenses = partial.expenses.filter(e => e.id === 'exp-1');

    await replaceBoardData(partial);

    // The local-only expense (exp-2) must survive the merge.
    const remaining = await getExpenses();
    expect(remaining).toHaveLength(2);
    expect(remaining.map(e => e.id).sort()).toEqual(['exp-1', 'exp-2']);
  });

  it('regression: a locally-added expense survives a shared-board pull (merge, not clear)', async () => {
    // Simulates the sync race: user adds exp-3 locally, a pull brings a snapshot
    // that predates it (no exp-3). The pull must NOT delete exp-3.
    await addExpense({ ...makeExpense(), id: 'exp-old' });

    const remoteSnapshot = await serializeBoard(); // board as partner sees it (no exp-3 yet)
    remoteSnapshot.expenses = remoteSnapshot.expenses.filter(e => e.id === 'exp-old');

    // Local user adds a new expense after the snapshot was taken.
    await addExpense({ ...makeExpense(), id: 'exp-3' });
    expect((await getExpenses()).map(e => e.id)).toContain('exp-3');

    // Partner's board arrives (pull) — only knows exp-old.
    await replaceBoardData(remoteSnapshot);

    const after = await getExpenses();
    expect(after.map(e => e.id).sort()).toEqual(['exp-3', 'exp-old']);
  });

  it('replaceBoardData emits a board-changed event with source switch', async () => {
    const handler = vi.fn();
    window.addEventListener(BOARD_CHANGED_EVENT, handler);

    const board = await serializeBoard();
    await replaceBoardData(board);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail?.source).toBe('switch');
    window.removeEventListener(BOARD_CHANGED_EVENT, handler);
  });

  it('mutating functions emit a board-changed event', async () => {
    const handler = vi.fn();
    window.addEventListener(BOARD_CHANGED_EVENT, handler);

    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense());

    expect(handler).toHaveBeenCalledTimes(2);
    window.removeEventListener(BOARD_CHANGED_EVENT, handler);
  });

  it('addExpensesBulk persists entries atomically, stamps localWrites and emits board-changed once', async () => {
    const handler = vi.fn();
    window.addEventListener(BOARD_CHANGED_EVENT, handler);

    const batch = [
      { ...makeExpense(), id: 'bulk-1', amount: 50 },
      { ...makeExpense(), id: 'bulk-2', amount: 150 },
      { ...makeExpense(), id: 'bulk-3', amount: 250 },
    ];

    await addExpensesBulk(batch);

    const after = await getExpenses();
    expect(after).toHaveLength(3);
    expect(after.map((e) => e.id).sort()).toEqual(['bulk-1', 'bulk-2', 'bulk-3']);

    // Emitted exactly once for the whole bulk operation
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(BOARD_CHANGED_EVENT, handler);
  });

  it('serializeBoardForSync emits LWW tombstones for deleted records and applyRemoteBoard applies tombstones', async () => {
    // 1. Add an expense and serialize
    const exp: ExpenseEntry = {
      id: 'exp-del-1',
      date: '2026-07-19',
      category: 'food',
      merchant: 'Test Del',
      amount: 50,
      source: 'manual',
    };
    await addExpense(exp);
    const initialSync = await serializeBoardForSync();
    expect(initialSync['expenses:exp-del-1']).toBeDefined();
    expect(initialSync['expenses:exp-del-1'].value).toBeDefined();
    expect(initialSync['expenses:exp-del-1'].deleted).toBeUndefined();

    // 2. Delete the expense locally
    await deleteExpense('exp-del-1');
    expect(await getExpenses()).toHaveLength(0);

    // 3. Next serializeBoardForSync emits tombstone with deleted:true and value:null
    const syncAfterDelete = await serializeBoardForSync();
    expect(syncAfterDelete['expenses:exp-del-1']).toMatchObject({
      value: null,
      deleted: true,
    });
    expect(syncAfterDelete['expenses:exp-del-1'].updatedAt).toBeGreaterThan(0);

    // 4. Test applyRemoteBoard applying a tombstone to remove an existing record
    const exp2: ExpenseEntry = {
      id: 'exp-del-2',
      date: '2026-07-19',
      category: 'food',
      merchant: 'Test Del 2',
      amount: 100,
      source: 'manual',
    };
    await addExpense(exp2);
    expect(await getExpenses()).toHaveLength(1);

    const now = Date.now();
    await applyRemoteBoard({
      'expenses:exp-del-2': {
        value: null,
        updatedAt: now + 5000,
        deleted: true,
      },
    });

    // Verified: local record removed by remote tombstone
    expect(await getExpenses()).toHaveLength(0);
  });
});

describe('clearAllUserData (focused reset)', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('USER_DATA_STORES lists exactly the 9 user-data stores', () => {
    expect([...USER_DATA_STORES].sort()).toEqual([
      'bills',
      'budgets',
      'criticalExpenseCommitments',
      'debts',
      'expenses',
      'incomes',
      'netWorthSnapshots',
      'savingsGoals',
      'wizardProfile',
    ]);
  });

  it('clears user data but preserves settings, newsCache, and locationCache', async () => {
    await saveWizardProfile(makeProfile());
    await addExpense(makeExpense());
    await saveSettings({
      preferredLocale: 'en',
      voiceSettings: { enabled: false, rate: 1, pitch: 1 },
      privacyDisclaimerAccepted: true,
    });
    const news: NewsItem = {
      link: 'https://example.com/n',
      title: 'Hobby',
      source: 'test',
      locale: 'en',
      category: 'finance',
      pubDate: new Date().toISOString(),
    };
    await addNewsItem(news);
    await saveLocationCache({ lat: 13.7, lon: 100.5, city: 'Bangkok', province: 'Bangkok', country: 'TH', timestamp: Date.now(), timezone: 'Asia/Bangkok' });

    await clearAllUserData();

    expect(await getWizardProfile()).toBeUndefined();
    expect(await getExpenses()).toHaveLength(0);
    // preserved
    expect(await getNewsByLocale('en')).toHaveLength(1);
    expect(await getLocationCache()).toBeDefined();
  });
});

describe('budgets CRUD', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('saves and reads a budget category', async () => {
    const budget = { category: 'food' as const, monthlyLimit: 5000, alertAtPct: 80 };
    await saveBudgetCategory(budget);
    expect(await getBudgetCategory('food')).toEqual(budget);
    expect(await getAllBudgets()).toHaveLength(1);
  });

  it('overwrites an existing budget category by key', async () => {
    await saveBudgetCategory({ category: 'food' as const, monthlyLimit: 5000, alertAtPct: 80 });
    await saveBudgetCategory({ category: 'food' as const, monthlyLimit: 8000, alertAtPct: 90 });
    const all = await getAllBudgets();
    expect(all).toHaveLength(1);
    expect(all[0].monthlyLimit).toBe(8000);
  });
});

describe('bills CRUD', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  const makeBill = (id: string) => ({
    id,
    name: 'Electricity',
    amount: 1200,
    dueDay: 15,
    category: 'utilities' as const,
    isActive: true,
    reminderDaysBefore: 3,
  });

  it('adds, updates, and deletes a bill', async () => {
    await addBill(makeBill('b1'));
    expect(await getAllBills()).toHaveLength(1);

    await updateBill({ ...makeBill('b1'), amount: 1500 });
    const updated = await getAllBills();
    expect(updated).toHaveLength(1);
    expect(updated[0].amount).toBe(1500);

    await deleteBill('b1');
    expect(await getAllBills()).toHaveLength(0);
  });
});

describe('debts CRUD', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  const makeDebt = (id: string) => ({
    id,
    name: 'CC',
    balance: 50000,
    apr: 18,
    minimumPayment: 2000,
    type: 'credit_card' as const,
  });

  it('adds a debt and lists all', async () => {
    const debt = makeDebt('d1');
    await addDebt(debt);
    expect(await getAllDebts()).toEqual([debt]);
  });

  it('updates and deletes a debt', async () => {
    await addDebt(makeDebt('d1'));
    await updateDebt({ ...makeDebt('d1'), balance: 30000 });
    expect((await getAllDebts())[0].balance).toBe(30000);

    await deleteDebt('d1');
    expect(await getAllDebts()).toHaveLength(0);
  });
});

describe('savings goals CRUD', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  const makeGoal = (id: string) => ({
    id,
    name: 'Emergency',
    targetAmount: 100000,
    currentAmount: 25000,
    category: 'emergency' as const,
  });

  it('adds, updates, and deletes a savings goal', async () => {
    await addSavingsGoal(makeGoal('g1'));
    expect(await getAllSavingsGoals()).toHaveLength(1);

    await updateSavingsGoal({ ...makeGoal('g1'), currentAmount: 50000 });
    expect((await getAllSavingsGoals())[0].currentAmount).toBe(50000);

    await deleteSavingsGoal('g1');
    expect(await getAllSavingsGoals()).toHaveLength(0);
  });
});

describe('net worth snapshots', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  const snap = (date: string) => ({
    date,
    assets: [{ id: 'a1', name: 'Cash', value: 100000, type: 'cash' as const }],
    liabilities: [],
    netWorth: 100000,
  });

  it('saves and returns the latest snapshot by date', async () => {
    await saveNetWorthSnapshot(snap('2026-01-01'));
    await saveNetWorthSnapshot(snap('2026-06-01'));
    const latest = await getLatestNetWorthSnapshot();
    expect(latest?.date).toBe('2026-06-01');
    expect(latest?.netWorth).toBe(100000);
  });

  it('returns undefined when no snapshots exist', async () => {
    expect(await getLatestNetWorthSnapshot()).toBeUndefined();
  });
});

describe('critical expense commitments', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  const commitment = (month: string) => ({
    month,
    expenseKey: 'coffee' as const,
    estimatedMonthlyCost: 3000,
    committedAt: new Date().toISOString(),
    status: 'active' as const,
    compoundProjection: { oneYear: 36000, fiveYears: 180000, tenYears: 360000 },
  });

  it('saves, reads, and deletes a commitment by month key', async () => {
    await saveCriticalExpenseCommitment(commitment('2026-07'));
    expect((await getCriticalExpenseCommitment('2026-07'))?.estimatedMonthlyCost).toBe(3000);

    // keyPath store — same month overwrites
    await saveCriticalExpenseCommitment({ ...commitment('2026-07'), estimatedMonthlyCost: 4000 });
    expect((await getCriticalExpenseCommitment('2026-07'))?.estimatedMonthlyCost).toBe(4000);

    await deleteCriticalExpenseCommitment('2026-07');
    expect(await getCriticalExpenseCommitment('2026-07')).toBeUndefined();
  });
});

describe('applyRemoteBoard LWW conflict resolution', () => {
  beforeEach(async () => {
    await clearAllData();
    localStorage.clear();
  });

  it('overwrites local record when remote updatedAt is greater than localTs', async () => {
    // 1. Local expense written at timestamp 1000
    await addExpense({
      id: 'exp-conflict-1',
      date: '2026-08-01',
      category: 'food',
      merchant: 'Local Supermarket',
      amount: 40,
      source: 'manual',
    });
    await recordLocalWriteAt('expenses', 'exp-conflict-1', 1000);

    // 2. Incoming remote map with newer timestamp 2000
    const remoteMap = {
      'expenses:exp-conflict-1': {
        value: {
          id: 'exp-conflict-1',
          date: '2026-08-01',
          category: 'food',
          merchant: 'Remote Supermarket',
          amount: 45,
          source: 'manual',
        },
        updatedAt: 2000,
      },
    };

    await applyRemoteBoard(remoteMap);

    const expenses = await getExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0].merchant).toBe('Remote Supermarket');
    expect(expenses[0].amount).toBe(45);
    expect(await getLocalWrite('expenses', 'exp-conflict-1')).toBe(2000);
  });

  it('rejects remote record when remote updatedAt is less than or equal to localTs', async () => {
    // 1. Local expense written at timestamp 3000
    await addExpense({
      id: 'exp-conflict-2',
      date: '2026-08-01',
      category: 'food',
      merchant: 'Local Bistro',
      amount: 100,
      source: 'manual',
    });
    await recordLocalWriteAt('expenses', 'exp-conflict-2', 3000);

    // 2. Incoming stale/equal remote record with timestamp 3000
    const staleMap = {
      'expenses:exp-conflict-2': {
        value: {
          id: 'exp-conflict-2',
          date: '2026-08-01',
          category: 'food',
          merchant: 'Stale Bistro',
          amount: 80,
          source: 'manual',
        },
        updatedAt: 3000,
      },
    };

    await applyRemoteBoard(staleMap);

    // Local record and local clock must be preserved
    const expenses = await getExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0].merchant).toBe('Local Bistro');
    expect(expenses[0].amount).toBe(100);
    expect(await getLocalWrite('expenses', 'exp-conflict-2')).toBe(3000);
  });
});
