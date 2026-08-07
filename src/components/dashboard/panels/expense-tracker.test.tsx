// components/dashboard/panels/expense-tracker.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseTracker } from './expense-tracker';

// Mock the data hooks — the panel renders from these alone.
let mockExpenses: Array<Record<string, unknown>> = [];

vi.mock('@/hooks/use-local-db', () => ({
  useExpenses: () => ({
    expenses: mockExpenses,
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    loading: false,
  }),
  useBudgets: () => ({ budgets: [] }),
}));

vi.mock('@/hooks/use-currency', () => ({
  useCurrency: () => (n: number) => `$${n.toFixed(2)}`,
}));

vi.mock('@/hooks/use-purchase-notes', () => ({
  usePurchaseNotes: () => ({ boardId: null, notes: {}, setNote: vi.fn() }),
}));

vi.mock('@/lib/db/local-db', () => ({
  addExpense: vi.fn(),
  generateId: () => 'gen-test',
}));

vi.mock('@/lib/db/stores/expenses-store', () => ({
  repeatExpense: vi.fn(),
}));

vi.mock('./import-csv-modal', () => ({
  ImportCsvModal: () => null,
}));

vi.mock('./purchase-note-modal', () => ({
  PurchaseNoteModal: () => null,
}));

describe('ExpenseTracker — purchase vs entry date display', () => {
  it('shows "Entered <entryDate>" when the entry date differs from the purchase date', () => {
    mockExpenses = [
      {
        id: 'e1',
        merchant: 'Woolworths',
        amount: 342.75,
        category: 'food',
        date: '2026-08-01', // purchase date on the receipt
        entryDate: '2026-08-04', // scanned into the app three days later
        source: 'receipt',
      },
    ];

    render(<ExpenseTracker />);

    expect(screen.getByTestId('entry-date-e1')).toHaveTextContent('Entered 2026-08-04');
  });

  it('hides the entry date when it equals the purchase date or is absent (old rows)', () => {
    mockExpenses = [
      {
        id: 'e2',
        merchant: 'Grab',
        amount: 120,
        category: 'transport',
        date: '2026-08-04',
        entryDate: '2026-08-04', // same day — nothing to disambiguate
        source: 'manual',
      },
      {
        id: 'e3',
        merchant: 'Legacy Row',
        amount: 50,
        category: 'other',
        date: '2026-07-15',
        // no entryDate — pre-feature row
        source: 'manual',
      },
    ];

    render(<ExpenseTracker />);

    expect(screen.queryByTestId('entry-date-e2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('entry-date-e3')).not.toBeInTheDocument();
  });
});
