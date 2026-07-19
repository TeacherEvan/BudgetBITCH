// lib/utils/budget-calculator.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WizardProfile, ExpenseCategory } from '@/lib/types/budget';
import {
  calculateBudgetFromWizard,
  initializeBudgetsFromWizard,
  calculateEmergencyFundTarget,
  calculateNetWorthBaseline,
} from './budget-calculator';

const mocks = vi.hoisted(() => ({
  saveBudgetCategory: vi.fn(async () => {}),
}));

vi.mock('@/lib/db/local-db', () => ({
  saveBudgetCategory: mocks.saveBudgetCategory,
}));

function makeProfile(overrides: Partial<WizardProfile['answers']> = {}): WizardProfile {
  return {
    completed: true,
    completedAt: '2026-07-19T00:00:00.000Z',
    version: 1,
    locale: 'en',
    answers: {
      income: 100000,
      rent: 20000,
      transport: 5000,
      phoneInternet: 1000,
      subscriptions: 500,
      entertainment: 2000,
      healthcare: 1000,
      savingsRatePct: 20,
      riskTolerance: 'medium',
      locationConsent: true,
      currency: 'THB',
      ...overrides,
    },
  };
}

describe('calculateBudgetFromWizard', () => {
  it('passes income and sums fixed expenses', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    expect(r.income).toBe(100000);
    // 20000 + 5000 + 1000 + 500 + 2000 + 1000
    expect(r.totalFixedExpenses).toBe(29500);
  });

  it('computes savings target from rate (clamped 0-50)', () => {
    // 20% default
    expect(calculateBudgetFromWizard(makeProfile()).savingsTarget).toBe(20000);
    // clamp high
    expect(calculateBudgetFromWizard(makeProfile({ savingsRatePct: 60 })).savingsTarget).toBe(50000);
    // clamp low
    expect(calculateBudgetFromWizard(makeProfile({ savingsRatePct: -10 })).savingsTarget).toBe(0);
  });

  it('computes remaining and daily disposable (floored at 0)', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    // 100000 - 29500 - 20000
    expect(r.remainingDisposable).toBe(50500);
    expect(r.dailyDisposable).toBe(1683); // round(50500 / 30)
  });

  it('floors daily disposable at 0 when remaining is negative', () => {
    const r = calculateBudgetFromWizard(
      makeProfile({ income: 10000, rent: 20000, savingsRatePct: 50 }),
    );
    expect(r.remainingDisposable).toBeLessThan(0);
    expect(r.dailyDisposable).toBe(0);
  });

  it('maps wizard answers to category budgets with risk multiplier', () => {
    const byCat = (
      r: ReturnType<typeof calculateBudgetFromWizard>,
      c: ExpenseCategory,
    ) => r.budgets.find((b) => b.category === c)!;

    const medium = calculateBudgetFromWizard(makeProfile({ riskTolerance: 'medium' }));
    expect(byCat(medium, 'housing').monthlyLimit).toBe(20000); // rent * 1.0
    expect(byCat(medium, 'transport').monthlyLimit).toBe(5000);

    const low = calculateBudgetFromWizard(makeProfile({ riskTolerance: 'low' }));
    expect(byCat(low, 'housing').monthlyLimit).toBe(18000); // rent * 0.9

    const high = calculateBudgetFromWizard(makeProfile({ riskTolerance: 'high' }));
    expect(byCat(high, 'housing').monthlyLimit).toBe(22000); // rent * 1.1
  });

  it('derives non-wizard categories from income', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    const byCat = (c: ExpenseCategory) => r.budgets.find((b) => b.category === c)!;
    expect(byCat('food').monthlyLimit).toBe(15000); // max(income*0.15, 5000)
    expect(byCat('utilities').monthlyLimit).toBe(5000); // max(income*0.05, 1000)
    expect(byCat('insurance').monthlyLimit).toBe(3000); // max(income*0.03, 500)
    expect(byCat('other').monthlyLimit).toBe(5000);
  });

  it('savings budget uses savings target and alerts at 100%', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    const savings = r.budgets.find((b) => b.category === 'savings')!;
    expect(savings.monthlyLimit).toBe(20000);
    expect(savings.alertAtPct).toBe(100);
  });

  it('returns 12 budgets with all categories present', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    expect(r.budgets).toHaveLength(12);
    const cats = r.budgets.map((b) => b.category).sort();
    expect(cats).toEqual(
      ['debt', 'entertainment', 'food', 'healthcare', 'housing', 'insurance',
       'other', 'phone_internet', 'savings', 'subscriptions', 'transport', 'utilities'].sort(),
    );
  });

  it('exposes the expense breakdown', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    expect(r.breakdown).toEqual({
      rent: 20000,
      transport: 5000,
      phoneInternet: 1000,
      subscriptions: 500,
      entertainment: 2000,
      healthcare: 1000,
    });
  });
});

describe('calculateEmergencyFundTarget', () => {
  it('uses 6 months for low risk', () => {
    const r = calculateBudgetFromWizard(makeProfile());
    // (29500 + 20000) * 6
    expect(calculateEmergencyFundTarget(makeProfile({ riskTolerance: 'low' }))).toBe(49500 * 6);
    expect(r).toBeDefined();
  });

  it('uses 4 months for medium risk', () => {
    expect(calculateEmergencyFundTarget(makeProfile({ riskTolerance: 'medium' }))).toBe(49500 * 4);
  });

  it('uses 3 months for high risk', () => {
    expect(calculateEmergencyFundTarget(makeProfile({ riskTolerance: 'high' }))).toBe(49500 * 3);
  });
});

describe('calculateNetWorthBaseline', () => {
  it('estimates assets as 3 months income and zero liabilities', () => {
    const b = calculateNetWorthBaseline(makeProfile({ income: 100000 }));
    expect(b.assets).toBe(300000);
    expect(b.liabilities).toBe(0);
  });
});

describe('initializeBudgetsFromWizard', () => {
  beforeEach(() => {
    mocks.saveBudgetCategory.mockClear();
  });

  it('persists one budget category per calculated budget', async () => {
    await initializeBudgetsFromWizard(makeProfile());
    expect(mocks.saveBudgetCategory).toHaveBeenCalledTimes(12);
  });
});
