// lib/types/budget.ts

/** Wizard answers — stored locally, snapshotted to Convex daily */
export interface WizardProfile {
  completed: true;
  completedAt: string; // ISO
  version: 1;
  locale: 'th' | 'en'; // SET FIRST, NEVER CHANGES WITHOUT USER ACTION
  answers: {
    income: number;           // Q1
    rent: number;             // Q2
    transport: number;        // Q3
    phoneInternet: number;    // Q4
    subscriptions: number;    // Q5
    entertainment: number;    // Q6
    healthcare: number;       // Q7
    savingsRatePct: number;   // Q8 (0-50)
    riskTolerance: 'low' | 'medium' | 'high'; // Q9
    locationConsent: boolean; // Q10
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
  labelTh: string; 
  labelEn: string; 
  icon: string;
  thaiContext: string;
}> = {
  sugar: { 
    labelTh: 'น้ำตาลและขนมหวาน', 
    labelEn: 'Sugar & sweets', 
    icon: '🍬',
    thaiContext: 'ชาเย็น, กาแฟหวาน, เค้ก, ขนมไทย'
  },
  coffee: { 
    labelTh: 'คาเฟ่ทุกวัน', 
    labelEn: 'Daily coffee', 
    icon: '☕',
    thaiContext: 'สตาร์บัคส์, แอมازอน, คาเฟ่ห้องทำงาน'
  },
  takeaways: { 
    labelTh: 'สั่งอาหาร (GrabFood/Foodpanda)', 
    labelEn: 'Takeaways/delivery', 
    icon: '🍕',
    thaiContext: 'สั่งกลับบ้าน/ทำงาน แทนทำกินเอง'
  },
  alcohol: { 
    labelTh: 'แอลกอฮอล์', 
    labelEn: 'Alcohol', 
    icon: '🍺',
    thaiContext: 'เบียร์, เหล้าขาว, ดื่มกับเพื่อน'
  },
  cigarettes_vaping: { 
    labelTh: 'บุหรี่/วูป', 
    labelEn: 'Cigarettes/Vaping', 
    icon: '🚬',
    thaiContext: 'บุหรี่ม้วน, วูป, IQOS'
  },
  streaming: { 
    labelTh: 'สตรีมมิง (Netflix/Disney+/TrueID)', 
    labelEn: 'Streaming subscriptions', 
    icon: '📺',
    thaiContext: 'Netflix, Disney+, HBO GO, TrueID, Viu'
  },
  ride_hailing: { 
    labelTh: 'แกร็บ/โบลท์', 
    labelEn: 'Ride-hailing (Grab/Bolt)', 
    icon: '🚗',
    thaiContext: 'GrabCar, GrabBike, Bolt, รถเมล์/BTS ที่นั่งสบาย'
  },
  impulse_shopping: { 
    labelTh: 'ช็อปปิ้งอิมพัลส์ (Lazada/Shopee/TikTok Shop)', 
    labelEn: 'Impulse online shopping', 
    icon: '🛍️',
    thaiContext: 'Flash sale, ไลฟ์สดขายของ, ซื้อไม่ได้ลอง'
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
}

export type ExpenseCategory =
  | 'housing' | 'transport' | 'food' | 'utilities'
  | 'phone_internet' | 'subscriptions' | 'entertainment'
  | 'healthcare' | 'insurance' | 'debt' | 'savings' | 'other';

/** Thai-specific category aliases for voice/input */
export const THAI_CATEGORY_ALIASES: Record<string, ExpenseCategory> = {
  'ค่าเช่า': 'housing', 'ค่าคอนโด': 'housing', 'บ้าน': 'housing',
  'ค่าเดินทาง': 'transport', 'บีทีเอส': 'transport', 'รถไฟฟ้า': 'transport', 'แกร็บ': 'transport', 'แกรบ': 'transport', 'กรับ': 'transport', 'น้ำมัน': 'transport',
  'ค่าอาหาร': 'food', 'กินข้าว': 'food',
  'ค่าน้ำค่าไฟ': 'utilities', 'อินเตอร์เน็ต': 'phone_internet', 'โทรศัพท์': 'phone_internet',
  'สมัครสมาชิก': 'subscriptions', 'เน็ตฟลิกซ์': 'subscriptions', 'สปอตตี้': 'subscriptions',
  'บันเทิง': 'entertainment', 'ดูหนัง': 'entertainment', 'เล่นเกม': 'entertainment',
  'ค่ายา': 'healthcare', 'ทันตกรรม': 'healthcare', 'โรงพยาบาล': 'healthcare',
  'ประกัน': 'insurance', 'หนี้': 'debt', 'เงินกู้': 'debt', 'บัตรเครดิต': 'debt',
  'ออม': 'savings', 'กองทุน': 'savings',
};

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
  locale: 'th' | 'en';
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
  budgets: BudgetCategory[];
  bills: Bill[];
  savingsGoals: SavingsGoal[];
  netWorthSnapshots: NetWorthSnapshot[];
  debts: Debt[];
  criticalExpenseCommitments: CriticalExpenseCommitment[];
}

/** Fired on window whenever a shared-store mutation changes the local board. */
export const BOARD_CHANGED_EVENT = 'budgetbitch:localBoardChanged';

export function notifyBoardChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(BOARD_CHANGED_EVENT));
}