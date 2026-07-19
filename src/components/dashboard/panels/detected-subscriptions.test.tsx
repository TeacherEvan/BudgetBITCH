// components/dashboard/panels/detected-subscriptions.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DetectedSubscriptions } from './detected-subscriptions';
import type { ExpenseEntry } from '@/lib/types/budget';

vi.mock('@/hooks/use-currency', () => ({
  useCurrency: () => (amount: number) => `฿${amount}`,
}));

const seededExpenses: ExpenseEntry[] = [
  { id: '1', date: '2026-01-05', category: 'other', merchant: 'Netflix', amount: 429, source: 'import' },
  { id: '2', date: '2026-02-04', category: 'other', merchant: 'Netflix', amount: 429, source: 'import' },
  { id: '3', date: '2026-03-06', category: 'other', merchant: 'Netflix', amount: 429, source: 'import' },
];

const mocks = vi.hoisted(() => ({
  addExpense: vi.fn(async (_entry: unknown) => undefined),
  addSubscription: vi.fn(async () => undefined),
  expenses: [] as ExpenseEntry[],
  subscriptions: [] as ExpenseEntry[],
}));

vi.mock('@/lib/db/local-db', () => ({
  addExpense: (entry: unknown) => mocks.addExpense(entry as ExpenseEntry),
  generateId: () => 'gen-id',
}));

vi.mock('@/hooks/use-local-db', () => ({
  useExpenses: () => ({ expenses: mocks.expenses, loading: false }),
  useSubscriptions: () => ({ subscriptions: mocks.subscriptions, loading: false, add: mocks.addSubscription }),
}));

describe('DetectedSubscriptions', () => {
  beforeEach(() => {
    mocks.addExpense.mockClear();
    mocks.addSubscription.mockClear();
    mocks.subscriptions = [];
  });

  it('shows the empty-state message when nothing is detected', () => {
    mocks.expenses = [];
    render(<DetectedSubscriptions locale="en" />);
    expect(screen.getByText(/No recurring charges detected yet/i)).toBeInTheDocument();
  });

  it('detects a recurring merchant and renders an Add button', () => {
    mocks.expenses = seededExpenses;
    render(<DetectedSubscriptions locale="en" />);
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByTestId('add-detected-Netflix')).toBeInTheDocument();
  });

  it('adds to both the expense ledger and the subscription list on click', async () => {
    mocks.expenses = seededExpenses;
    render(<DetectedSubscriptions locale="en" />);
    fireEvent.click(screen.getByTestId('add-detected-Netflix'));

    await waitFor(() => {
      expect(mocks.addExpense).toHaveBeenCalledTimes(1);
      expect(mocks.addSubscription).toHaveBeenCalledTimes(1);
    });

    const addedExpense = mocks.addExpense.mock.calls[0][0] as ExpenseEntry;
    expect(addedExpense.merchant).toBe('Netflix');
    expect(addedExpense.isRecurring).toBe(true);
    expect(addedExpense.cycle).toBe('monthly');
    expect(addedExpense.amount).toBe(429);

    const addedSub = mocks.addSubscription.mock.calls[0][0] as Partial<ExpenseEntry>;
    expect(addedSub.merchant).toBe('Netflix');
    expect(addedSub.isRecurring).toBe(true);
  });
});
