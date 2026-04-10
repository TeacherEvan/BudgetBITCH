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

  it("renders the workspace-first dashboard layout with daily check-in and switcher cards", async () => {
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
    });

    const view = await DashboardPage({
      searchParams: Promise.resolve({ workspaceId: "workspace-2" }),
    });
    render(view);

    expect(getDashboardPageData).toHaveBeenCalledWith("workspace-2");
    expect(
      screen.getByRole("heading", { name: /workspace dashboard for side hustle/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/multi-workspace view is on\./i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /submit today's check-in/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /switch workspace/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /watch the pressure points/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /open the next route with context/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open setup wizard/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("link", { name: /open jobs/i })).toHaveAttribute("href", "/jobs");
  });
});
