import { describe, it, expect, beforeEach, vi } from 'vitest';
import { repeatExpense } from './expenses-store';
import type { ExpenseEntry } from '@/lib/types/budget';

// In-memory stand-in for the IndexedDB `expenses` store.
const store = new Map<string, ExpenseEntry>();

vi.mock('../local-db', () => ({
  getDB: async () => ({
    get: async (name: string, id: string) => (name === 'expenses' ? store.get(id) ?? undefined : undefined),
    add: async (_name: string, rec: ExpenseEntry) => {
      store.set(rec.id, rec);
    },
    put: async (_name: string, rec: ExpenseEntry) => {
      store.set(rec.id, rec);
    },
    delete: async (_name: string, id: string) => {
      store.delete(id);
    },
  }),
  afterBoardMutation: async () => {},
  generateId: () => `gen_${Math.random().toString(36).slice(2)}`,
}));

vi.mock('@/lib/utils/action-logger', () => ({
  logUserAction: () => {},
}));

vi.mock('../current-member', () => ({
  getCurrentMember: () => 'Personal',
}));

const sample: ExpenseEntry = {
  id: 'orig-1',
  date: '2026-07-01',
  category: 'food',
  merchant: 'Weekly Groceries',
  amount: 1200,
  source: 'receipt',
  note: 'big shop',
  lineItems: [{ description: 'milk', amount: 40, category: 'food' }],
};

beforeEach(() => {
  store.clear();
});

describe('repeatExpense (Repeat Purchase)', () => {
  it('clones the expense with a new id, today date, and repeatedFrom lineage', async () => {
    store.set(sample.id, sample);

    const clone = await repeatExpense(sample.id);

    expect(clone).not.toBeNull();
    expect(clone!.id).not.toBe(sample.id);
    expect(clone!.repeatedFrom).toBe(sample.id);
    expect(clone!.date).not.toBe(sample.date); // today's date
    expect(clone!.merchant).toBe(sample.merchant);
    expect(clone!.amount).toBe(sample.amount);
    expect(clone!.category).toBe(sample.category);
    expect(clone!.lineItems).toEqual(sample.lineItems);
    expect(clone!.source).toBe('manual');
  });

  it('returns null when the original expense does not exist', async () => {
    const clone = await repeatExpense('does-not-exist');
    expect(clone).toBeNull();
  });

  it('writes the clone into the store so it appears next to the original', async () => {
    store.set(sample.id, sample);
    await repeatExpense(sample.id);

    const all = Array.from(store.values());
    expect(all.length).toBe(2);
    expect(all.some((e) => e.repeatedFrom === sample.id)).toBe(true);
  });
});
