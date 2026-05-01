import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { getConvexAuthenticatedIdentity } from "@/lib/auth/convex-session";
import { hasNonProductionSignedInE2eOverrideFromCookieStore } from "@/lib/auth/e2e-auth-override";
import { localDemoWorkspaceId } from "@/lib/auth/workspace-api-access";
import { getPrismaClient } from "@/lib/prisma";
import { buildBudgetAdvice, type BudgetAdviceCard } from "@/modules/accounting/advice-engine";
import { buildBudgetSnapshot } from "@/modules/accounting/budget-engine";
import {
  createSeededDashboardBriefing,
  loadDashboardBriefing,
} from "@/modules/dashboard/briefing/fetch-briefing";
import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";
import { buildJobNotifications } from "@/modules/jobs/job-notification-engine";
import { listJobs } from "@/modules/jobs/job-catalog";
import { normalizeUserJobPreference } from "@/modules/personalization/personalization-schema";
import {
  resolveActiveWorkspace,
  type ActiveWorkspaceResolutionSource,
} from "@/modules/workspaces/active-workspace";
import type { WorkspaceRole } from "@/modules/workspaces/permissions";

export type DashboardWorkspaceOption = {
  id: string;
  workspaceId: string;
  name: string;
  role: WorkspaceRole;
  isDefault?: boolean;
};

export type DashboardCheckInAlert = {
  title: string;
  message: string;
  severity: "warning" | "critical";
};

export type DashboardLaunchProfile = {
  city: string;
  layoutPreset: string;
  motionPreset: string;
  themePreset: string;
};

export type DashboardSelectOption = {
  value: string;
  label: string;
};

export type DashboardRecentExpense = {
  id: string;
  merchantName: string | null;
  amount: number;
  occurredAt: string;
  categoryName: string | null;
};

export type DashboardHomeLocation = {
  city: string;
  stateCode: string;
  countryCode: string;
  label: string;
  source: string;
};

export type DashboardPersonalizationProfile = {
  genderIdentity: string | null;
  pronouns: string | null;
  communicationStyle: string | null;
  coachingIntensity: string | null;
  privacyVersion: string | null;
  consented: boolean;
};

export type DashboardJobPreferenceSummary = ReturnType<typeof normalizeUserJobPreference>;

export type DashboardAccountingState = {
  snapshot: ReturnType<typeof buildBudgetSnapshot>;
  advice: BudgetAdviceCard[];
  expenseForm: {
    workspaceId: string | null;
    accountOptions: DashboardSelectOption[];
    categoryOptions: DashboardSelectOption[];
    defaultOccurredAt: string;
  };
  recentExpenses: DashboardRecentExpense[];
};

export type DashboardLocalSignals = {
  officialJobSearchHref: string;
  jobMatches: ReturnType<typeof buildJobNotifications>;
  financeHeadlines: Array<{
    id: string;
    title: string;
  }>;
};

export type DashboardPersonalizationState = {
  profile: DashboardPersonalizationProfile | null;
  jobPreferences: DashboardJobPreferenceSummary;
};

export type DashboardLauncherTool = {
  title: string;
  href: string;
  detail: string;
  label: string;
};

export type DashboardDailyCheckInState = {
  status: "not_started" | "submitted";
  checkInDate: string;
  headline: string | null;
  plannedSpend: number | null;
  alertCount: number;
  alerts: DashboardCheckInAlert[];
  cashStatus: "positive" | "negative" | null;
  netCashflow: number | null;
  lastSubmittedAt: string | null;
};

export type DashboardPageData = {
  activeWorkspace: DashboardWorkspaceOption | null;
  accounting: DashboardAccountingState;
  briefing: DashboardBriefingSnapshot;
  dailyCheckIn: DashboardDailyCheckInState;
  homeLocation: DashboardHomeLocation | null;
  isDemo: boolean;
  launcherTools: DashboardLauncherTool[];
  launchProfile: DashboardLaunchProfile | null;
  localAreaLabel: string;
  localSignals: DashboardLocalSignals;
  matchedRequestedWorkspace: boolean;
  personalization: DashboardPersonalizationState;
  privacyCommitments: string[];
  requestedWorkspaceId: string | null;
  resolutionSource: ActiveWorkspaceResolutionSource;
  userDisplayName: string | null;
  workspaces: DashboardWorkspaceOption[];
};

export type DashboardPageDataResult =
  | { kind: "data"; data: DashboardPageData }
  | { kind: "auth-required"; redirectTo: string }
  | { kind: "setup-required"; redirectTo: string };

