// hooks/use-local-db.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  WizardProfile, 
  ExpenseEntry, 
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

/**
 * Hook for local IndexedDB operations with React state sync
 */

// Wizard Profile
export function useWizardProfile() {
  const [profile, setProfile] = useState<WizardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getWizardProfile().then(p => {
      if (mounted) {
        if (p) {
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const save = useCallback(async (newProfile: WizardProfile) => {
    await saveWizardProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const clear = useCallback(async () => {
    await clearWizardProfile();
    setProfile(null);
  }, []);

  return { profile, loading, save, clear };
}

// Expenses
export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getExpenses().then(e => {
      if (mounted) {
        setExpenses(e.sort((a, b) => b.date.localeCompare(a.date)));
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (expense: Omit<ExpenseEntry, 'id'>) => {
    const newExpense = { ...expense, id: generateId() };
    await addExpense(newExpense);
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const update = useCallback(async (expense: ExpenseEntry) => {
    await updateExpense(expense);
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e)
      .sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const getByCategory = useCallback(async (category: ExpenseCategory) => {
    return getExpensesByCategory(category);
  }, []);

  return { expenses, loading, add, update, remove, getByCategory };
}

// Budgets
export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAllBudgets().then(b => {
      if (mounted) {
        setBudgets(b);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const save = useCallback(async (budget: BudgetCategory) => {
    await saveBudgetCategory(budget);
    setBudgets(prev => {
      const exists = prev.find(b => b.category === budget.category);
      if (exists) {
        return prev.map(b => b.category === budget.category ? budget : b);
      }
      return [...prev, budget];
    });
  }, []);

  const get = useCallback(async (category: ExpenseCategory) => {
    return getBudgetCategory(category);
  }, []);

  return { budgets, loading, save, get };
}

// Bills
export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAllBills().then(b => {
      if (mounted) {
        setBills(b);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (bill: Bill) => {
    await addBill(bill);
    setBills(prev => [...prev, bill]);
  }, []);

  const update = useCallback(async (bill: Bill) => {
    await updateBill(bill);
    setBills(prev => prev.map(b => b.id === bill.id ? bill : b));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteBill(id);
    setBills(prev => prev.filter(b => b.id !== id));
  }, []);

  return { bills, loading, add, update, remove };
}

// Savings Goals
export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAllSavingsGoals().then(g => {
      if (mounted) {
        setGoals(g);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (goal: SavingsGoal) => {
    await addSavingsGoal(goal);
    setGoals(prev => [...prev, goal]);
  }, []);

  const update = useCallback(async (goal: SavingsGoal) => {
    await updateSavingsGoal(goal);
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteSavingsGoal(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  return { goals, loading, add, update, remove };
}

// Critical Expense Commitments
export function useCriticalExpenseCommitment(month?: string) {
  const [commitment, setCommitment] = useState<CriticalExpenseCommitment | null>(null);
  const [loading, setLoading] = useState(true);

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  useEffect(() => {
    let mounted = true;
    getCriticalExpenseCommitment(targetMonth).then(c => {
      if (mounted) {
        setCommitment(c ?? null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [targetMonth]);

  const save = useCallback(async (newCommitment: CriticalExpenseCommitment) => {
    await saveCriticalExpenseCommitment(newCommitment);
    setCommitment(newCommitment);
  }, []);

  return { commitment, loading, save };
}

// Net Worth
export function useNetWorth() {
  const [snapshot, setSnapshot] = useState<NetWorthSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getLatestNetWorthSnapshot().then(s => {
      if (mounted) {
        setSnapshot(s ?? null);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const addAsset = useCallback(async (asset: Asset) => {
    if (!snapshot) return;
    const newAssets = [...snapshot.assets, { ...asset, id: generateId() }];
    const newSnapshot = { ...snapshot, assets: newAssets };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const updateAsset = useCallback(async (asset: Asset) => {
    if (!snapshot) return;
    const newAssets = snapshot.assets.map(a => a.id === asset.id ? asset : a);
    const newSnapshot = { ...snapshot, assets: newAssets };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const removeAsset = useCallback(async (id: string) => {
    if (!snapshot) return;
    const newAssets = snapshot.assets.filter(a => a.id !== id);
    const newSnapshot = { ...snapshot, assets: newAssets };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const addLiability = useCallback(async (liability: Liability) => {
    if (!snapshot) return;
    const newLiabilities = [...snapshot.liabilities, { ...liability, id: generateId() }];
    const newSnapshot = { ...snapshot, liabilities: newLiabilities };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const updateLiability = useCallback(async (liability: Liability) => {
    if (!snapshot) return;
    const newLiabilities = snapshot.liabilities.map(l => l.id === liability.id ? liability : l);
    const newSnapshot = { ...snapshot, liabilities: newLiabilities };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

  const removeLiability = useCallback(async (id: string) => {
    if (!snapshot) return;
    const newLiabilities = snapshot.liabilities.filter(l => l.id !== id);
    const newSnapshot = { ...snapshot, liabilities: newLiabilities };
    await saveNetWorthSnapshot(newSnapshot);
    setSnapshot(newSnapshot);
  }, [snapshot]);

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
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadSubscriptions = async () => {
      const allExpenses = await getExpenses();
      const subs = allExpenses.filter(e => e.category === 'subscriptions' && e.isRecurring);
      if (mounted) {
        setSubscriptions(subs);
        setLoading(false);
      }
    };
    loadSubscriptions();
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (sub: any) => {
    const newSub = { ...sub, id: generateId(), category: 'subscriptions', isRecurring: true };
    await addExpense(newSub);
    setSubscriptions(prev => [newSub, ...prev]);
  }, []);

  const update = useCallback(async (sub: any) => {
    await updateExpense(sub);
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  }, []);

  return { subscriptions, loading, add, update, remove };
}

// Emergency Fund
export function useEmergencyFund() {
  const [fund, setFund] = useState<{ targetAmount: number; currentAmount: number }>({ targetAmount: 0, currentAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadFund = async () => {
      const goals = await getAllSavingsGoals();
      const emergencyGoal = goals.find(g => g.category === 'emergency');
      if (mounted) {
        if (emergencyGoal) {
          setFund({ targetAmount: emergencyGoal.targetAmount, currentAmount: emergencyGoal.currentAmount });
        } else {
          setFund({ targetAmount: 50000, currentAmount: 0 });
        }
        setLoading(false);
      }
    };
    loadFund();
    return () => { mounted = false; };
  }, []);

  const update = useCallback(async (updates: { targetAmount?: number; currentAmount?: number }) => {
    const goals = await getAllSavingsGoals();
    let emergencyGoal = goals.find(g => g.category === 'emergency');
    
    if (!emergencyGoal) {
      // Create new emergency fund goal
      const newGoal: any = {
        id: generateId(),
        name: 'Emergency Fund',
        targetAmount: updates.targetAmount || 50000,
        currentAmount: updates.currentAmount || 0,
        category: 'emergency',
      };
      await addSavingsGoal(newGoal);
      setFund({ targetAmount: newGoal.targetAmount, currentAmount: newGoal.currentAmount });
    } else {
      const updatedGoal = { 
        ...emergencyGoal, 
        targetAmount: updates.targetAmount ?? emergencyGoal.targetAmount,
        currentAmount: updates.currentAmount ?? emergencyGoal.currentAmount
      };
      await updateSavingsGoal(updatedGoal);
      setFund({ targetAmount: updatedGoal.targetAmount, currentAmount: updatedGoal.currentAmount });
    }
  }, []);

  return { fund, loading, update };
}

// Debt Payoff
export function useDebtPayoff() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getAllDebts().then(d => {
      if (mounted) {
        setDebts(d);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (debt: Debt) => {
    await addDebt(debt);
    setDebts(prev => [...prev, debt]);
  }, []);

  const update = useCallback(async (debt: Debt) => {
    await updateDebt(debt);
    setDebts(prev => prev.map(d => d.id === debt.id ? debt : d));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteDebt(id);
    setDebts(prev => prev.filter(d => d.id !== id));
  }, []);

  return { debts, loading, add, update, remove };
}

// Cash Flow Forecast
export function useCashFlowForecast() {
  const [forecast, setForecast] = useState<{ thirtyDays: number; sixtyDays: number; ninetyDays: number }>({ thirtyDays: 0, sixtyDays: 0, ninetyDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadForecast = async () => {
      const [budgets, expenses] = await Promise.all([getAllBudgets(), getExpenses()]);
      
      const monthlyIncome = budgets.find(b => b.category === 'savings')?.monthlyLimit || 50000;
      const monthlyExpenses = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0) - (budgets.find(b => b.category === 'savings')?.monthlyLimit || 0);
      const monthlyNet = monthlyIncome - monthlyExpenses;

      if (mounted) {
        setForecast({ 
          thirtyDays: monthlyNet, 
          sixtyDays: monthlyNet * 2, 
          ninetyDays: monthlyNet * 3 
        });
        setLoading(false);
      }
    };
    loadForecast();
    return () => { mounted = false; };
  }, []);

  return { forecast, loading };
}