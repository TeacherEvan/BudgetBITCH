import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getDashboardPageData = vi.hoisted(() => vi.fn());

vi.mock("@/modules/dashboard/dashboard-data", () => ({
  getDashboardPageData,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the billboard shell with the broadcast bar, launcher grid, and live briefing rail", async () => {
    getDashboardPageData.mockResolvedValue({
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
    });

    const view = await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });
    render(view);

    expect(getDashboardPageData).toHaveBeenCalledWith("workspace-2");
    expect(screen.getByRole("heading", { name: /interactive billboard/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /local area/i })).toBeInTheDocument();
    expect(screen.getByText(/dublin/i, { selector: "p.bb-mini-copy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /popular budgeting tools/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /live briefing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open setup wizard/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("link", { name: /open cashflow/i })).toHaveAttribute(
      "href",
      "/cashflow",
    );
  });
});