type DashboardCheckInJson = {
  headline?: unknown;
  alerts?: unknown;
  summary?: {
    alertCount?: unknown;
    cashflow?: {
      plannedOutflow?: unknown;
      netCashflow?: unknown;
      status?: unknown;
    };
  };
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getUtcDate(checkInDate: string) {
  return new Date(`${checkInDate}T00:00:00.000Z`);
}

function getMonthWindow(today: string) {
  const [year, month] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));

  return { start, end };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asCashStatus(value: unknown) {
  return value === "positive" || value === "negative" ? value : null;
}

function parseCheckInJson(
  checkInJson: Prisma.JsonValue,
  updatedAt: Date,
  checkInDate: string,
): DashboardDailyCheckInState {
  const record = asRecord(checkInJson) as DashboardCheckInJson | null;
  const summary = asRecord(record?.summary);
  const cashflow = asRecord(summary?.cashflow);
  const alerts = Array.isArray(record?.alerts)
    ? record.alerts
        .map((alert) => {
          const parsedAlert = asRecord(alert);
          const title = asString(parsedAlert?.title);
          const message = asString(parsedAlert?.message);
          const severity =
            parsedAlert?.severity === "warning" || parsedAlert?.severity === "critical"
              ? parsedAlert.severity
              : null;

          if (!title || !message || !severity) {
            return null;
          }

          return { title, message, severity };
        })
        .filter((alert): alert is DashboardCheckInAlert => alert !== null)
    : [];

  return {
    status: "submitted",
    checkInDate,
    headline: asString(record?.headline),
    plannedSpend: asNumber(cashflow?.plannedOutflow),
    alertCount: asNumber(summary?.alertCount) ?? alerts.length,
    alerts,
    cashStatus: asCashStatus(cashflow?.status),
    netCashflow: asNumber(cashflow?.netCashflow),
    lastSubmittedAt: updatedAt.toISOString(),
  };
}

function buildEmptyCheckIn(checkInDate: string): DashboardDailyCheckInState {
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

function getDashboardRedirectTarget(requestedWorkspaceId?: string | null) {
  const search = requestedWorkspaceId
    ? `?workspaceId=${encodeURIComponent(requestedWorkspaceId)}`
    : "";

  return `/dashboard${search}`;
}

function toNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber();
}

function formatLocalArea(city: string, stateCode: string) {
  return `${city}, ${stateCode}`;
}

function buildPrivacyCommitments() {
  return [
    "No marketing data is recorded or sold.",
    "Email stays private and is only used for account authority, sign-in, and verification.",
    "Personalization stays user-only and is not shared with brokers or third-party advertisers.",
    "Home location stores city and state only.",
  ];
}

function buildEmptyJobPreferences(): DashboardJobPreferenceSummary {
  return normalizeUserJobPreference({
    roleInterests: [],
    certifications: [],
    licenseTypes: [],
  });
}

function buildOfficialJobSearchHref(localAreaLabel: string) {
  return `https://www.indeed.com/jobs?q=budget+assistant&l=${encodeURIComponent(localAreaLabel)}`;
}

