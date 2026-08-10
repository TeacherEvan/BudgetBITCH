// lib/utils/action-logger.integration.test.ts
// Proves the action-logging layer is actually wired into the data stores, not
// just defined (the original bug: logUserAction existed but no call sites).
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { addExpense } from '@/lib/db/stores/expenses-store';
import { addIncome } from '@/lib/db/stores/incomes-store';
import {
  getUserActionLogs,
  clearUserActionLogs,
  logUserAction,
} from '@/lib/utils/action-logger';
import type { ExpenseEntry, IncomeEntry } from '@/lib/types/budget';

function makeExpense(id: string): ExpenseEntry {
  return {
    id,
    date: '2026-07-21',
    category: 'food',
    merchant: 'Spaza',
    amount: 50,
    source: 'manual',
    createdAt: Date.now(),
  } as ExpenseEntry;
}

function makeIncome(id: string): IncomeEntry {
  return {
    id,
    date: '2026-07-21',
    source: 'Salary',
    amount: 10000,
    category: 'salary',
    frequency: 'monthly',
    createdAt: new Date().toISOString(),
  } as IncomeEntry;
}

describe('action logging is wired into data stores', () => {
  beforeEach(() => {
    clearUserActionLogs();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('records an action log when an expense is added', async () => {
    await addExpense(makeExpense('e-1'));
    const logs = getUserActionLogs();
    expect(logs.length).toBe(1);
    expect(logs[0]).toContain('Add expense');
    expect(logs[0]).toContain('food');
  });

  it('records a log for income add too', async () => {
    await addIncome(makeIncome('i-1'));
    const logs = getUserActionLogs();
    expect(logs.some((l) => l.includes('Add income'))).toBe(true);
  });

  it('keeps at most the last 20 logs (rolling buffer)', () => {
    for (let i = 0; i < 25; i++) {
      logUserAction(`action ${i}`);
    }
    const logs = getUserActionLogs();
    expect(logs.length).toBe(20);
    // Oldest dropped entry is gone.
    expect(logs.some((l) => l.includes('action 0'))).toBe(false);
    // Newest kept.
    expect(logs.some((l) => l.includes('action 24'))).toBe(true);
  });
});
