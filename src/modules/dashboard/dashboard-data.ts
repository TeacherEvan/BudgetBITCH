import { cookies } from "next/headers";
import { getConvexAuthenticatedIdentity } from "@/lib/auth/convex-session";
import { hasNonProductionSignedInE2eOverrideFromCookieStore } from "@/lib/auth/e2e-auth-override";
import { getPrismaClient } from "@/lib/prisma";
import { loadDashboardBriefing } from "@/modules/dashboard/briefing/fetch-briefing";
import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";
import { resolveActiveWorkspace } from "@/modules/workspaces/active-workspace";
import { listJobs } from "@/modules/jobs/job-catalog";
import { buildJobNotifications } from "@/modules/jobs/job-notification-engine";
import { format } from "date-fns";

import { buildDemoData, buildLauncherTools } from "./dashboard-demo-factory";
import {
  parseCheckInJson,
  buildEmptyCheckIn,
  formatLocalArea,
  buildPrivacyCommitments,
  buildPersonalizationState,
  buildAccountingState,
  buildEmptyAccounting,
} from "./dashboard-mappers";
import type {
  DashboardPageDataResult,
  DashboardLocalSignals,
  DashboardJobPreferenceSummary,
} from "./types";

export * from "./types";

function getTodayIsoDate() {
  return format(new Date(), "yyyy-MM-dd");
}

function getUtcDate(checkInDate: string) {
  return new Date(`${checkInDate}T00:00:00.000Z`);
}

function getUtcMonthRange(checkInDate: string) {
  const [year, month] = checkInDate.split("-").map(Number);

  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function getDashboardRedirectTarget(requestedWorkspaceId?: string | null) {
  const search = requestedWorkspaceId
    ? `?workspaceId=${encodeURIComponent(requestedWorkspaceId)}`
    : "";

  return `/dashboard${search}`;
}

function buildLocalSignals(
  localAreaLabel: string,
  jobPreferences: DashboardJobPreferenceSummary,
  briefing: DashboardBriefingSnapshot | null | undefined,
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
    officialJobSearchHref: `https://www.indeed.com/jobs?q=budget+assistant&l=${encodeURIComponent(localAreaLabel)}`,
    jobMatches: matchedJobs,
    financeHeadlines: (briefing?.topics ?? []).map((topic, index) => ({
      id: `${index}-${topic.label}`,
      title: topic.label,
    })),
  };
}

export async function getDashboardPageData(
  requestedWorkspaceId?: string | null,
): Promise<DashboardPageDataResult> {
  const today = getTodayIsoDate();

  if (!process.env.DATABASE_URL?.trim()) {
    return { kind: "data", data: buildDemoData(today, requestedWorkspaceId, buildLocalSignals) };
  }

  const redirectTarget = getDashboardRedirectTarget(requestedWorkspaceId);
  const identity = await getConvexAuthenticatedIdentity();
  const userId = identity?.tokenIdentifier ?? "";

  if (!userId) {
    const cookieStore = await cookies();

    if (hasNonProductionSignedInE2eOverrideFromCookieStore(cookieStore)) {
      return { kind: "data", data: buildDemoData(today, requestedWorkspaceId, buildLocalSignals) };
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
          workspace: { select: { id: true, name: true } },
        },
      },
      workspacePreferences: {
        select: { workspaceId: true, isDefault: true },
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

  const workspaces = profile.memberships
    .map((m) => ({
      id: m.workspace.id,
      workspaceId: m.workspace.id,
      name: m.workspace.name,
      role: m.role,
      isDefault: profile.workspacePreferences.find((p) => p.workspaceId === m.workspace.id)?.isDefault ?? false,
    }))
    .sort((a, b) => (a.isDefault === b.isDefault ? a.name.localeCompare(b.name) : a.isDefault ? -1 : 1));

  const resolution = resolveActiveWorkspace(workspaces, requestedWorkspaceId);
  const briefing = await loadDashboardBriefing();
  const personalization = buildPersonalizationState(profile);
  const monthRange = getUtcMonthRange(today);

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
      select: { checkInJson: true, updatedAt: true },
    }),
    prisma.workspace.findUnique({
      where: { id: resolution.activeWorkspace.workspaceId },
      select: {
        id: true,
        name: true,
        accounts: { select: { id: true, name: true, balance: true }, orderBy: { name: "asc" } },
        categories: { select: { id: true, name: true, monthlyLimit: true }, orderBy: { name: "asc" } },
        bills: { select: { id: true, title: true, amount: true, dueDate: true }, orderBy: { dueDate: "asc" } },
        homeLocations: {
          select: { city: true, stateCode: true, countryCode: true, source: true, consentedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.financialTransaction.findMany({
      where: {
        workspaceId: resolution.activeWorkspace.workspaceId,
        occurredAt: { gte: monthRange.start, lt: monthRange.end },
      },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        merchantName: true,
        budgetCategoryId: true,
        budgetCategory: { select: { name: true } },
      },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.financialTransaction.findMany({
      where: { workspaceId: resolution.activeWorkspace.workspaceId },
      select: {
        id: true,
        amount: true,
        occurredAt: true,
        merchantName: true,
        budgetCategoryId: true,
        budgetCategory: { select: { name: true } },
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
