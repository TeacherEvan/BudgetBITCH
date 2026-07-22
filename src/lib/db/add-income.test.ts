import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { addIncome, getIncomes, deleteIncome, updateIncome, clearIncomes } from './local-db';
import { BackupDataSchema } from './backup-schema';
import type { IncomeEntry } from '@/lib/types/budget';

describe('Income Store and Schema Tests', () => {
  beforeAll(() => {
    const g = globalThis as unknown as { window?: typeof globalThis };
    if (typeof g.window === 'undefined') {
      g.window = globalThis;
    }
    if (!globalThis.crypto) {
      (globalThis as { crypto?: Crypto }).crypto = webcrypto as unknown as Crypto;
    }
  });

  beforeEach(async () => {
    await clearIncomes();
  });

  const dummyIncome: Omit<IncomeEntry, 'id' | 'createdAt'> = {
    amount: 85000,
    source: 'Tech Corp Salary',
    category: 'salary',
    frequency: 'monthly',
    date: '2026-07-23',
    entrySource: 'manual',
  };

  it('can add and retrieve income records in IndexedDB', async () => {
    const listBefore = await getIncomes();
    expect(listBefore).toHaveLength(0);

    const testIncome: IncomeEntry = {
      ...dummyIncome,
      id: 'income-123',
      createdAt: new Date().toISOString(),
    };
    await addIncome(testIncome);

    const listAfter = await getIncomes();
    expect(listAfter).toHaveLength(1);
    expect(listAfter[0].source).toBe('Tech Corp Salary');
    expect(listAfter[0].amount).toBe(85000);
    expect(listAfter[0].frequency).toBe('monthly');
  });

  it('can update existing income records', async () => {
    const testIncome: IncomeEntry = {
      ...dummyIncome,
      id: 'income-456',
      createdAt: new Date().toISOString(),
    };
    await addIncome(testIncome);

    const updated: IncomeEntry = {
      ...testIncome,
      amount: 90000,
      source: 'Tech Corp Promotion',
    };
    await updateIncome(updated);

    const list = await getIncomes();
    expect(list).toHaveLength(1);
    expect(list[0].amount).toBe(90000);
    expect(list[0].source).toBe('Tech Corp Promotion');
  });

  it('can delete income records', async () => {
    const testIncome: IncomeEntry = {
      ...dummyIncome,
      id: 'income-789',
      createdAt: new Date().toISOString(),
    };
    await addIncome(testIncome);

    const list = await getIncomes();
    expect(list).toHaveLength(1);

    await deleteIncome('income-789');
    const listAfter = await getIncomes();
    expect(listAfter).toHaveLength(0);
  });

  it('validates properly against BackupDataSchema', () => {
    const testIncomes: IncomeEntry[] = [
      {
        id: 'income-xxx',
        amount: 3000,
        source: 'Freelance Logo Design',
        category: 'freelance',
        frequency: 'one_time',
        date: '2026-07-23',
        createdAt: new Date().toISOString(),
        entrySource: 'manual',
      },
    ];

    const result = BackupDataSchema.safeParse({
      incomes: testIncomes,
    });

    expect(result.success).toBe(true);
  });
});
