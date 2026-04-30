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
  useTranslations: (namespace: string) => (key: string, values?: Record<string, number>) => {
    const translations: Record<string, Record<string, string>> = {
      broadcastBar: {
        kicker: "Local area",
        title: "Local area",
        fallbackTicker: "Budget updates",
      },
      launcherGrid: {
        kicker: "Tools",
        title: "Popular budgeting tools",
        description: "Open the lanes you actually use without stacking another scrolling page.",
      },
      liveBriefing: {
        kicker: "Briefing",
        title: "Live briefing",
        description: "Five trusted topics, three short fields each, trimmed for fast scanning.",
        "sourceStatus.live": "Live",
        "sourceStatus.fallback": "Fallback",
        fieldCount: `${values?.count ?? 0} fields`,
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
      description:
        "Keep the city label, the tool deck, and the live briefing in one visible window.",
      workspaceLabel: "Workspace",
      cityLabel: "City",
      motionLabel: "Motion",
      currentModeEyebrow: "Current mode",
      checkInSubmitted: "Submitted today",
      checkInNeeded: "Needs today’s check-in",
      demoWorkspace:
        "Demo workspace context is showing until a live membership is available.",
      liveMembership: "Live membership is synced.",
      windowProfileEyebrow: "Window profile",
      layoutLabel: "Layout",
      motionValueLabel: "Motion",
      noWorkspaceSelected: "No workspace selected",
      noWorkspaceRole: "none",
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
            name: "Household",
            role: "editor",
            isDefault: true,
          },
          {
            id: "workspace-2",
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
    expect(screen.getByRole("heading", { name: /local area/i })).toBeInTheDocument();
    expect(screen.getByText(/dublin/i, { selector: "p.bb-mini-copy" })).toBeInTheDocument();
    expect(screen.getByText("CA, United States")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /popular budgeting tools/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /live briefing/i })).toBeInTheDocument();
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
