// hooks/use-critical-expense.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { BOARD_CHANGED_EVENT, type CriticalExpenseCommitment } from '@/lib/types/budget';
import { getCriticalExpenseCommitment, saveCriticalExpenseCommitment, deleteCriticalExpenseCommitment } from '@/lib/db/local-db';

export function useCriticalExpense() {
  const [commitment, setCommitment] = useState<CriticalExpenseCommitment | null>(null);
  const [loading, setLoading] = useState(true);

  const targetMonth = new Date().toISOString().slice(0, 7);

  const load = useCallback(() => {
    let mounted = true;
    getCriticalExpenseCommitment(targetMonth)
      .then(c => {
        if (mounted) {
          setCommitment(c || null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [targetMonth]);

  useEffect(() => {
    return load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener(BOARD_CHANGED_EVENT, load);
    return () => window.removeEventListener(BOARD_CHANGED_EVENT, load);
  }, [load]);

  const save = useCallback(async (newCommitment: CriticalExpenseCommitment) => {
    await saveCriticalExpenseCommitment(newCommitment);
    setCommitment(newCommitment);
  }, []);

  const clear = useCallback(async () => {
    await deleteCriticalExpenseCommitment(targetMonth);
    setCommitment(null);
  }, [targetMonth]);

  return { commitment, loading, save, clear };
}