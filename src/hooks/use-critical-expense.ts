// hooks/use-critical-expense.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CriticalExpenseCommitment } from '@/lib/types/budget';
import { getCriticalExpenseCommitment, saveCriticalExpenseCommitment, deleteCriticalExpenseCommitment } from '@/lib/db/local-db';

export function useCriticalExpense() {
  const [commitment, setCommitment] = useState<CriticalExpenseCommitment | null>(null);
  const [loading, setLoading] = useState(true);

  const targetMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
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