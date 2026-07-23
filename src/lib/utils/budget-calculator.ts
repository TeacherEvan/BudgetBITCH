// lib/utils/budget-calculator.ts
import type { WizardProfile, ExpenseCategory, BudgetCategory } from '@/lib/types/budget';

/** Budget category limits derived from wizard answers */
export interface CalculatedBudget {
  category: ExpenseCategory;
  monthlyLimit: number;
  alertAtPct: number;
}

/** Complete budget calculation result */
export interface BudgetCalculationResult {
  income: number;
  totalFixedExpenses: number;
  savingsTarget: number;
  remainingDisposable: number;
  dailyDisposable: number;
  budgets: CalculatedBudget[];
  breakdown: {
    rent: number;
    transport: number;
    phoneInternet: number;
    subscriptions: number;
    entertainment: number;
    healthcare: number;
  };
}

/** Calculate budget from wizard profile */
export function calculateBudgetFromWizard(profile: WizardProfile): BudgetCalculationResult {
  const answers = profile.answers;
  const income = answers.income;
  
  // Fixed monthly expenses from wizard
  const rent = answers.rent || 0;
  const transport = answers.transport || 0;
  const phoneInternet = answers.phoneInternet || 0;
  const subscriptions = answers.subscriptions || 0;
  const entertainment = answers.entertainment || 0;
  const healthcare = answers.healthcare || 0;
  
  const totalFixedExpenses = rent + transport + phoneInternet + subscriptions + entertainment + healthcare;
  
  // Savings target based on savings rate percentage (0% default when omitted)
  const savingsRatePct = answers.savingsRatePct !== undefined ? Math.min(Math.max(answers.savingsRatePct, 0), 50) : 0;
  const savingsTarget = Math.round(income * (savingsRatePct / 100));
  
  // Remaining after fixed expenses and savings
  const remainingDisposable = income - totalFixedExpenses - savingsTarget;
  const dailyDisposable = Math.max(0, Math.round(remainingDisposable / 30));
  
  // Budget categories with limits derived from wizard + risk tolerance
  const riskMultiplier = getRiskMultiplier(answers.riskTolerance);
  
  // Map wizard answers to budget categories
  const budgets: CalculatedBudget[] = [
    {
      category: 'housing',
      monthlyLimit: Math.round(rent * riskMultiplier),
      alertAtPct: 80,
    },
    {
      category: 'transport',
      monthlyLimit: Math.round(transport * riskMultiplier),
      alertAtPct: 80,
    },
    {
      category: 'phone_internet',
      monthlyLimit: Math.round(phoneInternet * riskMultiplier),
      alertAtPct: 80,
    },
    {
      category: 'subscriptions',
      monthlyLimit: Math.round(subscriptions * riskMultiplier),
      alertAtPct: 80,
    },
    {
      category: 'entertainment',
      monthlyLimit: Math.round(entertainment * riskMultiplier),
      alertAtPct: 80,
    },
    {
      category: 'healthcare',
      monthlyLimit: Math.round(healthcare * riskMultiplier),
      alertAtPct: 80,
    },
    // Default budgets for categories not in wizard
    {
      category: 'food',
      monthlyLimit: Math.round(Math.max(income * 0.15, 5000)),
      alertAtPct: 80,
    },
    {
      category: 'utilities',
      monthlyLimit: Math.round(Math.max(income * 0.05, 1000)),
      alertAtPct: 80,
    },
    {
      category: 'insurance',
      monthlyLimit: Math.round(Math.max(income * 0.03, 500)),
      alertAtPct: 80,
    },
    {
      category: 'savings',
      monthlyLimit: savingsTarget,
      alertAtPct: 100, // Always alert at 100% for savings
    },
    {
      category: 'debt',
      monthlyLimit: 0,
      alertAtPct: 80,
    },
    {
      category: 'other',
      monthlyLimit: Math.round(Math.max(income * 0.05, 1000)),
      alertAtPct: 80,
    },
  ];
  
  return {
    income,
    totalFixedExpenses,
    savingsTarget,
    remainingDisposable,
    dailyDisposable,
    budgets,
    breakdown: {
      rent,
      transport,
      phoneInternet,
      subscriptions,
      entertainment,
      healthcare,
    },
  };
}

/** Get risk multiplier based on tolerance */
function getRiskMultiplier(risk: 'low' | 'medium' | 'high'): number {
  switch (risk) {
    case 'low': return 0.9;   // Conservative - tighter budgets
    case 'high': return 1.1;  // Aggressive - looser budgets
    default: return 1.0;      // Balanced
  }
}

/** Initialize default budgets in IndexedDB from wizard profile */
export async function initializeBudgetsFromWizard(profile: WizardProfile): Promise<void> {
  const { saveBudgetCategory } = await import('@/lib/db/local-db');
  const calculation = calculateBudgetFromWizard(profile);
  
  for (const budget of calculation.budgets) {
    await saveBudgetCategory(budget as BudgetCategory);
  }
}

/** Get emergency fund target (3-6 months of expenses) */
export function calculateEmergencyFundTarget(profile: WizardProfile): number {
  const calculation = calculateBudgetFromWizard(profile);
  const monthlyExpenses = calculation.totalFixedExpenses + calculation.savingsTarget;
  const months = profile.answers.riskTolerance === 'low' ? 6 : 
                 profile.answers.riskTolerance === 'high' ? 3 : 4;
  return monthlyExpenses * months;
}

/** Calculate net worth baseline */
export function calculateNetWorthBaseline(profile: WizardProfile): { assets: number; liabilities: number } {
  const income = profile.answers.income;
  // Rough baseline: 3 months income as liquid assets, 0 liabilities for fresh start
  return {
    assets: income * 3,
    liabilities: 0,
  };
}