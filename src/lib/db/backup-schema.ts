// lib/db/backup-schema.ts
import { z } from 'zod';

// Define schemas for all user data stores to validate on import

const WizardProfileSchema = z.object({
  completed: z.literal(true),
  completedAt: z.string(),
  version: z.literal(1),
  locale: z.enum(['th', 'en']),
  answers: z.object({
    income: z.number(),
    rent: z.number(),
    transport: z.number(),
    phoneInternet: z.number(),
    subscriptions: z.number(),
    entertainment: z.number(),
    healthcare: z.number(),
    savingsRatePct: z.number(),
    riskTolerance: z.enum(['low', 'medium', 'high']),
    locationConsent: z.boolean(),
    currency: z.string().nullable().optional(),
  }),
});

const ExpenseEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  category: z.string(),
  merchant: z.string(),
  amount: z.number(),
  note: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringId: z.string().optional(),
  source: z.enum(['manual', 'voice', 'import']),
  cycle: z.enum(['monthly', 'yearly']).optional(),
});

const IncomeEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  source: z.string(),
  amount: z.number(),
  category: z.enum(['salary', 'freelance', 'business', 'investments', 'gift', 'refund', 'other']),
  frequency: z.enum(['one_time', 'weekly', 'biweekly', 'monthly', 'yearly']),
  taxDeducted: z.number().optional(),
  note: z.string().optional(),
  entrySource: z.enum(['manual', 'voice', 'import']).optional(),
  createdAt: z.string(),
});

const BudgetCategorySchema = z.object({
  category: z.string(),
  monthlyLimit: z.number(),
  alertAtPct: z.number(),
});

const BillSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  dueDay: z.number(),
  category: z.string(),
  isActive: z.boolean(),
  reminderDaysBefore: z.number(),
});

const SavingsGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  targetDate: z.string().optional(),
  category: z.enum(['emergency', 'vacation', 'purchase', 'investment', 'other']),
  autoAllocate: z.number().optional(),
});

const AssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  type: z.enum(['cash', 'investment', 'property', 'vehicle', 'gold', 'crypto', 'other']),
});

const LiabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  type: z.enum(['credit_card', 'personal_loan', 'car_loan', 'mortgage', 'family', 'other']),
});

const NetWorthSnapshotSchema = z.object({
  date: z.string(),
  assets: z.array(AssetSchema),
  liabilities: z.array(LiabilitySchema),
  netWorth: z.number(),
});

const DebtSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
  apr: z.number(),
  minimumPayment: z.number(),
  type: z.enum(['credit_card', 'personal_loan', 'car_loan', 'mortgage', 'family', 'other']),
});

const CriticalExpenseCommitmentSchema = z.object({
  month: z.string(),
  expenseKey: z.string(),
  estimatedMonthlyCost: z.number(),
  committedAt: z.string(),
  status: z.enum(['active', 'completed', 'failed']),
  compoundProjection: z.object({
    oneYear: z.number(),
    fiveYears: z.number(),
    tenYears: z.number(),
  }),
});

const SettingsSchema = z.object({
  preferredLocale: z.enum(['th', 'en']),
  voiceSettings: z.object({
    enabled: z.boolean(),
    rate: z.number(),
    pitch: z.number(),
  }),
  privacyDisclaimerAccepted: z.boolean(),
});

export const BackupDataSchema = z.object({
  wizardProfile: z.array(WizardProfileSchema).optional(),
  expenses: z.array(ExpenseEntrySchema).optional(),
  incomes: z.array(IncomeEntrySchema).optional(),
  budgets: z.array(BudgetCategorySchema).optional(),
  bills: z.array(BillSchema).optional(),
  savingsGoals: z.array(SavingsGoalSchema).optional(),
  netWorthSnapshots: z.array(NetWorthSnapshotSchema).optional(),
  debts: z.array(DebtSchema).optional(),
  criticalExpenseCommitments: z.array(CriticalExpenseCommitmentSchema).optional(),
  settings: z.array(SettingsSchema).optional(),
});

export const BackupPayloadSchema = z.object({
  version: z.literal('1.0'),
  appVersion: z.string(),
  exportedAt: z.string(),
  checksum: z.string(),
  isEncrypted: z.boolean(),
  storeCounts: z.record(z.string(), z.number()),
  data: z.union([BackupDataSchema, z.string()]), // string if encrypted
  cryptoSalt: z.string().optional(),
  cryptoIv: z.string().optional(),
});

export type BackupPayload = z.infer<typeof BackupPayloadSchema>;
export type BackupData = z.infer<typeof BackupDataSchema>;

/**
 * Computes a SHA-256 hash of a string using Web Crypto.
 */
export async function calculateSHA256(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Simple fallback hash for test environment without Web Crypto
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const chr = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }
    return `hash-${hash.toString(16)}`;
  }
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Packs user data into a versioned payload package.
 */
export async function createBackupPayload(
  data: BackupData,
  appVersion = '0.1.0'
): Promise<BackupPayload> {
  const dataString = JSON.stringify(data);
  const checksum = await calculateSHA256(dataString);
  
  const storeCounts: Record<string, number> = {};
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      storeCounts[key] = val.length;
    }
  }

  return {
    version: '1.0',
    appVersion,
    exportedAt: new Date().toISOString(),
    checksum,
    isEncrypted: false,
    storeCounts,
    data,
  };
}

/**
 * Parses and validates an imported backup payload.
 */
export async function parseAndValidateBackup(
  payloadString: string
): Promise<{ data: BackupData; isEncrypted: boolean }> {
  const rawPayload = JSON.parse(payloadString);
  const parsedPayload = BackupPayloadSchema.parse(rawPayload);

  if (parsedPayload.isEncrypted) {
    return {
      data: {} as BackupData, // Client must decrypt first
      isEncrypted: true,
    };
  }

  const dataObj = parsedPayload.data;
  if (typeof dataObj === 'string') {
    throw new Error('Unencrypted backup has payload in string format');
  }

  // Validate data payload integrity
  const dataString = JSON.stringify(dataObj);
  const calculatedChecksum = await calculateSHA256(dataString);
  
  if (calculatedChecksum !== parsedPayload.checksum) {
    throw new Error('Integrity check failed: Backup data checksum mismatch');
  }

  // Validate internal structures
  const validatedData = BackupDataSchema.parse(dataObj);
  return {
    data: validatedData,
    isEncrypted: false,
  };
}
