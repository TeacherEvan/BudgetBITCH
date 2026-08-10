// lib/db/stores/attribution.test.ts
// Proves the missing write-side of member attribution: addExpense/addIncome now
// stamp createdByName (read by the synced-account dashboard) from the current
// member, falling back to "Personal" when unauthenticated.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { addExpense } from '@/lib/db/stores/expenses-store';
import { addIncome } from '@/lib/db/stores/incomes-store';
import { getExpenses, getIncomes, clearAllData } from '@/lib/db/local-db';
import { setCurrentMember } from '@/lib/db/current-member';
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

describe('member attribution on writes', () => {
  beforeEach(async () => {
    setCurrentMember(null);
    await clearAllData();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stamps createdByName as "Personal" when no member is set', async () => {
    await addExpense(makeExpense('e-1'));
    const all = await getExpenses();
    const e = all.find((x) => x.id === 'e-1');
    expect(e?.createdByName).toBe('Personal');
  });

  it('stamps createdByName with the current member name', async () => {
    setCurrentMember('Leandi');
    await addExpense(makeExpense('e-2'));
    const all = await getExpenses();
    const e = all.find((x) => x.id === 'e-2');
    expect(e?.createdByName).toBe('Leandi');
  });

  it('stamps income attribution too', async () => {
    setCurrentMember('Ewaldt');
    await addIncome(makeIncome('i-1'));
    const all = await getIncomes();
    const inc = all.find((x) => x.id === 'i-1');
    expect(inc?.createdByName).toBe('Ewaldt');
  });

  it('never overwrites an explicitly provided createdByName', async () => {
    setCurrentMember('Ewaldt');
    const exp = makeExpense('e-3');
    exp.createdByName = 'Guest';
    await addExpense(exp);
    const all = await getExpenses();
    const e = all.find((x) => x.id === 'e-3');
    expect(e?.createdByName).toBe('Guest');
  });
});
