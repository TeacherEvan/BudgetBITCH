import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentWorkspaceAccessMock } = vi.hoisted(() => ({
  getCurrentWorkspaceAccessMock: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-access", () => ({
  getCurrentWorkspaceAccess: getCurrentWorkspaceAccessMock,
}));

import StartSmartPage from "./page";

describe("StartSmartPage", () => {
  beforeEach(() => {
    getCurrentWorkspaceAccessMock.mockReset();
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_123",
      userProfileId: "profile_123",
    });
  });

  it("renders the compact onboarding headline and first-step controls", async () => {
    render(await StartSmartPage());

    expect(screen.getByText("Build your survival blueprint in one quick pass.")).toBeInTheDocument();
    expect(screen.getAllByText("Single teen").length).toBeGreaterThan(0);
    expect(screen.getByText("Step map")).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /build my survival blueprint/i })).toBeInTheDocument();
  });
});