function buildEmptyAccounting(today: string): DashboardAccountingState {
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

function buildDemoAccounting(today: string): DashboardAccountingState {
  const snapshot = buildBudgetSnapshot({
    categories: [
      { id: "food", name: "Food", monthlyLimit: 420 },
      { id: "transit", name: "Transit", monthlyLimit: 160 },
    ],
    expenses: [
      { budgetCategoryId: "food", amount: 188 },
      { budgetCategoryId: "food", amount: 122 },
      { budgetCategoryId: "transit", amount: 48 },
    ],
    bills: [{ id: "rent", title: "Rent", amount: 950, dueInDays: 4 }],
    accounts: [{ balance: 1640 }],
  });

  return {
    snapshot,
    advice: buildBudgetAdvice(snapshot),
    expenseForm: {
      workspaceId: localDemoWorkspaceId,
      accountOptions: [{ value: "checking", label: "Checking" }],
      categoryOptions: [
        { value: "food", label: "Food" },
        { value: "transit", label: "Transit" },
      ],
      defaultOccurredAt: today,
    },
    recentExpenses: [
      {
        id: "demo-expense-1",
        merchantName: "Market Hall",
        amount: 28.4,
        occurredAt: `${today}T00:00:00.000Z`,
        categoryName: "Food",
      },
    ],
  };
}

function buildLocalSignals(
  localAreaLabel: string,
  jobPreferences: DashboardJobPreferenceSummary,
  briefing: DashboardBriefingSnapshot,
): DashboardLocalSignals {
  const jobs = listJobs();
  const matchedJobs =
    jobPreferences.roleInterests.length > 0 ||
    jobPreferences.certifications.length > 0 ||
    jobPreferences.licenseTypes.length > 0 ||
    jobPreferences.nursingInterest ||
    jobPreferences.teachingInterest ||
    jobPreferences.childCareInterest ||
    jobPreferences.petCareInterest
      ? buildJobNotifications({ preferences: jobPreferences, jobs })
      : jobs.filter((job) => job.location === localAreaLabel || job.workplace === "remote").slice(0, 3).map((job) => ({
          ...job,
          reasons: [job.location === localAreaLabel ? "Matches your saved home area." : "Remote role kept available as a fallback."],
          score: job.location === localAreaLabel ? 80 : 60,
        }));

  return {
    officialJobSearchHref: buildOfficialJobSearchHref(localAreaLabel),
    jobMatches: matchedJobs,
    financeHeadlines: (briefing?.topics ?? []).map((topic, index) => ({
      id: `${index}-${topic.label}`,
      title: topic.label,
    })),
  };
}

function buildPersonalizationState(profile: {
  personalizationProfile?: {
    genderIdentity: string | null;
    pronouns: string | null;
    communicationStyle: string | null;
    coachingIntensity: string | null;
    privacyVersion: string | null;
    consentedAt: Date | null;
  } | null;
  jobPreferences?: Array<{
    roleInterests: string[];
    certifications: string[];
    licenseTypes: string[];
    careWorkInterest: boolean;
    childCareInterest: boolean;
    petCareInterest: boolean;
    nursingInterest: boolean;
    teachingInterest: boolean;
    notificationEnabled: boolean;
  }>;
}): DashboardPersonalizationState {
  const consented = profile.personalizationProfile?.consentedAt !== null;

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
    jobPreferences: normalizeUserJobPreference(profile.jobPreferences?.[0] ?? buildEmptyJobPreferences()),
  };
}

