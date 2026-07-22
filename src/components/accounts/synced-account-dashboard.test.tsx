import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SyncedAccountDashboard } from './synced-account-dashboard';
import type { ExpenseEntry, IncomeEntry } from '@/lib/types/budget';

vi.mock('@/hooks/use-currency', () => ({
  useCurrency: () => (val: number) => `$${val}`,
}));

describe('SyncedAccountDashboard', () => {
  const mockExpenses: ExpenseEntry[] = [
    {
      id: 'e1',
      date: '2026-07-20',
      category: 'food',
      merchant: 'Supermarket',
      amount: 150,
      source: 'manual',
      createdByName: 'Alice',
    },
    {
      id: 'e2',
      date: '2026-07-21',
      category: 'transport',
      merchant: 'Fuel',
      amount: 50,
      source: 'manual',
      createdByName: 'Bob',
    },
  ];

  const mockIncomes: IncomeEntry[] = [
    {
      id: 'i1',
      date: '2026-07-01',
      source: 'Salary',
      amount: 3000,
      category: 'salary',
      frequency: 'monthly',
      createdByName: 'Alice',
      createdAt: '2026-07-01',
    },
    {
      id: 'i2',
      date: '2026-07-02',
      source: 'Freelance',
      amount: 1000,
      category: 'freelance',
      frequency: 'one_time',
      createdByName: 'Bob',
      createdAt: '2026-07-02',
    },
  ];

  it('renders contributor sections and member totals correctly', () => {
    render(
      <SyncedAccountDashboard
        expenses={mockExpenses}
        incomes={mockIncomes}
        locale="en"
        membersCount={2}
      />
    );

    expect(screen.getByText(/Synced Account Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Who Provided Income/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Who Spent What/i).length).toBeGreaterThan(0);

    expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
  });
});
