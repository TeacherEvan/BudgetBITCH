import { render, screen } from "@testing-library/react";
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

import LearnPage from "./page";

describe("LearnPage", () => {
  beforeEach(() => {
    getCurrentWorkspaceAccessMock.mockReset();
    getLatestBlueprintSignalsForWorkspaceMock.mockReset();
  });

  it("renders learn recommendations from the active workspace blueprint", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_learn_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintSignalsForWorkspaceMock.mockResolvedValue({
      priorityStack: ["reduce_debt_damage"],
      riskWarnings: ["benefits_change_risk"],
      next7Days: ["collect renewal paperwork"],
      learnModuleKeys: ["benefits_protection", "debt_triage"],
    });

    render(await LearnPage());

    expect(screen.getByText("Learn!")).toBeInTheDocument();
    expect(
      screen.getByText("Comic-strip lessons for the money move that matters next."),
    ).toBeInTheDocument();
    expect(getLatestBlueprintSignalsForWorkspaceMock).toHaveBeenCalledWith("ws_learn_123");
    expect(screen.getAllByText("Benefits Protection").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Debt Triage").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/your blueprint flags benefits-change risk/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Three fast scenes to anchor the idea" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/a filing cabinet goblin keeps moving your documents/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /audit benefits deadlines/i })).toHaveAttribute(
      "href",
      "/learn/benefits-protection",
    );
  });

  it("keeps the seeded learn fallback when the latest blueprint read is unavailable", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_learn_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintSignalsForWorkspaceMock.mockRejectedValue(
      Object.assign(new Error("DATABASE_URL is not configured for Prisma runtime access."), {
        name: "PrismaClientInitializationError",
      }),
    );

    render(await LearnPage());

    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next up" })).toBeInTheDocument();
    expect(screen.getAllByText("Budgeting Basics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Money Behavior").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/a raccoon CFO keeps approving snack subscriptions/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /review your essentials/i })).toHaveAttribute(
      "href",
      "/learn/budgeting-basics",
    );
    expect(screen.getByRole("link", { name: /change one money trigger/i })).toHaveAttribute(
      "href",
      "/learn/money-behavior",
    );
  });

  it("falls back generically when workspace access is denied", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: false,
      status: 403,
      reason: "workspace_forbidden",
    });

    render(await LearnPage());

    expect(getLatestBlueprintSignalsForWorkspaceMock).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();
    expect(screen.getAllByText("Budgeting Basics").length).toBeGreaterThan(0);
    expect(screen.getByText(/matched to your current blueprint priorities/i)).toBeInTheDocument();
  });

  it("falls back generically when no latest blueprint exists", async () => {
    getCurrentWorkspaceAccessMock.mockResolvedValue({
      allowed: true,
      workspaceId: "ws_learn_123",
      userProfileId: "profile_123",
    });
    getLatestBlueprintSignalsForWorkspaceMock.mockResolvedValue(null);

    render(await LearnPage());

    expect(getLatestBlueprintSignalsForWorkspaceMock).toHaveBeenCalledWith("ws_learn_123");
    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();
    expect(screen.getAllByText("Budgeting Basics").length).toBeGreaterThan(0);
    expect(screen.getByText(/matched to your current blueprint priorities/i)).toBeInTheDocument();
  });
});