function buildAccountingState(input: {
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


function buildLauncherTools(): DashboardLauncherTool[] {
  return [
    {
      title: "Open setup wizard",
      href: "/start-smart",
      detail: "Tune the window before anything else.",
      label: "Wizard",
    },
    {
      title: "Open Learn",
      href: "/learn",
      detail: "Short lessons when the board needs backup.",
      label: "Learn",
    },
    {
      title: "Open Jobs",
      href: "/jobs",
      detail: "Income options for the current lane.",
      label: "Jobs",
    },
    {
      title: "Open bills",
      href: "/bills",
      detail: "Track due dates and pressure points.",
      label: "Bills",
    },
    {
      title: "Open savings",
      href: "/savings",
      detail: "Grow buffers without adding clutter.",
      label: "Savings",
    },
    {
      title: "Open cashflow",
      href: "/cashflow",
      detail: "See the burn before it gets noisy.",
      label: "Cashflow",
    },
    {
      title: "Open calculator",
      href: "/calculator",
      detail: "Quick arithmetic without leaving the board.",
      label: "Calculator",
    },
    {
      title: "Open notes",
      href: "/notes",
      detail: "Scratchpad for budget thoughts and reminders.",
      label: "Notes",
    },
  ];
}
function buildDemoData(requestedWorkspaceId?: string | null): DashboardPageData {
  const workspaces: DashboardWorkspaceOption[] = [
    {
      id: "workspace-household",
      workspaceId: "workspace-household",
      name: "Household budget",
      role: "editor",
      isDefault: true,
    },
    {
      id: "workspace-side-hustle",
      workspaceId: "workspace-side-hustle",
      name: "Side hustle",
      role: "owner",
    },
    {
      id: "workspace-archive",
      workspaceId: "workspace-archive",
      name: "Archive",
      role: "read_only",
    },
  ];
  const resolution = resolveActiveWorkspace(workspaces, requestedWorkspaceId);
  const today = getTodayIsoDate();
  const briefing = createSeededDashboardBriefing(new Date(today + "T12:00:00.000Z"));
  const homeLocation = {
    city: "Dublin",
    stateCode: "CA",
    countryCode: "US",
    label: "Dublin, CA",
    source: "user_selected",
  } satisfies DashboardHomeLocation;
  const personalization = {
    profile: {
      genderIdentity: "prefer_not_to_say",
      pronouns: "name_only",
      communicationStyle: "balanced",
      coachingIntensity: "focused",
      privacyVersion: "v1",
      consented: true,
    },
    jobPreferences: normalizeUserJobPreference({
      roleInterests: ["bookkeeping"],
      certifications: [],
      licenseTypes: [],
    }),
  } satisfies DashboardPersonalizationState;
  const localAreaLabel = homeLocation.label;

  return {
    activeWorkspace: resolution.activeWorkspace,
    accounting: buildDemoAccounting(today),
    briefing,
    dailyCheckIn:
      resolution.activeWorkspace?.workspaceId === "workspace-side-hustle"
        ? buildEmptyCheckIn(today)
        : {
            status: "submitted",
            checkInDate: today,
            headline: "Today is still inside the plan.",
            plannedSpend: 48,
            alertCount: 0,
            alerts: [],
            cashStatus: "positive",
            netCashflow: 312,
            lastSubmittedAt: new Date(today + "T09:00:00.000Z").toISOString(),
          },
    isDemo: true,
    launcherTools: buildLauncherTools(),
    launchProfile: {
      city: "Dublin",
      layoutPreset: "launcher_grid",
      motionPreset: "cinematic",
      themePreset: "midnight",
    },
    homeLocation,
    localAreaLabel,
    localSignals: buildLocalSignals(localAreaLabel, personalization.jobPreferences, briefing),
    matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
    personalization,
    privacyCommitments: buildPrivacyCommitments(),
    requestedWorkspaceId: resolution.requestedWorkspaceId,
    resolutionSource: resolution.resolutionSource,
    userDisplayName: null,
    workspaces,
  };
}


function buildLiveWorkspaceOptions(profile: {
  memberships: Array<{
    role: WorkspaceRole;
    workspace: {
      id: string;
      name: string;
    };
  }>;
  workspacePreferences: Array<{
    workspaceId: string;
    isDefault: boolean;
  }>;
}) {
  const preferenceByWorkspaceId = new Map(
    profile.workspacePreferences.map((preference) => [preference.workspaceId, preference]),
  );

  return profile.memberships
    .map((membership) => ({
      id: membership.workspace.id,
      workspaceId: membership.workspace.id,
      name: membership.workspace.name,
      role: membership.role,
      isDefault: preferenceByWorkspaceId.get(membership.workspace.id)?.isDefault ?? false,
    }))
    .sort((left, right) => {
      if (left.isDefault && !right.isDefault) {
        return -1;
      }

      if (!left.isDefault && right.isDefault) {
        return 1;
      }

      return left.name.localeCompare(right.name);
    });
}

export async function getDashboardPageData(
  requestedWorkspaceId?: string | null,
): Promise<DashboardPageDataResult> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { kind: "data", data: buildDemoData(requestedWorkspaceId) };
  }

  const redirectTarget = getDashboardRedirectTarget(requestedWorkspaceId);
  const identity = await getConvexAuthenticatedIdentity();
  const userId = identity?.tokenIdentifier ?? "";

  if (!userId) {
    const cookieStore = await cookies();

    if (hasNonProductionSignedInE2eOverrideFromCookieStore(cookieStore)) {
      return { kind: "data", data: buildDemoData(requestedWorkspaceId) };
    }
  }

  if (!userId) {
    return {
      kind: "auth-required",
      redirectTo: `/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`,
    };
  }

  const prisma = getPrismaClient();
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      displayName: true,
      memberships: {
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      workspacePreferences: {
        select: {
          workspaceId: true,
          isDefault: true,
        },
      },
      personalizationProfile: {
        select: {
          genderIdentity: true,
          pronouns: true,
          communicationStyle: true,
          coachingIntensity: true,
          privacyVersion: true,
          consentedAt: true,
        },
      },
      jobPreferences: {
        where: { notificationEnabled: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          roleInterests: true,
          certifications: true,
          licenseTypes: true,
          careWorkInterest: true,
          childCareInterest: true,
          petCareInterest: true,
          nursingInterest: true,
          teachingInterest: true,
          notificationEnabled: true,
        },
      },
    },
  });

  if (!profile) {
    return {
      kind: "setup-required",
      redirectTo: `/auth/continue?redirectTo=${encodeURIComponent(redirectTarget)}`,
    };
  }

  const workspaces = buildLiveWorkspaceOptions(profile);
  const resolution = resolveActiveWorkspace(workspaces, requestedWorkspaceId);
  const today = getTodayIsoDate();
  const briefing = await loadDashboardBriefing();
  const personalization = buildPersonalizationState(profile);
  const monthWindow = getMonthWindow(today);

  if (!resolution.activeWorkspace) {
    const localAreaLabel = "Local area";

    return {
      kind: "data",
      data: {
        activeWorkspace: null,
        accounting: buildEmptyAccounting(today),
        briefing,
        dailyCheckIn: buildEmptyCheckIn(today),
        homeLocation: null,
        isDemo: false,
        launcherTools: buildLauncherTools(),
        launchProfile: null,
        localAreaLabel,
        localSignals: buildLocalSignals(localAreaLabel, personalization.jobPreferences, briefing),
        matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
        personalization,
        privacyCommitments: buildPrivacyCommitments(),
        requestedWorkspaceId: resolution.requestedWorkspaceId,
        resolutionSource: resolution.resolutionSource,
        userDisplayName: profile.displayName,
        workspaces,
      },
    };
  }

  const [todayCheckIn, workspaceDetail, currentPeriodTransactions, recentTransactions] = await Promise.all([
    prisma.dailyCheckIn.findUnique({
      where: {
        workspaceId_checkInDate: {
          workspaceId: resolution.activeWorkspace.workspaceId,
          checkInDate: getUtcDate(today),
        },
      },
      select: {
        checkInJson: true,
        updatedAt: true,
      },
    }),
    prisma.workspace.findUnique({
      where: { id: resolution.activeWorkspace.workspaceId },
      select: {
        id: true,
        name: true,
        accounts: {
          select: {
            id: true,
            name: true,
            balance: true,
          },
          orderBy: { name: "asc" },
        },
        categories: {
          select: {
            id: true,
            name: true,
            monthlyLimit: true,
          },
          orderBy: { name: "asc" },
        },
        bills: {
          select: {
            id: true,
            title: true,
            amount: true,
            dueDate: true,
          },
          orderBy: { dueDate: "asc" },
        },
        homeLocations: {
          select: {
            city: true,
            stateCode: true,
            countryCode: true,
            source: true,
            consentedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.financialTransaction.findMany({
      where: {
        workspaceId: resolution.activeWorkspace.workspaceId,
        occurredAt: {
          gte: monthWindow.start,
          lt: monthWindow.end,
        },
      },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        merchantName: true,
        budgetCategoryId: true,
        budgetCategory: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.financialTransaction.findMany({
      where: {
        workspaceId: resolution.activeWorkspace.workspaceId,
      },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        merchantName: true,
        budgetCategoryId: true,
        budgetCategory: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 5,
    }),
  ]);
  const latestHomeLocation = workspaceDetail?.homeLocations[0] ?? null;
  const homeLocation = latestHomeLocation
    ? {
        city: latestHomeLocation.city,
        stateCode: latestHomeLocation.stateCode,
        countryCode: latestHomeLocation.countryCode,
        label: formatLocalArea(latestHomeLocation.city, latestHomeLocation.stateCode),
        source: latestHomeLocation.source,
      }
    : null;
  const localAreaLabel = homeLocation?.label ?? resolution.activeWorkspace.name;

  return {
    kind: "data",
    data: {
      activeWorkspace: resolution.activeWorkspace,
      accounting: workspaceDetail
        ? buildAccountingState({
            workspaceId: workspaceDetail.id,
            today,
            categories: workspaceDetail.categories,
            accounts: workspaceDetail.accounts,
            bills: workspaceDetail.bills,
            currentPeriodTransactions,
            recentTransactions,
          })
        : buildEmptyAccounting(today),
      briefing,
      dailyCheckIn: todayCheckIn
        ? parseCheckInJson(todayCheckIn.checkInJson, todayCheckIn.updatedAt, today)
        : buildEmptyCheckIn(today),
      homeLocation,
      isDemo: false,
      launcherTools: buildLauncherTools(),
      launchProfile: null,
      localAreaLabel,
      localSignals: buildLocalSignals(localAreaLabel, personalization.jobPreferences, briefing),
      matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
      personalization,
      privacyCommitments: buildPrivacyCommitments(),
      requestedWorkspaceId: resolution.requestedWorkspaceId,
      resolutionSource: resolution.resolutionSource,
      userDisplayName: profile.displayName,
      workspaces,
    },
  };
}
