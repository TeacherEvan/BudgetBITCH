'use client';

import { useState, useEffect, useCallback } from 'react';
import type { 
  ExpenseEntry, 
  CriticalExpenseCommitment,
  ExpenseCategory,
} from '@/lib/types/budget';
import { 
  addExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  getExpensesByCategory,
  saveCriticalExpenseCommitment,
  getCriticalExpenseCommitment,
  generateId,
} from '@/lib/db/local-db';
import { useDatabaseListener } from './use-accounts';

export function useExpenses() {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let mounted = true;
    getExpenses().then(e => {
      if (mounted) {
        setExpenses(e.sort((a, b) => b.date.localeCompare(a.date)));
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

export function useCriticalExpenseCommitment(month?: string) {
  const [commitment, setCommitment] = useState<CriticalExpenseCommitment | null>(null);
  const [loading, setLoading] = useState(true);

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const load = useCallback(() => {
    let mounted = true;
    getCriticalExpenseCommitment(targetMonth).then(c => {
      if (mounted) {
        setCommitment(c ?? null);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [targetMonth]);

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

  const save = useCallback(async (newCommitment: CriticalExpenseCommitment) => {
    await saveCriticalExpenseCommitment(newCommitment);
    setCommitment(newCommitment);
  }, []);

  return { commitment, loading, save };
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
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

  useEffect(() => {
    return load();
  }, [load]);

  useDatabaseListener(load);

  const add = useCallback(async (sub: Omit<ExpenseEntry, 'id'>) => {
    const newSub = { ...sub, id: generateId(), category: 'subscriptions' as const, isRecurring: true };
    await addExpense(newSub);
    setSubscriptions(prev => [newSub, ...prev]);
  }, []);

  const update = useCallback(async (sub: ExpenseEntry) => {
    await updateExpense(sub);
    setSubscriptions(prev => prev.map(s => s.id === sub.id ? sub : s));
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  }, []);

  return { subscriptions, loading, add, update, remove };
}
