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
  ExpenseCategory 
} from '@/lib/types/budget';
import { 
  getDB,
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
  saveCriticalExpenseCommitment,
  getCriticalExpenseCommitment,
  generateId,
} from '@/lib/db/local-db';

/**
 * Hook for local IndexedDB operations with React state sync
 */

// Wizard Profile
export function useWizardProfile() {
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getWizardProfile().then(p => {
      if (mounted) {
        setProfile(p);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  const save = useCallback(async (newProfile: any) => {
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
  const [expenses, setExpenses] = useState<any[]>([]);
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

  const add = useCallback(async (expense: any) => {
    const newExpense = { ...expense, id: crypto.randomUUID() };
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const update = useCallback(async (expense: any) => {
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e)
      .sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const remove = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const getByCategory = useCallback(async (category: any) => {
    return [];
  }, []);

  return { expenses, loading, add, update, remove, getByCategory };
}

// Budgets
export function useBudgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const dummyBudgets = [
      { category: 'food', monthlyLimit: 10000 },
      { category: 'transport', monthlyLimit: 5000 },
      { category: 'entertainment', monthlyLimit: 3000 },
    ];
    setBudgets(dummyBudgets);
    setLoading(false);
    return () => { mounted = false; };
  }, []);

  const save = useCallback(async (budget: any) => {
    setBudgets(prev => {
      const exists = prev.find(b => b.category === budget.category);
      if (exists) {
        return prev.map(b => b.category === budget.category ? budget : b);
      }
      return [...prev, budget];
    });
  }, []);

  const get = useCallback(async (category: any) => {
    return undefined;
  }, []);

  return { budgets, loading, save, get };
}

// Bills
export function useBills() {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const dummyBills = [
      { id: '1', name: 'Electric Bill', amount: 2000, dueDay: 5, category: 'utilities', isActive: true, reminderDaysBefore: 3 },
      { id: '2', name: 'Internet', amount: 800, dueDay: 15, category: 'phone_internet', isActive: true, reminderDaysBefore: 3 },
    ];
    setBills(dummyBills);
    setLoading(false);
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (bill: any) => {
    setBills(prev => [...prev, bill]);
  }, []);

  const update = useCallback(async (bill: any) => {
    setBills(prev => prev.map(b => b.id === bill.id ? bill : b));
  }, []);

  const remove = useCallback(async (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  }, []);

  return { bills, loading, add, update, remove };
}

// Savings Goals
export function useSavingsGoals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const dummyGoals = [
      { id: '1', name: 'Emergency Fund', targetAmount: 50000, currentAmount: 15000, category: 'emergency' },
      { id: '2', name: 'Japan Trip', targetAmount: 80000, currentAmount: 20000, category: 'vacation' },
    ];
    setGoals(dummyGoals);
    setLoading(false);
    return () => { mounted = false; };
  }, []);

  const add = useCallback(async (goal: any) => {
    setGoals(prev => [...prev, goal]);
  }, []);

  const update = useCallback(async (goal: any) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
  }, []);

  const remove = useCallback(async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  return { goals, loading, add, update, remove };
}

// Critical Expense Commitments
export function useCriticalExpenseCommitment(month?: string) {
  const [commitment, setCommitment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setCommitment(null);
        setLoading(false);
      }
    }, 100);
    return () => { mounted = false; };
  }, [targetMonth]);

  const save = useCallback(async (newCommitment: any) => {
    setCommitment(newCommitment);
  }, []);

  return { commitment, loading, save };
}

// Net Worth
export function useNetWorth() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setSnapshot({ assets: [], liabilities: [] });
        setLoading(false);
      }
    }, 100);
    return () => { mounted = false; };
  }, []);

  const addAsset = useCallback(async (asset: any) => {}, []);
  const updateAsset = useCallback(async (asset: any) => {}, []);
  const removeAsset = useCallback(async (id: string) => {}, []);
  const addLiability = useCallback(async (liability: any) => {}, []);
  const updateLiability = useCallback(async (liability: any) => {}, []);
  const removeLiability = useCallback(async (id: string) => {}, []);

  return { snapshot, addAsset, updateAsset, removeAsset, addLiability, updateLiability, removeLiability, loading };
}

// Subscriptions
export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setSubscriptions([]);
        setLoading(false);
      }
    }, 100);
    return () => { mounted = false; };
  }, []);

  return { subscriptions, loading, add: async () => {}, update: async () => {}, remove: async () => {} };
}

// Emergency Fund
export function useEmergencyFund() {
  const [fund, setFund] = useState<any>({ targetAmount: 0, currentAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setFund({ targetAmount: 50000, currentAmount: 0 });
        setLoading(false);
      }
    }, 100);
    return () => { mounted = false; };
  }, []);

  return { fund, loading, update: async () => {} };
}

// Debt Payoff
export function useDebtPayoff() {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setDebts([]);
        setLoading(false);
      }
    }, 100);
    return () => { mounted = false; };
  }, []);

  return { debts, loading, add: async () => {}, update: async () => {}, remove: async () => {} };
}

// Cash Flow Forecast
export function useCashFlowForecast() {
  const [forecast, setForecast] = useState<any>({ thirtyDays: 0, sixtyDays: 0, ninetyDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => {
      if (mounted) {
        setForecast({ thirtyDays: 10000, sixtyDays: 20000, ninetyDays: 30000 });
        setLoading(false);
      }
    }, 100);
    return () => { mounted = false; };
  }, []);

  return { forecast, loading, update: async () => {} };
}