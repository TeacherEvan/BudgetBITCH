import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentWorkspaceAccessMock, getLatestBlueprintSignalsForWorkspaceMock } = vi.hoisted(() => ({
  getCurrentWorkspaceAccessMock: vi.fn(),
  getLatestBlueprintSignalsForWorkspaceMock: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: getCurrentWorkspaceAccessMock,
}));

vi.mock("@/modules/start-smart/latest-blueprint", () => ({
  getLatestBlueprintSignalsForWorkspace: getLatestBlueprintSignalsForWorkspaceMock,
}));

import JobsPage from "./page";

describe("JobsPage", () => {
  beforeEach(() => {
    getCurrentWorkspaceAccessMock.mockReset();
    getLatestBlueprintSignalsForWorkspaceMock.mockReset();
  });

  it("renders scored jobs from the active workspace blueprint", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_jobs_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintSignalsForWorkspaceMock.mockResolvedValue({
      priorityStack: ["build_new_career_path"],
      riskWarnings: [],
      next7Days: ["compare adjacent career ladders"],
      learnModuleKeys: ["labor_income"],
    });

    render(await JobsPage());

    expect(screen.getByText("Jobs")).toBeInTheDocument();
    expect(screen.getByText("Quick job routes for real-life pressure.")).toBeInTheDocument();
    expect(getLatestBlueprintSignalsForWorkspaceMock).toHaveBeenCalledWith("ws_jobs_123");
    expect(screen.getByRole("heading", { name: "Quick route board" })).toBeInTheDocument();
    expect(screen.getByText("Career pivot lane")).toBeInTheDocument();
    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
    expect(screen.getByText("Steady routine lane")).toBeInTheDocument();
    expect(screen.getByText("Junior Payroll Operations Analyst")).toBeInTheDocument();
    expect(screen.getAllByText("$52k-$68k").length).toBeGreaterThan(0);
  });

  it("keeps the seeded job fallback when the latest blueprint read is unavailable", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_jobs_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintSignalsForWorkspaceMock.mockRejectedValue(
      Object.assign(new Error("DATABASE_URL is not configured for Prisma runtime access."), {
        name: "PrismaClientInitializationError",
      }),
    );

    render(await JobsPage());

    expect(screen.getByText("Route brief")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Compact filter summary" })).toBeInTheDocument();
    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
    expect(screen.getByText("Workplace")).toBeInTheDocument();
    expect(screen.getAllByText("remote").length).toBeGreaterThan(0);
    expect(screen.getByText("Salary floor")).toBeInTheDocument();
    expect(screen.getByText("$45,000")).toBeInTheDocument();
    expect(screen.getAllByText("raise income fast").length).toBeGreaterThan(0);
    expect(screen.getAllByText("stabilize schedule").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Steady remote support role with a solid base salary and clear hours."),
    ).toBeInTheDocument();

    const remoteSupportCard = screen
      .getByText("Remote Customer Support Specialist")
      .closest("article");

    expect(remoteSupportCard).not.toBeNull();
    expect(within(remoteSupportCard as HTMLElement).getByText("daytime")).toBeInTheDocument();
    expect(within(remoteSupportCard as HTMLElement).getByText("full time")).toBeInTheDocument();
    expect(
      within(remoteSupportCard as HTMLElement).getByText("Posted 4 days ago"),
    ).toBeInTheDocument();
    expect(within(remoteSupportCard as HTMLElement).getByText("Best for")).toBeInTheDocument();
    expect(
      within(remoteSupportCard as HTMLElement).getByRole("link", {
        name: /open job details/i,
      }),
    ).toHaveAttribute("href", "/jobs/remote-customer-support-specialist");
  });

  it("falls back generically when workspace access is denied", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: false,
      status: 403,
      reason: "workspace_forbidden",
    });

    render(await JobsPage());

    expect(getLatestBlueprintSignalsForWorkspaceMock).not.toHaveBeenCalled();
    expect(screen.getByText("Route brief")).toBeInTheDocument();
    expect(screen.getByText("Remote Customer Support Specialist")).toBeInTheDocument();
    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
  });

  it("falls back generically when no latest blueprint exists", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_jobs_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintSignalsForWorkspaceMock.mockResolvedValue(null);

    render(await JobsPage());

    expect(getLatestBlueprintSignalsForWorkspaceMock).toHaveBeenCalledWith("ws_jobs_123");
    expect(screen.getByText("Route brief")).toBeInTheDocument();
    expect(screen.getByText("Remote Customer Support Specialist")).toBeInTheDocument();
    expect(screen.getByText("Fast cash lane")).toBeInTheDocument();
  });
});
