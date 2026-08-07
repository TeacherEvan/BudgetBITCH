// src/modules/budgeting/line-item-rollup.ts
//
// Pure domain logic for receipt line-item roll-up. No React, no I/O.
//
// A scanned receipt carries an optional `lineItems` array. When that array is
// trustworthy (non-empty AND its amounts add up to the receipt total), each
// item's amount is attributed to ITS OWN category — so a supermarket receipt
// with food + entertainment + other lines splits across those three budget
// rows instead of dumping 100% of the total into the parent category.

import type {
  ExpenseCategory,
  ExpenseEntry,
  ReceiptLineItem,
} from '@/lib/types/budget';

/** Every category the app budgets against, in display order. */
export const ALL_EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'housing',
  'transport',
  'food',
  'utilities',
  'phone_internet',
  'subscriptions',
  'entertainment',
  'healthcare',
  'insurance',
  'debt',
  'savings',
  'other',
] as const;

/** One row of the Excel-style spent ledger. */
export interface LedgerRow {
  /** Stable, unique React key. */
  key: string;
  /** True for a receipt line item, false for the receipt (parent) row. */
  isChild: boolean;
  /** Id of the owning expense — equals the expense id on parent rows too. */
  parentId: string;
  /** Parent date, inherited by children so the ledger stays chronological. */
  date: string;
  /** Merchant on a parent row, item description on a child row. */
  description: string;
  amount: number;
  category: ExpenseCategory;
  qty?: number;
  unitPrice?: number;
  /** Present on parent rows only — lets the UI render notes and source badges. */
  expense?: ExpenseEntry;
}

/** Round to 2dp, killing float drift (0.1 + 0.2 -> 0.3, not 0.30000000000000004). */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sumItems(items: readonly ReceiptLineItem[]): number {
  return items.reduce((total, itemLine) => total + (Number(itemLine.amount) || 0), 0);
}

/** Absolute drift allowed between the item sum and the receipt total. */
function tolerance(amount: number): number {
  return Math.max(0.02, Math.abs(amount) * 0.01);
}

/**
 * True when the expense has line items we can safely split by category:
 * a non-empty array whose amounts reconcile with the receipt total.
 */
export function hasTrustworthyLineItems(expense: ExpenseEntry): boolean {
  const items = expense.lineItems;
  if (!Array.isArray(items) || items.length === 0) return false;
  return Math.abs(sumItems(items) - expense.amount) <= tolerance(expense.amount);
}

/**
 * Per-category actuals. Itemized receipts contribute per line item; everything
 * else contributes its full amount to the expense's own category.
 */
export function rollupCategoryActuals(
  expenses: readonly ExpenseEntry[],
): Record<ExpenseCategory, number> {
  const actuals = Object.fromEntries(
    ALL_EXPENSE_CATEGORIES.map(category => [category, 0]),
  ) as Record<ExpenseCategory, number>;

  for (const expense of expenses) {
    if (hasTrustworthyLineItems(expense)) {
      for (const lineItem of expense.lineItems ?? []) {
        const category = lineItem.category ?? expense.category;
        actuals[category] = (actuals[category] ?? 0) + (Number(lineItem.amount) || 0);
      }
    } else {
      const category = expense.category;
      actuals[category] = (actuals[category] ?? 0) + (Number(expense.amount) || 0);
    }
  }

  for (const category of ALL_EXPENSE_CATEGORIES) {
    actuals[category] = round2(actuals[category]);
  }

  return actuals;
}

/**
 * Flatten expenses into ledger rows: one parent row per expense, plus one child
 * row per line item when the itemization is trustworthy. Parent rows keep the
 * full receipt total — category totals come from `rollupCategoryActuals`, so
 * nothing is double-counted here.
 *
 * Window the input (e.g. `.slice(0, 15)`) BEFORE calling this so the window
 * counts receipts, not rows.
 */
export function flattenLedgerRows(expenses: readonly ExpenseEntry[]): LedgerRow[] {
  const rows: LedgerRow[] = [];

  for (const expense of expenses) {
    rows.push({
      key: expense.id,
      isChild: false,
      parentId: expense.id,
      date: expense.date,
      description: expense.merchant,
      amount: round2(expense.amount),
      category: expense.category,
      expense,
    });

    if (!hasTrustworthyLineItems(expense)) continue;

    (expense.lineItems ?? []).forEach((lineItem, index) => {
      rows.push({
        key: `${expense.id}:item:${index}`,
        isChild: true,
        parentId: expense.id,
        date: expense.date,
        description: lineItem.description,
        amount: round2(lineItem.amount),
        category: lineItem.category ?? expense.category,
        qty: lineItem.qty,
        unitPrice: lineItem.unitPrice,
      });
    });
  }

  return rows;
}
