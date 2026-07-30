// hooks/use-local-db.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  WizardProfile, 
  ExpenseEntry, 
  IncomeEntry,
  BudgetCategory, 
  Bill, 
  SavingsGoal, 
  CriticalExpenseCommitment,
  ExpenseCategory,
  NetWorthSnapshot,
  Debt 
} from '@/lib/types/budget';

type Asset = NetWorthSnapshot['assets'][number];
type Liability = NetWorthSnapshot['liabilities'][number];

export type { Asset, Liability };
import { 
  saveWizardProfile, 
  getWizardProfile, 
  clearWizardProfile,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  getExpensesByCategory,
  addIncome,
  updateIncome,
  deleteIncome,
  getIncomes,
  saveBudgetCategory,
  getBudgetCategory,
  getAllBudgets,
  addBill,
  updateBill,
  deleteBill,
  getAllBills,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  getAllSavingsGoals,
  saveNetWorthSnapshot,
  getLatestNetWorthSnapshot,
  addDebt,
  updateDebt,
  deleteDebt,
  getAllDebts,
  saveCriticalExpenseCommitment,
  getCriticalExpenseCommitment,
  generateId,
} from '@/lib/db/local-db';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';

/**
 * Helper hook to register a window event listener that re-fetches local DB state
 * whenever the local board data changes (e.g. from partner sync pulls or account switches).
 */
function useDatabaseListener(callback: () => void) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(BOARD_CHANGED_EVENT, callback);
    return () => window.removeEventListener(BOARD_CHANGED_EVENT, callback);
  }, [callback]);
}

/**
 * Generic query hook for IndexedDB entities that manages state, loading,
 * unmount safety, and event-driven re-fetching.
 */
function useLocalDbQuery<T>(
  fetcher: () => Promise<T>,
  initialValue: T
): [T, boolean, () => void] {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    let mounted = true;
    fetcher()
      .then((result) => {
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetcher]);

  useEffect(() => {
    return reload();
  }, [reload]);

  useDatabaseListener(reload);

  return [data, loading, reload];
}

/** Helper to sort entities by ISO date descending */
function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
}

// Wizard Profile
export function useWizardProfile() {
  const fetcher = useCallback(async () => (await getWizardProfile()) ?? null, []);
  const [profile, loading, reload] = useLocalDbQuery(fetcher, null);

  const save = useCallback(async (newProfile: WizardProfile) => {
    await saveWizardProfile(newProfile);
    reload();
  }, [reload]);

  const clear = useCallback(async () => {
    await clearWizardProfile();
    reload();
  }, [reload]);

  return { profile, loading, save, clear };
}

// Expenses
export function useExpenses() {
  const fetcher = useCallback(async () => sortByDateDesc(await getExpenses()), []);
  const [expenses, loading, reload] = useLocalDbQuery<ExpenseEntry[]>(fetcher, []);

  const add = useCallback(async (expense: Omit<ExpenseEntry, 'id'>) => {
    const newExpense = { ...expense, id: generateId() };
    await addExpense(newExpense);
    reload();
  }, [reload]);

  const update = useCallback(async (expense: ExpenseEntry) => {
    await updateExpense(expense);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    reload();
  }, [reload]);

  const getByCategory = useCallback(async (category: ExpenseCategory) => {
    return getExpensesByCategory(category);
  }, []);

  return { expenses, loading, add, update, remove, getByCategory };
}

