import { afterEach, describe, expect, it, vi } from "vitest";

const authorizeWorkspaceMutation = vi.hoisted(() => vi.fn());
const submitDailyCheckIn = vi.hoisted(() => vi.fn());
const errorClasses = vi.hoisted(() => ({
  WorkspaceRouteGuardError: class WorkspaceRouteGuardError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/auth/workspace-route-guard", () => ({
  authorizeWorkspaceMutation,
  WorkspaceRouteGuardError: errorClasses.WorkspaceRouteGuardError,
}));

vi.mock("@/modules/check-ins/submit-daily-check-in", () => ({
  submitDailyCheckIn,
}));

import { POST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/check-ins", () => {
  it("authorizes the workspace and delegates only trusted fields to the service", async () => {
    authorizeWorkspaceMutation.mockResolvedValue({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      role: "editor",
    });
    submitDailyCheckIn.mockResolvedValue({
      checkInId: "check-in-1",
      status: "completed",
      projection: { status: "pending", dedupeKey: "daily_check_in:workspace-1:2026-04-09" },
    });

    const response = await POST(
      new Request("http://localhost/api/v1/check-ins", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          checkInDate: "2026-04-09",
          plannedSpend: 150,
          categorySpending: [{ categoryId: "cat_food", spent: 260 }],
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authorizeWorkspaceMutation).toHaveBeenCalledWith("workspace-1");
    expect(submitDailyCheckIn).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      checkInDate: "2026-04-09",
      plannedSpend: 150,
      categorySpending: [{ categoryId: "cat_food", spent: 260 }],
    });
  });

  it("returns the route-guard status for unauthorized callers", async () => {
    authorizeWorkspaceMutation.mockRejectedValue(
      new errorClasses.WorkspaceRouteGuardError("Authentication is required.", 401),
    );

    const response = await POST(
      new Request("http://localhost/api/v1/check-ins", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          checkInDate: "2026-04-09",
          plannedSpend: 150,
          categorySpending: [],
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });
});
