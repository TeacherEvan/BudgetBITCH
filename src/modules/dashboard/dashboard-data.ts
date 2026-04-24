import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { getPrismaClient } from "@/lib/prisma";
import {
  createSeededDashboardBriefing,
  loadDashboardBriefing,
} from "@/modules/dashboard/briefing/fetch-briefing";
import type { DashboardBriefingSnapshot } from "@/modules/dashboard/briefing/types";
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
  briefing: DashboardBriefingSnapshot;
  dailyCheckIn: DashboardDailyCheckInState;
  isDemo: boolean;
  launcherTools: DashboardLauncherTool[];
  launchProfile: DashboardLaunchProfile | null;
  localAreaLabel: string;
  matchedRequestedWorkspace: boolean;
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

  return {
    activeWorkspace: resolution.activeWorkspace,
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
    localAreaLabel: "Dublin",
    matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
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
  if (!process.env.DATABASE_URL?.trim() || !isClerkConfigured()) {
    return { kind: "data", data: buildDemoData(requestedWorkspaceId) };
  }

  const redirectTarget = getDashboardRedirectTarget(requestedWorkspaceId);
  const { userId } = await auth();

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

  if (!resolution.activeWorkspace) {
    return {
      kind: "data",
      data: {
        activeWorkspace: null,
        briefing,
        dailyCheckIn: buildEmptyCheckIn(today),
        isDemo: false,
        launcherTools: buildLauncherTools(),
        launchProfile: null,
        localAreaLabel: "Local area",
        matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
        requestedWorkspaceId: resolution.requestedWorkspaceId,
        resolutionSource: resolution.resolutionSource,
        userDisplayName: profile.displayName,
        workspaces,
      },
    };
  }

  const todayCheckIn = await prisma.dailyCheckIn.findUnique({
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
  });

  return {
    kind: "data",
    data: {
      activeWorkspace: resolution.activeWorkspace,
      briefing,
      dailyCheckIn: todayCheckIn
        ? parseCheckInJson(todayCheckIn.checkInJson, todayCheckIn.updatedAt, today)
        : buildEmptyCheckIn(today),
      isDemo: false,
      launcherTools: buildLauncherTools(),
      launchProfile: null,
      localAreaLabel: resolution.activeWorkspace.name,
      matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
      requestedWorkspaceId: resolution.requestedWorkspaceId,
      resolutionSource: resolution.resolutionSource,
      userDisplayName: profile.displayName,
      workspaces,
    },
  };
}
