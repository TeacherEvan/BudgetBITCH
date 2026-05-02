import type { WorkspaceRole } from "@/modules/workspaces/permissions";
import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";
import { buildBudgetSnapshot } from "@/modules/accounting/budget-engine";
import type { BudgetAdviceCard } from "@/modules/accounting/advice-engine";
import { buildJobNotifications } from "@/modules/jobs/job-notification-engine";
import { normalizeUserJobPreference } from "@/modules/personalization/personalization-schema";
import { ActiveWorkspaceResolutionSource } from "@/modules/workspaces/active-workspace";

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
