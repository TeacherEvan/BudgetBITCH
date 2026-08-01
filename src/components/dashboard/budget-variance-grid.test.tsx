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
});
