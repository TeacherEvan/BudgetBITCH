// src/components/dashboard/budget-variance-grid.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BudgetVarianceGrid } from './budget-variance-grid';
import type { ExpenseEntry } from '@/lib/types/budget';

vi.mock('@/hooks/use-local-db', () => ({
  useExpenses: () => ({
    expenses: [],
  }),
}));

describe('BudgetVarianceGrid', () => {
  it('renders budget variance grid and total variance pill', () => {
    render(<BudgetVarianceGrid currency="USD" locale="en" />);
    expect(screen.getByTestId('budget-variance-grid')).toBeInTheDocument();
    expect(screen.getByText('Excel Variance Grid & Spent Ledger')).toBeInTheDocument();
    expect(screen.getAllByText(/Variance/i).length).toBeGreaterThan(0);
  });

  it('renders spent items with correct ingestion source badges', () => {
    const mockExpenses: ExpenseEntry[] = [
      {
        id: '1',
        date: '2026-08-01',
        category: 'food',
        merchant: 'Starbucks',
        amount: 15.5,
        source: 'receipt',
        note: 'Iced Coffee',
      },
      {
        id: '2',
        date: '2026-08-01',
        category: 'transport',
        merchant: 'Uber Ride',
        amount: 25.0,
        source: 'import',
        note: 'Trip to downtown',
      },
      {
        id: '3',
        date: '2026-08-01',
        category: 'utilities',
        merchant: 'Power Bill',
        amount: 120.0,
        source: 'manual',
      },
    ];

    render(<BudgetVarianceGrid expenses={mockExpenses} currency="USD" locale="en" />);

    expect(screen.getByTestId('spent-ledger-table')).toBeInTheDocument();
    expect(screen.getByText('Starbucks')).toBeInTheDocument();
    expect(screen.getByText('Uber Ride')).toBeInTheDocument();
    expect(screen.getByText('Power Bill')).toBeInTheDocument();

    // Ingestion source badges
    expect(screen.getByText(/📸 Photo Receipt/i)).toBeInTheDocument();
    expect(screen.getByText(/📱 SMS\/Email Inbox/i)).toBeInTheDocument();
    expect(screen.getByText(/Manual/i)).toBeInTheDocument();
  });

  it('splits an itemized receipt across its line-item categories instead of one row', () => {
    const mockExpenses: ExpenseEntry[] = [
      {
        id: 'r1',
        date: '2026-08-02',
        category: 'food',
        merchant: 'Checkers Hyper',
        amount: 100,
        source: 'receipt',
        lineItems: [
          { description: 'Groceries', amount: 60, category: 'food' },
          { description: 'Cinema ticket', amount: 40, category: 'entertainment' },
        ],
      },
    ];

    render(<BudgetVarianceGrid expenses={mockExpenses} currency="USD" locale="en" />);

    const foodActual = screen.getByTestId('variance-actual-food');
    const entertainmentActual = screen.getByTestId('variance-actual-entertainment');

    expect(foodActual.textContent).toMatch(/60/);
    expect(entertainmentActual.textContent).toMatch(/40/);
    // The full receipt total must NOT be dumped into the parent category.
    expect(foodActual.textContent).not.toMatch(/100/);
  });

  it('renders receipt line items as child rows under their parent in the ledger', () => {
    const mockExpenses: ExpenseEntry[] = [
      {
        id: 'r1',
        date: '2026-08-02',
        category: 'food',
        merchant: 'Checkers Hyper',
        amount: 100,
        source: 'receipt',
        lineItems: [
          { description: 'Groceries', amount: 60, category: 'food' },
          { description: 'Cinema ticket', amount: 40, category: 'entertainment' },
        ],
      },
    ];

    render(<BudgetVarianceGrid expenses={mockExpenses} currency="USD" locale="en" />);

    expect(screen.getByText('Checkers Hyper')).toBeInTheDocument();
    const childRows = screen.getAllByTestId('ledger-line-item-row');
    expect(childRows).toHaveLength(2);
    expect(childRows[0].textContent).toContain('Groceries');
    expect(childRows[1].textContent).toContain('Cinema ticket');
    expect(childRows[1].textContent).toContain('Entertainment');
  });

  it('does not render child rows when the line-item sum disagrees with the total', () => {
    const mockExpenses: ExpenseEntry[] = [
      {
        id: 'r2',
        date: '2026-08-02',
        category: 'food',
        merchant: 'Mystery Shop',
        amount: 100,
        source: 'receipt',
        lineItems: [{ description: 'Partial scan', amount: 12, category: 'food' }],
      },
    ];

    render(<BudgetVarianceGrid expenses={mockExpenses} currency="USD" locale="en" />);

    expect(screen.queryAllByTestId('ledger-line-item-row')).toHaveLength(0);
    expect(screen.getByTestId('variance-actual-food').textContent).toMatch(/100/);
  });
});
