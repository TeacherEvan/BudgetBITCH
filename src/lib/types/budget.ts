// lib/types/budget.ts

/** Wizard answers — stored locally, snapshotted to Convex daily */
export interface WizardProfile {
  completed: true;
  completedAt: string; // ISO
  version: 1;
  locale: string | 'en-ZA' | 'en-TH'; // SET FIRST, NEVER CHANGES WITHOUT USER ACTION
  answers: {
    income: number;           // Step 1
    locationConsent: boolean; // Step 2
    receiptScanned?: boolean; // Step 3
    rent?: number;             // Optional (deprecated 10-step wizard)
    transport?: number;        // Optional
    phoneInternet?: number;    // Optional
    subscriptions?: number;    // Optional
    entertainment?: number;    // Optional
    healthcare?: number;       // Optional
    savingsRatePct?: number;   // Optional (0-50)
    riskTolerance?: 'low' | 'medium' | 'high'; // Optional
    currency: import('@/lib/utils/currency').CurrencyCode | null; // from locale or location
  };
}

/** Critical expense commitment — one per month */
export interface CriticalExpenseCommitment {
  month: string; // '2026-06'
  expenseKey: CriticalExpenseKey;
  estimatedMonthlyCost: number; // user enters this
  committedAt: string;
  status: 'active' | 'completed' | 'failed';
  compoundProjection: { // auto-calculated
    oneYear: number;
    fiveYears: number;
    tenYears: number;
  };
}

export type CriticalExpenseKey =
  | 'sugar'
  | 'coffee'
  | 'takeaways'
  | 'alcohol'
  | 'cigarettes_vaping'
  | 'streaming'
  | 'ride_hailing'
  | 'impulse_shopping';

export const CRITICAL_EXPENSES: Record<CriticalExpenseKey, {
  labelEn: string; 
  icon: string;
}> = {
  sugar: {
    labelEn: 'Sugar & sweets', 
    icon: '🍬',
  },
  coffee: {
    labelEn: 'Daily coffee', 
    icon: '☕',
  },
  takeaways: {
    labelEn: 'Takeaways/delivery', 
    icon: '🍕',
  },
  alcohol: {
    labelEn: 'Alcohol', 
    icon: '🍺',
  },
  cigarettes_vaping: {
    labelEn: 'Cigarettes/Vaping', 
    icon: '🚬',
  },
  streaming: {
    labelEn: 'Streaming subscriptions', 
    icon: '📺',
  },
  ride_hailing: {
    labelEn: 'Ride-hailing (Grab/Bolt)', 
    icon: '🚗',
  },
  impulse_shopping: {
    labelEn: 'Impulse online shopping', 
    icon: '🛍️',
  },
};

/** Expense entry — local only */
export interface ExpenseEntry {
  id: string; // uuid
  date: string; // ISO date
  category: ExpenseCategory;
  merchant: string;
  amount: number; // positive
  note?: string;
  isRecurring?: boolean;
  recurringId?: string; // for subscription detection
  source: 'manual' | 'voice' | 'import';
  cycle?: 'monthly' | 'yearly'; // for subscriptions
  createdBy?: string; // shared-account: creator user id
  createdByName?: string; // shared-account: creator display name
}

export type ExpenseCategory =
  | 'housing' | 'transport' | 'food' | 'utilities'
  | 'phone_internet' | 'subscriptions' | 'entertainment'
  | 'healthcare' | 'insurance' | 'debt' | 'savings' | 'other';

export type IncomeCategory =
  | 'salary'
  | 'freelance'
  | 'business'
  | 'investments'
  | 'gift'
  | 'refund'
  | 'other';

export type IncomeFrequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface IncomeEntry {
  id: string; // uuid
  date: string; // YYYY-MM-DD
  source: string; // Payer / Description
  amount: number; // positive
  category: IncomeCategory;
  frequency: IncomeFrequency;
  taxDeducted?: number; // Optional gross vs net calculation
  note?: string;
  entrySource?: 'manual' | 'voice' | 'import';
  createdBy?: string; // shared-account: creator user id
  createdByName?: string; // shared-account: creator display name
  createdAt: string;
}

/** Budget category with limit */
export interface BudgetCategory {
  category: ExpenseCategory;
  monthlyLimit: number;
  alertAtPct: number; // e.g., 80
}

/** Bill reminder */
export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  category: ExpenseCategory;
  isActive: boolean;
  reminderDaysBefore: number; // default 3
}

/** Savings goal */
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO
  category: 'emergency' | 'vacation' | 'purchase' | 'investment' | 'other';
  autoAllocate?: number; // monthly auto-transfer
}

/** Net worth snapshot */
export interface NetWorthSnapshot {
  date: string; // ISO
  assets: { id: string; name: string; value: number; type: 'cash' | 'investment' | 'property' | 'vehicle' | 'gold' | 'crypto' | 'other' }[];
  liabilities: { id: string; name: string; value: number; type: 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other' }[];
  netWorth: number;
}

/** Debt for payoff planner */
export interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number; // annual percentage rate
  minimumPayment: number;
  type: 'credit_card' | 'personal_loan' | 'car_loan' | 'mortgage' | 'family' | 'other';
}

/** RSS news item */
export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  category: 'finance' | 'economy' | 'local' | 'eco_tips' | 'fuel' | 'deals';
  locale: string;
  actionable?: string; // e.g., "Fill up today - price drops tomorrow"
}

/** Location cache */
export interface LocationCache {
  lat: number;
  lon: number;
  city: string;
  province: string;
  /** ISO 3166-1 alpha-2 country code (e.g. 'TH', 'GB', 'JP', 'SG'). */
  country: string | null;
  timestamp: number;
  timezone: string;
}

/**
 * The subset of the local board that is shared between two linked users.
 * Voice/locale settings, news cache, and location cache stay user-local.
 */
export interface BoardSnapshot {
  wizardProfile: WizardProfile | null;
  expenses: ExpenseEntry[];
  incomes?: IncomeEntry[];
  budgets: BudgetCategory[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  netWorthSnapshots: NetWorthSnapshot[];
  debts: Debt[];
  criticalExpenseCommitments: CriticalExpenseCommitment[];
}

/** Fired on window whenever a shared-store mutation changes the local board. */
export const BOARD_CHANGED_EVENT = 'budgetbitch:localBoardChanged';

export type BoardChangedSource = 'local' | 'remote' | 'switch';

export function notifyBoardChanged(source: BoardChangedSource = 'local'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT, { detail: { source } }));
}