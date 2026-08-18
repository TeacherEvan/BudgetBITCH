'use client';

import dynamic from 'next/dynamic';
import { ExpenseTracker } from './expense-tracker';

const BudgetVisual = dynamic(
  () => import('./budget-visual').then((mod) => mod.BudgetVisual),
  {
    ssr: false,
    loading: () => <div className="h-64 bg-white/5 animate-pulse rounded-2xl" />,
  }
);

interface SpendingPanelProps {
  locale?: string;
}

export function SpendingPanel({ locale = 'en' }: SpendingPanelProps) {
  return (
    <div className="space-y-6">
      <ExpenseTracker locale={locale} />
      <div className="border-t border-white/10 pt-4">
        <BudgetVisual />
      </div>
    </div>
  );
}
