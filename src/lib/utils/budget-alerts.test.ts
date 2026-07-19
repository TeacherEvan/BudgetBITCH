// lib/utils/budget-alerts.test.ts
import { describe, it, expect } from 'vitest';
import type { BudgetCategory, ExpenseCategory } from '@/lib/types/budget';
import {
  generateBudgetAlerts,
  getBudgetSummary,
} from './budget-alerts';

const budgets: BudgetCategory[] = [
  { category: 'housing', monthlyLimit: 10000, alertAtPct: 80 },
  { category: 'food', monthlyLimit: 5000, alertAtPct: 80 },
  { category: 'transport', monthlyLimit: 2000, alertAtPct: 80 },
  { category: 'savings', monthlyLimit: 0, alertAtPct: 100 },
];

function expense(category: ExpenseCategory, amount: number) {
  return { category, amount };
}

describe('generateBudgetAlerts', () => {
  it('emits a critical alert when over 100%', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [expense('housing', 12000)],
      'en',
      'THB',
    );
    const critical = alerts.find((a) => a.type === 'critical');
    expect(critical).toBeDefined();
    expect(critical!.message).toContain('Housing over budget');
    expect(critical!.pct).toBe(120);
    expect(critical!.spent).toBe(12000);
    expect(critical!.limit).toBe(10000);
  });

  it('emits a warning when at/above alertAtPct but under 100%', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [expense('food', 4500)], // 90%
      'en',
      'THB',
    );
    const warning = alerts.find((a) => a.type === 'warning');
    expect(warning).toBeDefined();
    expect(warning!.message).toContain('Food approaching limit');
    expect(warning!.pct).toBe(90);
  });

  it('emits a success alert when under 50% and spent > 0', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [expense('transport', 500)], // 25%
      'en',
      'THB',
    );
    const success = alerts.find((a) => a.type === 'success');
    expect(success).toBeDefined();
    expect(success!.message).toContain('Transport on track');
  });

  it('skips categories with no budget (limit 0)', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [expense('savings', 9999)],
      'en',
      'THB',
    );
    expect(alerts.find((a) => a.category === 'savings')).toBeUndefined();
  });

  it('ignores non-positive expense amounts', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [expense('housing', 0), expense('food', -100)],
      'en',
      'THB',
    );
    expect(alerts).toHaveLength(0);
  });

  it('sorts critical before warning before success', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [
        expense('transport', 500), // success
        expense('food', 4500), // warning
        expense('housing', 12000), // critical
      ],
      'en',
      'THB',
    );
    expect(alerts.map((a) => a.type)).toEqual(['critical', 'warning', 'success']);
  });

  it('renders Thai labels under th locale', () => {
    const alerts = generateBudgetAlerts(
      budgets,
      [expense('housing', 12000)],
      'th',
      'THB',
    );
    const critical = alerts.find((a) => a.type === 'critical');
    expect(critical!.message).toContain('ที่อยู่อาศัย');
  });
});

describe('getBudgetSummary', () => {
  it('aggregates totals and category counts', () => {
    const summary = getBudgetSummary(budgets, [
      expense('housing', 12000), // over (120%)
      expense('food', 4500), // near (90%)
      expense('transport', 500), // on track (25%)
    ]);
    expect(summary.totalBudget).toBe(17000); // 10000 + 5000 + 2000
    expect(summary.totalSpent).toBe(17000); // 12000 + 4500 + 500
    expect(summary.totalRemaining).toBe(0);
    expect(summary.savingsRate).toBe(0);
    expect(summary.categoriesOverBudget).toBe(1);
    expect(summary.categoriesNearLimit).toBe(1);
    expect(summary.categoriesOnTrack).toBe(1);
  });

  it('skips zero-limit categories in the totals', () => {
    const summary = getBudgetSummary(budgets, [expense('savings', 5000)]);
    expect(summary.totalBudget).toBe(17000);
    expect(summary.totalSpent).toBe(0);
  });
});
