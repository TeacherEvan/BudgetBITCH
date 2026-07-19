// lib/utils/compound-calculator.ts
import type { WizardProfile } from '@/lib/types/budget';

/**
 * Compound savings calculator for Critical Expenses feature
 * Calculates future value of monthly savings invested at a given rate
 */

export interface CompoundProjection {
  oneYear: number;
  fiveYears: number;
  tenYears: number;
}

export interface CompoundCalculatorOptions {
  monthlySavings: number;     // Amount saved per month by cutting the expense
  annualRate?: number;        // Annual interest rate (default 7% = 0.07)
  compoundFrequency?: number; // Times per year (default 12 = monthly)
}

/**
 * Calculate compound interest projections
 * Formula: FV = P * [((1 + r/n)^(nt) - 1) / (r/n)]
 * Where:
 * - P = monthly payment (monthlySavings)
 * - r = annual rate
 * - n = compound frequency per year
 * - t = years
 */
export function calculateCompoundProjection(options: CompoundCalculatorOptions): CompoundProjection {
  const { monthlySavings, annualRate = 0.07, compoundFrequency = 12 } = options;
  
  if (monthlySavings <= 0 || annualRate <= 0) {
    return { oneYear: 0, fiveYears: 0, tenYears: 0 };
  }

  const monthlyRate = annualRate / compoundFrequency;
  
  const calculateForYears = (years: number): number => {
    const periods = years * compoundFrequency;
    if (monthlyRate === 0) return monthlySavings * periods;
    
    const factor = Math.pow(1 + monthlyRate, periods) - 1;
    const futureValue = monthlySavings * (factor / monthlyRate);
    return Math.round(futureValue);
  };

  return {
    oneYear: calculateForYears(1),
    fiveYears: calculateForYears(5),
    tenYears: calculateForYears(10),
  };
}

/**
 * Format currency for display (THB or USD)
 */
export function formatCurrency(
  amount: number,
  locale: 'th' | 'en' = 'en',
  currency?: import('@/lib/utils/currency').CurrencyCode | null,
): string {
  const resolved = currency === undefined ? (locale === 'th' ? 'THB' : 'USD') : currency;
  const localeTag = locale === 'th' ? 'th-TH' : 'en-US';
  if (resolved === null) {
    return new Intl.NumberFormat(localeTag, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: resolved,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get suggested monthly cost for critical expense based on wizard answers
 */
export function getSuggestedCriticalExpenseCost(
  key: import('@/lib/types/budget').CriticalExpenseKey,
  wizardAnswers: WizardProfile['answers']
): number {
  // Suggest based on relevant wizard answers
  switch (key) {
    case 'sugar':
      return Math.round(wizardAnswers.entertainment * 0.15); // ~15% of entertainment
    case 'coffee':
      return Math.round(wizardAnswers.entertainment * 0.2);  // ~20% of entertainment
    case 'takeaways':
      return Math.round(wizardAnswers.entertainment * 0.4);  // ~40% of entertainment (eating out)
    case 'alcohol':
      return Math.round(wizardAnswers.entertainment * 0.25); // ~25% of entertainment
    case 'cigarettes_vaping':
      return Math.round(wizardAnswers.healthcare * 0.5);     // ~50% of healthcare
    case 'streaming':
      return Math.round(wizardAnswers.subscriptions * 0.6);  // ~60% of subscriptions
    case 'ride_hailing':
      return Math.round(wizardAnswers.transport * 0.4);      // ~40% of transport
    case 'impulse_shopping':
      return Math.round(wizardAnswers.entertainment * 0.3);  // ~30% of entertainment
    default:
      return 0;
  }
}