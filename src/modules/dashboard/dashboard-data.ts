import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { getPrismaClient } from "@/lib/prisma";
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
  dailyCheckIn: DashboardDailyCheckInState;
  isDemo: boolean;
  matchedRequestedWorkspace: boolean;
  requestedWorkspaceId: string | null;
  resolutionSource: ActiveWorkspaceResolutionSource;
  userDisplayName: string | null;
  workspaces: DashboardWorkspaceOption[];
};

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

  return {
    activeWorkspace: resolution.activeWorkspace,
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
            lastSubmittedAt: new Date(`${today}T09:00:00.000Z`).toISOString(),
          },
    isDemo: true,
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
): Promise<DashboardPageData> {
  if (!process.env.DATABASE_URL?.trim() || !isClerkConfigured()) {
    return buildDemoData(requestedWorkspaceId);
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return buildDemoData(requestedWorkspaceId);
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
      return buildDemoData(requestedWorkspaceId);
    }

    const workspaces = buildLiveWorkspaceOptions(profile);
    const resolution = resolveActiveWorkspace(workspaces, requestedWorkspaceId);
    const today = getTodayIsoDate();

    if (!resolution.activeWorkspace) {
      return {
        activeWorkspace: null,
        dailyCheckIn: buildEmptyCheckIn(today),
        isDemo: false,
        matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
        requestedWorkspaceId: resolution.requestedWorkspaceId,
        resolutionSource: resolution.resolutionSource,
        userDisplayName: profile.displayName,
        workspaces,
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
      activeWorkspace: resolution.activeWorkspace,
      dailyCheckIn: todayCheckIn
        ? parseCheckInJson(todayCheckIn.checkInJson, todayCheckIn.updatedAt, today)
        : buildEmptyCheckIn(today),
      isDemo: false,
      matchedRequestedWorkspace: resolution.matchedRequestedWorkspace,
      requestedWorkspaceId: resolution.requestedWorkspaceId,
      resolutionSource: resolution.resolutionSource,
      userDisplayName: profile.displayName,
      workspaces,
    };
  } catch {
    return buildDemoData(requestedWorkspaceId);
  }
}
