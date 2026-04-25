import { beforeEach, describe, expect, it, vi } from "vitest";

const findLatestBlueprintMock = vi.fn();
const resolveWorkspaceApiAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/workspace-api-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/workspace-api-access")>();

  return {
    ...actual,
    resolveWorkspaceApiAccess: resolveWorkspaceApiAccessMock,
  };
});

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: findLatestBlueprintMock,
    },
  }),
}));

import {
  localDemoWorkspaceId,
  WorkspaceApiAccessError,
} from "@/lib/auth/workspace-api-access";
import { POST } from "./route";

function createJobsRequest(workspaceId: string) {
  return new Request("http://localhost/api/v1/jobs/recommendations", {
    method: "POST",
    body: JSON.stringify({ workspaceId }),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/v1/jobs/recommendations", () => {
  beforeEach(() => {
    findLatestBlueprintMock.mockReset();
    resolveWorkspaceApiAccessMock.mockReset();
    findLatestBlueprintMock.mockResolvedValue({
      blueprintJson: {
        priorityStack: ["cover_essentials", "stabilize_cash_flow"],
        riskWarnings: ["income_volatility_risk"],
        learnModuleKeys: ["income_variability"],
      },
    });
  });

  it("returns ranked jobs based on the latest blueprint for authorized access", async () => {
    resolveWorkspaceApiAccessMock.mockResolvedValue({
      workspaceId: "trusted_workspace",
      accessMode: "authenticated",
      actorUserId: "profile_123",
      role: "editor",
    });

    const response = await POST(createJobsRequest("raw_workspace"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(resolveWorkspaceApiAccessMock).toHaveBeenCalledWith("raw_workspace");
    expect(findLatestBlueprintMock).toHaveBeenCalledWith({
      where: { workspaceId: "trusted_workspace" },
      orderBy: { createdAt: "desc" },
    });
    expect(json.jobs.length).toBeGreaterThan(0);
    expect(json.jobs[0].fitSummary.length).toBeGreaterThan(0);
  });

  it("returns a 401 response for unauthenticated live access", async () => {
    resolveWorkspaceApiAccessMock.mockRejectedValue(
      new WorkspaceApiAccessError(
        "Authentication is required.",
        401,
        "unauthenticated",
      ),
    );

    const response = await POST(createJobsRequest("ws_123"));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({
      error: {
        reason: "unauthenticated",
        message: expect.any(String),
      },
    });
    expect(findLatestBlueprintMock).not.toHaveBeenCalled();
  });

  it("returns a 403 response for authenticated non-members", async () => {
    resolveWorkspaceApiAccessMock.mockRejectedValue(
      new WorkspaceApiAccessError(
        "The authenticated user is not a member of this workspace.",
        403,
        "workspace_membership_required",
      ),
    );

    const response = await POST(createJobsRequest("ws_123"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      error: {
        reason: "workspace_membership_required",
        message: expect.any(String),
      },
    });
    expect(findLatestBlueprintMock).not.toHaveBeenCalled();
  });

  it("allows the approved no-Clerk demo workspace path", async () => {
    resolveWorkspaceApiAccessMock.mockResolvedValue({
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });

    const response = await POST(createJobsRequest(localDemoWorkspaceId));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(resolveWorkspaceApiAccessMock).toHaveBeenCalledWith(localDemoWorkspaceId);
    expect(findLatestBlueprintMock).toHaveBeenCalledWith({
      where: { workspaceId: localDemoWorkspaceId },
      orderBy: { createdAt: "desc" },
    });
    expect(json.jobs.length).toBeGreaterThan(0);
  });

  it("rejects arbitrary no-Clerk workspace access", async () => {
    resolveWorkspaceApiAccessMock.mockRejectedValue(
      new WorkspaceApiAccessError(
        "Local demo API access is limited to the demo workspace.",
        403,
        "demo_workspace_required",
      ),
    );

    const response = await POST(createJobsRequest("ws_123"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      error: {
        reason: "demo_workspace_required",
        message: expect.any(String),
      },
    });
    expect(findLatestBlueprintMock).not.toHaveBeenCalled();
  });
});
