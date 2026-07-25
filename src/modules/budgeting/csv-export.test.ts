// src/modules/budgeting/csv-export.test.ts
import { expect, test, vi } from 'vitest';
import { exportExpensesToCsv, exportIncomesToCsv, exportBudgetsToCsv, downloadCsv } from './csv-export';
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

test('exportBudgetsToCsv formats budget limits to CSV with optional BOM', () => {
  const budgets = [
    { category: 'food' as const, monthlyLimit: 5000, alertAtPct: 80 },
  ];
  const csv = exportBudgetsToCsv(budgets, true);
  expect(csv.startsWith('﻿')).toBe(true);
  expect(csv).toContain('category,monthlyLimit,alertAtPct');
  expect(csv).toContain('food,5000,80');
});

test('escapeCsvField neutralizes formula-injection prefixes', () => {
  const expenses: ExpenseEntry[] = [
    {
      id: 'e1',
      date: '2026-07-20',
      merchant: '=cmd|/C calc',
      amount: 10,
      category: 'food',
      source: 'manual',
    },
    {
      id: 'e2',
      date: '2026-07-21',
      merchant: '+SUM(A1:A2)',
      amount: 20,
      category: 'food',
      source: 'manual',
    },
    {
      id: 'e3',
      date: '2026-07-22',
      merchant: '@SUM(A1:A2)',
      amount: 30,
      category: 'food',
      source: 'manual',
    },
  ];
  const csv = exportExpensesToCsv(expenses);
  const lines = csv.split('\n');
  expect(lines[1]).toBe('2026-07-20,\'=cmd|/C calc,10,food,,');
  expect(lines[2]).toBe('2026-07-21,\'+SUM(A1:A2),20,food,,');
  expect(lines[3]).toBe('2026-07-22,\'@SUM(A1:A2),30,food,,');
});

test('downloadCsv triggers a browser download and revokes the object URL', () => {
  const clickSpy = vi.fn();
  const revokeSpy = vi.fn();
  const createObjectURLSpy = vi.fn(() => 'blob:mock');
  // jsdom lacks URL.createObjectURL / Blob click; stub them.
  globalThis.URL.createObjectURL = createObjectURLSpy;
  globalThis.URL.revokeObjectURL = revokeSpy;
  const capturedAnchor: { current: HTMLAnchorElement | null } = { current: null };
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = origCreate(tag);
    if (tag === 'a') {
      capturedAnchor.current = el as HTMLAnchorElement;
      Object.defineProperty(el, 'click', { value: clickSpy, configurable: true });
    }
    return el;
  });
  const removeChildSpy = vi.spyOn(document.body, 'removeChild');

  const ok = downloadCsv('a,b,c\n1,2,3', 'test-export');
  expect(ok).toBe(true);
  expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
  expect(clickSpy).toHaveBeenCalledTimes(1);
  expect(revokeSpy).toHaveBeenCalledWith('blob:mock');
  expect(capturedAnchor.current?.download).toBe('test-export.csv');
  expect(removeChildSpy).toHaveBeenCalledWith(capturedAnchor.current);

  vi.restoreAllMocks();
});

test('downloadCsv returns false and does nothing outside a browser', () => {
  const savedDoc = globalThis.document;
  // @ts-expect-error - simulate non-DOM environment
  globalThis.document = undefined;
  const ok = downloadCsv('x', 'nope');
  expect(ok).toBe(false);
  globalThis.document = savedDoc;
});
