'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  BudgetCategory, 
  Bill, 
  SavingsGoal, 
  ExpenseCategory 
} from '@/lib/types/budget';
import { 
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
  generateId 
} from '@/lib/db/local-db';
import { useDatabaseListener } from './use-accounts';

export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getAllBudgets().then(b => {
      if (mounted) {
        setBudgets(b);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

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

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getAllBills().then(b => {
      if (mounted) {
        setBills(b);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

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

export function useSavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getAllSavingsGoals().then(g => {
      if (mounted) {
        setGoals(g);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

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

export function useEmergencyFund() {
  const [fund, setFund] = useState<{ targetAmount: number; currentAmount: number }>({ targetAmount: 0, currentAmount: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
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

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

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

export function useCashFlowForecast() {
  const [forecast, setForecast] = useState<{ thirtyDays: number; sixtyDays: number; ninetyDays: number }>({ thirtyDays: 0, sixtyDays: 0, ninetyDays: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    const loadForecast = async () => {
      const [budgets] = await Promise.all([getAllBudgets()]);

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

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

  return { forecast, loading };
}