// Incomes
export function useIncomes() {
  const fetcher = useCallback(async () => sortByDateDesc(await getIncomes()), []);
  const [incomes, loading, reload] = useLocalDbQuery<IncomeEntry[]>(fetcher, []);

  const add = useCallback(async (income: Omit<IncomeEntry, 'id' | 'createdAt'>) => {
    const newIncome: IncomeEntry = {
      ...income,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await addIncome(newIncome);
    reload();
  }, [reload]);

  const update = useCallback(async (income: IncomeEntry) => {
    await updateIncome(income);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteIncome(id);
    reload();
  }, [reload]);

  return { incomes, loading, add, update, remove };
}

// Budgets
export function useBudgets() {
  const fetcher = useCallback(async () => getAllBudgets(), []);
  const [budgets, loading, reload] = useLocalDbQuery<BudgetCategory[]>(fetcher, []);

  const save = useCallback(async (budget: BudgetCategory) => {
    await saveBudgetCategory(budget);
    reload();
  }, [reload]);

  const get = useCallback(async (category: ExpenseCategory) => {
    return getBudgetCategory(category);
  }, []);

  return { budgets, loading, save, get };
}

// Bills
export function useBills() {
  const fetcher = useCallback(async () => getAllBills(), []);
  const [bills, loading, reload] = useLocalDbQuery<Bill[]>(fetcher, []);

  const add = useCallback(async (bill: Bill) => {
    await addBill(bill);
    reload();
  }, [reload]);

  const update = useCallback(async (bill: Bill) => {
    await updateBill(bill);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteBill(id);
    reload();
  }, [reload]);

  return { bills, loading, add, update, remove };
}

// Savings Goals
export function useSavingsGoals() {
  const fetcher = useCallback(async () => getAllSavingsGoals(), []);
  const [goals, loading, reload] = useLocalDbQuery<SavingsGoal[]>(fetcher, []);

  const add = useCallback(async (goal: SavingsGoal) => {
    await addSavingsGoal(goal);
    reload();
  }, [reload]);

  const update = useCallback(async (goal: SavingsGoal) => {
    await updateSavingsGoal(goal);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteSavingsGoal(id);
    reload();
  }, [reload]);

  return { goals, loading, add, update, remove };
}

// Critical Expense Commitments
export function useCriticalExpenseCommitment(month?: string) {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const fetcher = useCallback(async () => (await getCriticalExpenseCommitment(targetMonth)) ?? null, [targetMonth]);
  const [commitment, loading, reload] = useLocalDbQuery(fetcher, null);

  const save = useCallback(async (newCommitment: CriticalExpenseCommitment) => {
    await saveCriticalExpenseCommitment(newCommitment);
    reload();
  }, [reload]);

  return { commitment, loading, save };
}

// Net Worth
export function useNetWorth() {
  const fetcher = useCallback(async () => (await getLatestNetWorthSnapshot()) ?? null, []);
  const [snapshot, loading, reload] = useLocalDbQuery(fetcher, null);

  const addAsset = useCallback(async (asset: Asset) => {
    if (!snapshot) return;
    const newAssets = [...snapshot.assets, { ...asset, id: generateId() }];
    await saveNetWorthSnapshot({ ...snapshot, assets: newAssets });
    reload();
  }, [snapshot, reload]);

  const updateAsset = useCallback(async (asset: Asset) => {
    if (!snapshot) return;
    const newAssets = snapshot.assets.map(a => a.id === asset.id ? asset : a);
    await saveNetWorthSnapshot({ ...snapshot, assets: newAssets });
    reload();
  }, [snapshot, reload]);

  const removeAsset = useCallback(async (id: string) => {
    if (!snapshot) return;
    const newAssets = snapshot.assets.filter(a => a.id !== id);
    await saveNetWorthSnapshot({ ...snapshot, assets: newAssets });
    reload();
  }, [snapshot, reload]);

  const addLiability = useCallback(async (liability: Liability) => {
    if (!snapshot) return;
    const newLiabilities = [...snapshot.liabilities, { ...liability, id: generateId() }];
    await saveNetWorthSnapshot({ ...snapshot, liabilities: newLiabilities });
    reload();
  }, [snapshot, reload]);

  const updateLiability = useCallback(async (liability: Liability) => {
    if (!snapshot) return;
    const newLiabilities = snapshot.liabilities.map(l => l.id === liability.id ? liability : l);
    await saveNetWorthSnapshot({ ...snapshot, liabilities: newLiabilities });
    reload();
  }, [snapshot, reload]);

  const removeLiability = useCallback(async (id: string) => {
    if (!snapshot) return;
    const newLiabilities = snapshot.liabilities.filter(l => l.id !== id);
    await saveNetWorthSnapshot({ ...snapshot, liabilities: newLiabilities });
    reload();
  }, [snapshot, reload]);

  const totalAssets = snapshot?.assets.reduce((sum, a) => sum + a.value, 0) || 0;
  const totalLiabilities = snapshot?.liabilities.reduce((sum, l) => sum + l.value, 0) || 0;
  const netWorth = totalAssets - totalLiabilities;

  return { 
    snapshot, 
    loading, 
    addAsset, 
    updateAsset, 
    removeAsset, 
    addLiability, 
    updateLiability, 
    removeLiability,
    totalAssets,
    totalLiabilities,
    netWorth
  };
}

// Subscriptions
export function useSubscriptions() {
  const fetcher = useCallback(async () => {
    const allExpenses = await getExpenses();
    return allExpenses.filter(e => e.category === 'subscriptions' && e.isRecurring);
  }, []);
  const [subscriptions, loading, reload] = useLocalDbQuery<ExpenseEntry[]>(fetcher, []);

  const add = useCallback(async (sub: Omit<ExpenseEntry, 'id'>) => {
    const newSub = { ...sub, id: generateId(), category: 'subscriptions' as const, isRecurring: true };
    await addExpense(newSub);
    reload();
  }, [reload]);

  const update = useCallback(async (sub: ExpenseEntry) => {
    await updateExpense(sub);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    reload();
  }, [reload]);

  return { subscriptions, loading, add, update, remove };
}

// Emergency Fund
export function useEmergencyFund() {
  const fetcher = useCallback(async () => {
    const goals = await getAllSavingsGoals();
    const emergencyGoal = goals.find(g => g.category === 'emergency');
    return emergencyGoal 
      ? { targetAmount: emergencyGoal.targetAmount, currentAmount: emergencyGoal.currentAmount }
      : { targetAmount: 50000, currentAmount: 0 };
  }, []);
  const [fund, loading, reload] = useLocalDbQuery(fetcher, { targetAmount: 0, currentAmount: 0 });

  const update = useCallback(async (updates: { targetAmount?: number; currentAmount?: number }) => {
    const goals = await getAllSavingsGoals();
    const emergencyGoal = goals.find(g => g.category === 'emergency');
    
    if (!emergencyGoal) {
      const newGoal: SavingsGoal = {
        id: generateId(),
        name: 'Emergency Fund',
        targetAmount: updates.targetAmount || 50000,
        currentAmount: updates.currentAmount || 0,
        category: 'emergency',
      };
      await addSavingsGoal(newGoal);
    } else {
      const updatedGoal = { 
        ...emergencyGoal, 
        targetAmount: updates.targetAmount ?? emergencyGoal.targetAmount,
        currentAmount: updates.currentAmount ?? emergencyGoal.currentAmount
      };
      await updateSavingsGoal(updatedGoal);
    }
    reload();
  }, [reload]);

  return { fund, loading, update };
}

// Debt Payoff
export function useDebtPayoff() {
  const fetcher = useCallback(async () => getAllDebts(), []);
  const [debts, loading, reload] = useLocalDbQuery<Debt[]>(fetcher, []);

  const add = useCallback(async (debt: Debt) => {
    await addDebt(debt);
    reload();
  }, [reload]);

  const update = useCallback(async (debt: Debt) => {
    await updateDebt(debt);
    reload();
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    await deleteDebt(id);
    reload();
  }, [reload]);

  return { debts, loading, add, update, remove };
}

// Cash Flow Forecast
export function useCashFlowForecast() {
  const fetcher = useCallback(async () => {
    const budgets = await getAllBudgets();
    const monthlyIncome = budgets.find(b => b.category === 'savings')?.monthlyLimit || 50000;
    const monthlyExpenses = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0) - (budgets.find(b => b.category === 'savings')?.monthlyLimit || 0);
    const monthlyNet = monthlyIncome - monthlyExpenses;

    return { 
      thirtyDays: monthlyNet, 
      sixtyDays: monthlyNet * 2, 
      ninetyDays: monthlyNet * 3 
    };
  }, []);

  const [forecast, loading] = useLocalDbQuery(fetcher, { thirtyDays: 0, sixtyDays: 0, ninetyDays: 0 });

  return { forecast, loading };
}