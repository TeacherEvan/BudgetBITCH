import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOME_LOCATION_STORAGE_KEY } from "@/modules/home-location/home-location";

const getDashboardPageData = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/modules/dashboard/dashboard-data", () => ({
  getDashboardPageData,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string, values?: Record<string, number>) => {
    const translations: Record<string, Record<string, string>> = {
      broadcastBar: {
        kicker: "Local area",
        title: "Local area",
        fallbackTicker: "Budget updates",
      },
      dailyCheckIn: {
        kicker: "Check-in lane",
        title: "Log today's number",
        description: "One number keeps Acme Studio aligned.",
        liveSubmissionUnavailable: "Live entry locked",
        submitting: "Sending",
        submittedToday: "Sent today",
        readyToSubmit: "Ready now",
        plannedSpendLabel: "Planned spend for today",
        lockedDate: "Locked to Apr 9, 2026 for Acme Studio.",
        disabledHint: "Sign in to send live check-ins.",
        submitButton: "Send today's check-in",
        submittingButton: "Sending check-in",
        emptyHeadline: "No check-in yet for this workspace.",
        noCheckInYet: "No check-in yet.",
        submittedAt: "Sent Apr 9, 9:00 AM.",
        plannedSpendMetric: "Planned spend",
        openAlertsMetric: "Open alerts",
        netCashAfterPlanMetric: "Net cash after plan",
        emptyAlertsTitle: "No alerts yet.",
        emptyAlertsDescription: "Send again when you need a refresh.",
      },
      liveAlerts: {
        kicker: "Alert lane",
        title: "Watch the pressure points",
        description: "Projected alerts land here first.",
        selectWorkspace: "Select a workspace to see alerts.",
        standbyNoUrl: "Standby. Add the Convex URL to enable alerts.",
        standbyNoBridge: "Standby. Realtime auth is not ready yet.",
        loading: "Loading alerts...",
        viewerSync: "Viewer sync in progress. Alerts appear after it finishes.",
        workspaceSync: "Waiting on workspace access sync.",
        empty: "No live alerts yet. They appear after the first projected check-in.",
        checkInDate: "Check-in 2026-04-09",
      },
      launcherGrid: {
        kicker: "Tools",
        title: "Popular budgeting tools",
        description: "Open the next tool without the extra scroll.",
      },
      liveBriefing: {
        kicker: "Briefing",
        title: "Live briefing",
        description: "Trusted topics, trimmed for quick scanning.",
        "sourceStatus.live": "Live",
        "sourceStatus.fallback": "Fallback",
        fieldCount: `${values?.count ?? 0} fields`,
        emptyState: "No briefing topics yet. Check back after the next refresh.",
      },
    };

    return translations[namespace]?.[key] ?? key;
  },
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    dashboardPage: {
      eyebrow: "Dashboard",
      title: "Interactive billboard",
      description: "Keep your workspace, tools, and live signals in one board.",
      workspaceLabel: "Workspace",
      cityLabel: "City",
      motionLabel: "Motion",
      currentModeEyebrow: "Current mode",
      checkInSubmitted: "Checked in",
      checkInNeeded: "Check-in due",
      demoWorkspace: "Demo",
      liveMembership: "Live member",
      windowProfileEyebrow: "Window profile",
      layoutLabel: "Layout",
      motionValueLabel: "Motion",
      noWorkspaceSelected: "No workspace selected",
      noWorkspaceRole: "none",
      homeBaseKicker: "Board anchor",
      homeBaseTitle: "Shared home base",
      homeBaseDescription: "Keep one shared region ready for setup and jobs.",
      homeBaseEmptyState: "No shared region saved yet.",
      homeBaseActionLabel: "Open setup wizard",
    },
  }),
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the billboard shell with the broadcast bar, launcher grid, and live briefing rail", async () => {
    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify({ countryCode: "US", stateCode: "CA" }),
    );

    getDashboardPageData.mockResolvedValue({
      kind: "data",
      data: {
        activeWorkspace: {
          id: "workspace-2",
          workspaceId: "workspace-2",
          name: "Side Hustle",
          role: "owner",
        },
        dailyCheckIn: {
          status: "submitted",
          checkInDate: "2026-04-09",
          headline: "Today is still inside the plan.",
          plannedSpend: 42,
          alertCount: 0,
          alerts: [],
          cashStatus: "positive",
          netCashflow: 310,
          lastSubmittedAt: "2026-04-09T09:00:00.000Z",
        },
        isDemo: false,
        matchedRequestedWorkspace: true,
        requestedWorkspaceId: "workspace-2",
        resolutionSource: "requested",
        userDisplayName: "Avery",
        workspaces: [
          {
            id: "workspace-1",
            workspaceId: "workspace-1",
            name: "Household",
            role: "editor",
            isDefault: true,
          },
          {
            id: "workspace-2",
            workspaceId: "workspace-2",
            name: "Side Hustle",
            role: "owner",
          },
        ],
        launchProfile: {
          city: "Dublin",
          layoutPreset: "launcher_grid",
          motionPreset: "cinematic",
          themePreset: "midnight",
        },
        localAreaLabel: "Dublin",
        launcherTools: [
          {
            title: "Open setup wizard",
            href: "/start-smart",
            detail: "Tune the board before anything else.",
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
        ],
        briefing: {
          generatedAt: "2026-04-10T12:00:00.000Z",
          sourceStatus: "live",
          topics: [],
        },
      },
    });

    const view = await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });
    render(view);

    expect(getDashboardPageData).toHaveBeenCalledWith("workspace-2");
    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /interactive billboard/i })).toBeInTheDocument();
    expect(
      screen.getByText(/keep your workspace, tools, and live signals in one board\./i),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /local area/i })).toBeInTheDocument();
    expect(screen.getByText(/dublin/i, { selector: "p.bb-mini-copy" })).toBeInTheDocument();
    expect(screen.getByText("CA, United States")).toBeInTheDocument();
    expect(screen.getByText(/shared home base/i)).toBeInTheDocument();
    expect(screen.getByText(/keep one shared region ready for setup and jobs\./i)).toBeInTheDocument();
    expect(screen.getByText("Side Hustle")).toBeInTheDocument();
    expect(screen.getByText(/checked in/i)).toBeInTheDocument();
    expect(screen.getByText(/live member/i)).toBeInTheDocument();
    expect(screen.getByText("Budget updates")).toBeInTheDocument();
    expect(screen.queryByText(/budget updates\s+·\s+launcher grid\s+·\s+live briefing/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /popular budgeting tools/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /live briefing/i })).toBeInTheDocument();
    expect(screen.getByText(/no briefing topics yet\. check back after the next refresh\./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /log today's number/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /watch the pressure points/i })).toBeInTheDocument();
    expect(screen.getByText(/projected alerts land here first\./i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open setup wizard/i })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: /open setup wizard/i })[0]).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("link", { name: /open cashflow/i })).toHaveAttribute(
      "href",
      "/cashflow",
    );
  });

  it("redirects anonymous live access to sign-in", async () => {
    getDashboardPageData.mockResolvedValue({
      kind: "auth-required",
      redirectTo: "/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });

    await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/sign-in?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    );
  });

  it("redirects signed-in users without local setup to auth continue", async () => {
    getDashboardPageData.mockResolvedValue({
      kind: "setup-required",
      redirectTo: "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    });

    await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/auth/continue?redirectTo=%2Fdashboard%3FworkspaceId%3Dworkspace-2",
    );
  });
});
