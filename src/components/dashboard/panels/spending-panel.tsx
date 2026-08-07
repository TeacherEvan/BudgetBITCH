// components/dashboard/panels/spending-panel.tsx
// Merged Expenses + Budget panel: the tracker list/entry sits above the
// budget overview charts so the user sees what they spent and against what
// budget in one place.
'use client';

import { ExpenseTracker } from './expense-tracker';
import { BudgetVisual } from './budget-visual';

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
