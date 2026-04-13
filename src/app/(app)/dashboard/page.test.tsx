import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentWorkspaceAccessMock, getLatestBlueprintForWorkspaceMock } = vi.hoisted(() => ({
  getCurrentWorkspaceAccessMock: vi.fn(),
  getLatestBlueprintForWorkspaceMock: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: getCurrentWorkspaceAccessMock,
}));

vi.mock("@/modules/start-smart/latest-blueprint", () => ({
  getLatestBlueprintForWorkspace: getLatestBlueprintForWorkspaceMock,
}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => {
    getCurrentWorkspaceAccessMock.mockReset();
    getLatestBlueprintForWorkspaceMock.mockReset();
  });

  it("renders the latest saved blueprint summary for the active workspace", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintForWorkspaceMock.mockResolvedValue({
      priorityStack: ["cover essentials", "stabilize cash flow"],
      riskWarnings: ["high debt pressure"],
      next7Days: ["list all fixed bills", "pause non-essentials"],
      learnModuleKeys: ["budgeting_basics", "debt_triage"],
    });

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: /treasure map/i })).toBeInTheDocument();
    expect(screen.getAllByText(/money survival blueprint/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/cover essentials/i)).toBeInTheDocument();
    expect(screen.getByText(/high debt pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/list all fixed bills/i)).toBeInTheDocument();
    expect(screen.getByText(/budgeting basics/i)).toBeInTheDocument();
    expect(getLatestBlueprintForWorkspaceMock).toHaveBeenCalledWith("ws_123");
  });

  it("renders an empty-state blueprint summary when nothing has been saved yet", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_empty",
      userProfileId: "profile_123",
    });
    getLatestBlueprintForWorkspaceMock.mockResolvedValue(null);

    render(await DashboardPage());

    expect(screen.getByText(/no saved blueprint yet/i)).toBeInTheDocument();
    expect(screen.getByText(/build your first blueprint/i)).toBeInTheDocument();
    expect(screen.getByText(/suggested lessons appear after you save a blueprint/i)).toBeInTheDocument();
  });
});
