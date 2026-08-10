// src/modules/budgeting/line-item-rollup.test.ts
import { describe, it, expect } from 'vitest';
import {
  rollupCategoryActuals,
  flattenLedgerRows,
  hasTrustworthyLineItems,
} from './line-item-rollup';
import type { ExpenseEntry, ReceiptLineItem } from '@/lib/types/budget';

function makeExpense(overrides: Partial<ExpenseEntry> = {}): ExpenseEntry {
  return {
    id: 'e1',
    date: '2026-08-01',
    category: 'food',
    merchant: 'Checkers',
    amount: 100,
    source: 'receipt',
    ...overrides,
  };
}

function item(
  description: string,
  amount: number,
  category: ReceiptLineItem['category'],
  extra: Partial<ReceiptLineItem> = {},
): ReceiptLineItem {
  return { description, amount, category, ...extra };
}

describe('rollupCategoryActuals', () => {
  it('falls back to the expense category when there are no line items', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({ id: 'a', category: 'transport', amount: 42.5, source: 'manual' }),
    ]);

    expect(actuals.transport).toBe(42.5);
    expect(actuals.food).toBe(0);
  });

  it('splits a 3-item receipt across its three item categories', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({
        id: 'r1',
        category: 'food',
        amount: 100,
        lineItems: [
          item('Milk 2L', 50, 'food'),
          item('Cinema ticket', 30, 'entertainment'),
          item('Batteries', 20, 'other'),
        ],
      }),
    ]);

    expect(actuals.food).toBe(50);
    expect(actuals.entertainment).toBe(30);
    expect(actuals.other).toBe(20);
    // The whole total must NOT land in the parent category.
    expect(actuals.food).not.toBe(100);
  });

  it('ignores line items whose sum does not match the receipt total', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({
        id: 'r2',
        category: 'food',
        amount: 100,
        lineItems: [item('Milk', 10, 'food'), item('Movie', 5, 'entertainment')],
      }),
    ]);

    expect(actuals.food).toBe(100);
    expect(actuals.entertainment).toBe(0);
  });

  it('accepts a small rounding drift within the tolerance', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({
        id: 'r3',
        category: 'food',
        amount: 100,
        // 99.99 -> within max(0.02, 1% of 100 = 1.00)
        lineItems: [item('Milk', 59.99, 'food'), item('Movie', 40, 'entertainment')],
      }),
    ]);

    expect(actuals.food).toBe(59.99);
    expect(actuals.entertainment).toBe(40);
  });

  it('treats an empty lineItems array as no itemization', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({ id: 'r4', category: 'utilities', amount: 80, lineItems: [] }),
    ]);

    expect(actuals.utilities).toBe(80);
  });

  it('rounds to 2dp without float drift', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({ id: 'f1', category: 'food', amount: 0.1, source: 'manual' }),
      makeExpense({ id: 'f2', category: 'food', amount: 0.2, source: 'manual' }),
    ]);

    expect(actuals.food).toBe(0.3);
    expect(String(actuals.food)).toBe('0.3');
  });

  it('returns every category key, zeroed, for an empty expense list', () => {
    const actuals = rollupCategoryActuals([]);
    expect(Object.keys(actuals)).toHaveLength(12);
    expect(Object.values(actuals).every(v => v === 0)).toBe(true);
  });

  it('accumulates itemized and non-itemized expenses together', () => {
    const actuals = rollupCategoryActuals([
      makeExpense({
        id: 'r5',
        category: 'food',
        amount: 100,
        lineItems: [item('Bread', 60, 'food'), item('Game', 40, 'entertainment')],
      }),
      makeExpense({ id: 'm1', category: 'food', amount: 25, source: 'manual' }),
    ]);

    expect(actuals.food).toBe(85);
    expect(actuals.entertainment).toBe(40);
  });
});

describe('hasTrustworthyLineItems', () => {
  it('is false without line items, false on mismatch, true on a matching sum', () => {
    expect(hasTrustworthyLineItems(makeExpense())).toBe(false);
    expect(hasTrustworthyLineItems(makeExpense({ lineItems: [] }))).toBe(false);
    expect(
      hasTrustworthyLineItems(
        makeExpense({ amount: 100, lineItems: [item('x', 10, 'food')] }),
      ),
    ).toBe(false);
    expect(
      hasTrustworthyLineItems(
        makeExpense({
          amount: 100,
          lineItems: [item('x', 60, 'food'), item('y', 40, 'other')],
        }),
      ),
    ).toBe(true);
  });
});

describe('flattenLedgerRows', () => {
  it('emits one parent row per expense when there is no itemization', () => {
    const rows = flattenLedgerRows([
      makeExpense({ id: 'a', merchant: 'Shell', amount: 30, source: 'manual' }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].isChild).toBe(false);
    expect(rows[0].parentId).toBe('a');
    expect(rows[0].description).toBe('Shell');
    expect(rows[0].amount).toBe(30);
  });

  it('emits a parent row plus one child row per trustworthy line item', () => {
    const rows = flattenLedgerRows([
      makeExpense({
        id: 'r1',
        merchant: 'Checkers',
        amount: 100,
        category: 'food',
        lineItems: [
          item('Milk 2L', 50, 'food', { qty: 2, unitPrice: 25 }),
          item('Cinema ticket', 30, 'entertainment'),
          item('Batteries', 20, 'other'),
        ],
      }),
    ]);

    expect(rows).toHaveLength(4);

    const [parent, ...children] = rows;
    expect(parent.isChild).toBe(false);
    expect(parent.amount).toBe(100);
    expect(parent.expense).toBeDefined();

    expect(children.map(c => c.isChild)).toEqual([true, true, true]);
    expect(children.map(c => c.parentId)).toEqual(['r1', 'r1', 'r1']);
    expect(children.map(c => c.description)).toEqual([
      'Milk 2L',
      'Cinema ticket',
      'Batteries',
    ]);
    expect(children.map(c => c.category)).toEqual(['food', 'entertainment', 'other']);
    expect(children.map(c => c.amount)).toEqual([50, 30, 20]);
    expect(children[0].qty).toBe(2);
    expect(children[0].unitPrice).toBe(25);
    expect(children[1].qty).toBeUndefined();
  });

  it('does not emit child rows when the item sum does not match the total', () => {
    const rows = flattenLedgerRows([
      makeExpense({
        id: 'r2',
        amount: 100,
        lineItems: [item('Milk', 10, 'food')],
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].isChild).toBe(false);
  });

  it('gives every row a unique key and inherits the parent date', () => {
    const rows = flattenLedgerRows([
      makeExpense({
        id: 'r3',
        date: '2026-07-04',
        amount: 10,
        lineItems: [item('A', 6, 'food'), item('B', 4, 'other')],
      }),
      makeExpense({ id: 'r4', date: '2026-07-05', amount: 5, source: 'manual' }),
    ]);

    const keys = rows.map(r => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(rows.slice(0, 3).every(r => r.date === '2026-07-04')).toBe(true);
  });
});
