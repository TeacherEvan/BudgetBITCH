// src/modules/budgeting/csv-export.test.ts
import { expect, test } from 'vitest';
import { exportExpensesToCsv, exportIncomesToCsv } from './csv-export';
import type { ExpenseEntry, IncomeEntry } from '@/lib/types/budget';

test('exportExpensesToCsv formats empty array to header row only', () => {
  const csv = exportExpensesToCsv([]);
  expect(csv).toBe('date,merchant,amount,category,note,recurringId');
});

test('exportExpensesToCsv converts expense entries and handles quoted fields', () => {
  const expenses: ExpenseEntry[] = [
    {
      id: 'e1',
      date: '2026-07-20',
      merchant: 'Starbucks "Special"',
      amount: 150.5,
      category: 'food',
      note: 'Coffee, pastries & tax',
      source: 'manual',
    },
    {
      id: 'e2',
      date: '2026-07-21',
      merchant: 'Shell Station',
      amount: 1200,
      category: 'transport',
      source: 'manual',
    },
  ];

  const csv = exportExpensesToCsv(expenses);
  const lines = csv.split('\n');
  expect(lines[0]).toBe('date,merchant,amount,category,note,recurringId');
  expect(lines[1]).toBe('2026-07-20,"Starbucks ""Special""",150.5,food,"Coffee, pastries & tax",');
  expect(lines[2]).toBe('2026-07-21,Shell Station,1200,transport,,');
});

test('exportIncomesToCsv formats income entries correctly', () => {
  const incomes: IncomeEntry[] = [
    {
      id: 'i1',
      date: '2026-07-01',
      source: 'Acme Corp Salary',
      amount: 65000,
      category: 'salary',
      frequency: 'monthly',
      note: 'Main salary',
      createdAt: '2026-07-01T00:00:00.000Z',
    },
  ];

  const csv = exportIncomesToCsv(incomes);
  const lines = csv.split('\n');
  expect(lines[0]).toBe('date,source,amount,category,frequency,note');
  expect(lines[1]).toBe('2026-07-01,Acme Corp Salary,65000,salary,monthly,Main salary');
});
