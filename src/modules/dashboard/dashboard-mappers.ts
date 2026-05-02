import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { buildBudgetSnapshot } from "@/modules/accounting/budget-engine";
import { buildBudgetAdvice } from "@/modules/accounting/advice-engine";
import {
  normalizeUserJobPreference,
  type UserJobPreference,
} from "@/modules/personalization/personalization-schema";
import type { 
  DashboardDailyCheckInState, 
  DashboardCheckInAlert, 
  DashboardAccountingState,
  DashboardPersonalizationState
} from "./types";

const CheckInAlertSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(["warning", "critical"]),
});

const CheckInJsonSchema = z.object({
  headline: z.string().nullable().optional(),
  alerts: z.array(z.unknown()).optional(),
  summary: z.object({
    alertCount: z.number().nullable().optional(),
    cashflow: z.object({
      plannedOutflow: z.number().nullable().optional(),
      netCashflow: z.number().nullable().optional(),
      status: z.enum(["positive", "negative"]).nullable().optional(),
    }).optional(),
  }).optional(),
});

export function parseCheckInJson(
  checkInJson: Prisma.JsonValue,
  updatedAt: Date,
  checkInDate: string,
): DashboardDailyCheckInState {
  const parsed = CheckInJsonSchema.safeParse(checkInJson);
  
  if (!parsed.success) {
    return buildEmptyCheckIn(checkInDate);
  }

  const data = parsed.data;
  const alerts: DashboardCheckInAlert[] = (data.alerts ?? [])
    .map(alert => {
      const result = CheckInAlertSchema.safeParse(alert);
      return result.success ? result.data : null;
    })
    .filter((alert): alert is DashboardCheckInAlert => alert !== null);

  return {
    status: "submitted",
    checkInDate,
    headline: data.headline ?? null,
    plannedSpend: data.summary?.cashflow?.plannedOutflow ?? null,
    alertCount: data.summary?.alertCount ?? alerts.length,
    alerts,
    cashStatus: data.summary?.cashflow?.status ?? null,
    netCashflow: data.summary?.cashflow?.netCashflow ?? null,
    lastSubmittedAt: updatedAt.toISOString(),
  };
}

export function buildEmptyCheckIn(checkInDate: string): DashboardDailyCheckInState {
  return {
    status: "not_started",
    checkInDate,
    headline: null,
    plannedSpend: null,
    alertCount: 0,
    alerts: [],
    cashStatus: null,
    netCashflow: null,
    lastSubmittedAt: null,
  };
}

export function formatLocalArea(city: string, stateCode: string) {
  return `${city}, ${stateCode}`;
}

export function buildPrivacyCommitments() {
  return [
    "No marketing data is recorded or sold.",
    "Email stays private and is only used for account authority, sign-in, and verification.",
    "Personalization stays user-only and is not shared with brokers or third-party advertisers.",
    "Home location stores city and state only.",
  ];
}

export function buildEmptyAccounting(today: string): DashboardAccountingState {
  const snapshot = buildBudgetSnapshot({
    categories: [],
    expenses: [],
    bills: [],
    accounts: [],
  });

  return {
    snapshot,
    advice: buildBudgetAdvice(snapshot),
    expenseForm: {
      workspaceId: null,
      accountOptions: [],
      categoryOptions: [],
      defaultOccurredAt: today,
    },
    recentExpenses: [],
  };
}

export function buildPersonalizationState(profile: {
  personalizationProfile?: {
    genderIdentity: string | null;
    pronouns: string | null;
    communicationStyle: string | null;
    coachingIntensity: string | null;
    privacyVersion: string | null;
    consentedAt: Date | null;
  } | null;
  jobPreferences?: Array<Partial<UserJobPreference> | null | undefined>;
}): DashboardPersonalizationState {
  const consented = profile.personalizationProfile?.consentedAt !== null;
  const jobPrefs = profile.jobPreferences?.[0] ?? {
    roleInterests: [],
    certifications: [],
    licenseTypes: [],
  };

  return {
    profile: profile.personalizationProfile
      ? {
          genderIdentity: consented ? profile.personalizationProfile.genderIdentity : null,
          pronouns: consented ? profile.personalizationProfile.pronouns : null,
          communicationStyle: consented ? profile.personalizationProfile.communicationStyle : null,
          coachingIntensity: consented ? profile.personalizationProfile.coachingIntensity : null,
          privacyVersion: profile.personalizationProfile.privacyVersion,
          consented,
        }
      : null,
    jobPreferences: normalizeUserJobPreference(jobPrefs),
  };
}

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export function buildAccountingState(input: {
  workspaceId: string;
  today: string;
  categories: Array<{ id: string; name: string; monthlyLimit: Prisma.Decimal | number }>;
  accounts: Array<{ id: string; name: string; balance: Prisma.Decimal | number }>;
  bills: Array<{ id: string; title: string; amount: Prisma.Decimal | number; dueDate: Date }>;
  currentPeriodTransactions: Array<{
    id: string;
    amount: Prisma.Decimal | number;
    occurredAt: Date;
    merchantName: string | null;
    budgetCategoryId: string | null;
    budgetCategory?: { name: string } | null;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: Prisma.Decimal | number;
    occurredAt: Date;
    merchantName: string | null;
    budgetCategoryId: string | null;
    budgetCategory?: { name: string } | null;
  }>;
}): DashboardAccountingState {
  const todayDate = new Date(`${input.today}T00:00:00.000Z`);
  const snapshot = buildBudgetSnapshot({
    categories: input.categories.map((category) => ({
      id: category.id,
      name: category.name,
      monthlyLimit: toNumber(category.monthlyLimit),
    })),
    expenses: input.currentPeriodTransactions.map((transaction) => ({
      budgetCategoryId: transaction.budgetCategoryId,
      amount: toNumber(transaction.amount),
    })),
    bills: input.bills.map((bill) => ({
      id: bill.id,
      title: bill.title,
      amount: toNumber(bill.amount),
      dueInDays: Math.max(
        0,
        Math.ceil((bill.dueDate.getTime() - todayDate.getTime()) / (24 * 60 * 60 * 1000)),
      ),
    })),
    accounts: input.accounts.map((account) => ({
      balance: toNumber(account.balance),
    })),
  });

  return {
    snapshot,
    advice: buildBudgetAdvice(snapshot),
    expenseForm: {
      workspaceId: input.workspaceId,
      accountOptions: input.accounts.map((account) => ({ value: account.id, label: account.name })),
      categoryOptions: input.categories.map((category) => ({ value: category.id, label: category.name })),
      defaultOccurredAt: input.today,
    },
    recentExpenses: input.recentTransactions
      .slice()
      .sort((left, right) => right.occurredAt.getTime() - left.occurredAt.getTime())
      .slice(0, 5)
      .map((transaction) => ({
        id: transaction.id,
        merchantName: transaction.merchantName,
        amount: toNumber(transaction.amount),
        occurredAt: transaction.occurredAt.toISOString(),
        categoryName: transaction.budgetCategory?.name ?? null,
      })),
  };
}
