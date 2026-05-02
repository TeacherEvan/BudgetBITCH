import { localDemoWorkspaceId } from "@/lib/auth/workspace-api-access";
import { buildBudgetSnapshot } from "@/modules/accounting/budget-engine";
import { buildBudgetAdvice } from "@/modules/accounting/advice-engine";
import { createSeededDashboardBriefing } from "@/modules/dashboard/briefing/fetch-briefing";
import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";
import { resolveActiveWorkspace } from "@/modules/workspaces/active-workspace";
import { normalizeUserJobPreference } from "@/modules/personalization/personalization-schema";
import { 
  buildEmptyCheckIn, 
  buildPrivacyCommitments 
} from "./dashboard-mappers";
import type { 
  DashboardPageData, 
  DashboardWorkspaceOption, 
  DashboardHomeLocation, 
  DashboardPersonalizationState,
  DashboardAccountingState,
  DashboardJobPreferenceSummary,
  DashboardLauncherTool,
  DashboardLocalSignals
} from "./types";

type BuildLocalSignals = (
  localAreaLabel: string,
  jobPreferences: DashboardJobPreferenceSummary,
  briefing: DashboardBriefingSnapshot | null | undefined,
) => DashboardLocalSignals;

export function buildLauncherTools(): DashboardLauncherTool[] {
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

export function buildDemoAccounting(today: string): DashboardAccountingState {
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

export function buildDemoData(
  today: string,
  requestedWorkspaceId?: string | null,
  buildLocalSignals?: BuildLocalSignals,
): DashboardPageData {
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
  const briefing = createSeededDashboardBriefing(new Date(today + "T12:00:00.000Z"));
  const homeLocation = {
    city: "Dublin",
    stateCode: "CA",
    countryCode: "US",
    label: "Dublin, CA",
    source: "user_selected",
  } satisfies DashboardHomeLocation;
  
  const personalization: DashboardPersonalizationState = {
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
  };

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
    localSignals: buildLocalSignals ? buildLocalSignals(localAreaLabel, personalization.jobPreferences, briefing) : {
        officialJobSearchHref: "",
        jobMatches: [],
        financeHeadlines: []
    },
    matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
    personalization,
    privacyCommitments: buildPrivacyCommitments(),
    requestedWorkspaceId: resolution.requestedWorkspaceId,
    resolutionSource: resolution.resolutionSource,
    userDisplayName: null,
    workspaces,
  };
}
