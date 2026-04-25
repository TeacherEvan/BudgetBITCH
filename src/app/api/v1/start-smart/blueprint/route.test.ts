import { beforeEach, describe, expect, it, vi } from "vitest";

const createProfileMock = vi.fn();
const createRegionalSnapshotMock = vi.fn();
const createBlueprintSnapshotMock = vi.fn();
const resolveWorkspaceApiAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    startSmartProfile: {
      create: createProfileMock,
    },
    regionalSnapshot: {
      create: createRegionalSnapshotMock,
    },
    moneyBlueprintSnapshot: {
      create: createBlueprintSnapshotMock,
    },
  }),
}));

vi.mock("@/lib/auth/workspace-api-access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/workspace-api-access")>();

  return {
    ...actual,
    resolveWorkspaceApiAccess: resolveWorkspaceApiAccessMock,
  };
});

import {
  localDemoWorkspaceId,
  WorkspaceApiAccessError,
} from "@/lib/auth/workspace-api-access";
import { POST } from "./route";

function createBlueprintRequest(workspaceId: string) {
  return new Request(
    "http://localhost/api/v1/start-smart/blueprint",
    {
      method: "POST",
      body: JSON.stringify({
        workspaceId,
        templateId: "young_adult",
        answers: {
          countryCode: "US",
          stateCode: "CA",
          ageBand: "young_adult",
          housing: "renting",
          dependents: 0,
          pets: 0,
          incomePattern: "steady",
          debtLoad: "low",
          goals: ["emergency_fund"],
          benefitsSupport: ["none"],
          preferredIntegrations: [],
        },
      }),
      headers: { "content-type": "application/json" },
    },
  );
}

describe("POST /api/v1/start-smart/blueprint", () => {
  beforeEach(() => {
    createProfileMock.mockReset();
    createRegionalSnapshotMock.mockReset();
    createBlueprintSnapshotMock.mockReset();
    resolveWorkspaceApiAccessMock.mockReset();
  });

  it("returns a generated blueprint payload for authorized access", async () => {
    resolveWorkspaceApiAccessMock.mockResolvedValue({
      workspaceId: "trusted_ws",
      accessMode: "authenticated",
      actorUserId: "profile_123",
      role: "editor",
    });
    createProfileMock.mockResolvedValue({ id: "profile_123" });
    createRegionalSnapshotMock.mockResolvedValue({ id: "regional_123" });
    createBlueprintSnapshotMock.mockResolvedValue({ id: "blueprint_123" });

    const request = createBlueprintRequest("raw_ws");

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(resolveWorkspaceApiAccessMock).toHaveBeenCalledWith("raw_ws");
    expect(createProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workspaceId: "trusted_ws" }),
      }),
    );
    expect(createRegionalSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workspaceId: "trusted_ws" }),
      }),
    );
    expect(createBlueprintSnapshotMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workspaceId: "trusted_ws" }),
      }),
    );
    expect(json.blueprint.priorityStack.length).toBeGreaterThan(0);
    expect(json.persistence).toEqual({
      persisted: true,
      profileId: "profile_123",
    });
  });

  it("returns a 401 response for unauthenticated live access", async () => {
    resolveWorkspaceApiAccessMock.mockRejectedValue(
      new WorkspaceApiAccessError(
        "Authentication is required.",
        401,
        "unauthenticated",
      ),
    );

    const response = await POST(createBlueprintRequest("ws_123"));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({
      error: {
        reason: "unauthenticated",
        message: expect.any(String),
      },
    });
    expect(createProfileMock).not.toHaveBeenCalled();
    expect(createRegionalSnapshotMock).not.toHaveBeenCalled();
    expect(createBlueprintSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns a 403 response for authenticated non-members", async () => {
    resolveWorkspaceApiAccessMock.mockRejectedValue(
      new WorkspaceApiAccessError(
        "The authenticated user is not a member of this workspace.",
        403,
        "workspace_membership_required",
      ),
    );

    const response = await POST(createBlueprintRequest("ws_123"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      error: {
        reason: "workspace_membership_required",
        message: expect.any(String),
      },
    });
    expect(createProfileMock).not.toHaveBeenCalled();
    expect(createRegionalSnapshotMock).not.toHaveBeenCalled();
    expect(createBlueprintSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns a non-persisted result when profile persistence fails", async () => {
    resolveWorkspaceApiAccessMock.mockResolvedValue({
      workspaceId: "trusted_ws",
      accessMode: "authenticated",
      actorUserId: "profile_123",
      role: "editor",
    });
    createProfileMock.mockRejectedValueOnce(new Error("profile write failed"));

    const response = await POST(createBlueprintRequest("raw_ws"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(resolveWorkspaceApiAccessMock).toHaveBeenCalledWith("raw_ws");
    expect(json.persistence).toEqual({
      persisted: false,
      reason: "profile write failed",
    });
    expect(createRegionalSnapshotMock).not.toHaveBeenCalled();
    expect(createBlueprintSnapshotMock).not.toHaveBeenCalled();
  });

  it("allows the approved no-Clerk demo workspace path", async () => {
    resolveWorkspaceApiAccessMock.mockResolvedValue({
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });
    createProfileMock.mockResolvedValue({ id: "profile_123" });
    createRegionalSnapshotMock.mockResolvedValue({ id: "regional_123" });
    createBlueprintSnapshotMock.mockResolvedValue({ id: "blueprint_123" });

    const response = await POST(createBlueprintRequest(localDemoWorkspaceId));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(resolveWorkspaceApiAccessMock).toHaveBeenCalledWith(localDemoWorkspaceId);
    expect(createProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ workspaceId: localDemoWorkspaceId }),
      }),
    );
    expect(json.persistence).toEqual({
      persisted: true,
      profileId: "profile_123",
    });
  });

  it("rejects arbitrary no-Clerk workspace access", async () => {
    resolveWorkspaceApiAccessMock.mockRejectedValue(
      new WorkspaceApiAccessError(
        "Local demo API access is limited to the demo workspace.",
        403,
        "demo_workspace_required",
      ),
    );

    const response = await POST(createBlueprintRequest("ws_123"));
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({
      error: {
        reason: "demo_workspace_required",
        message: expect.any(String),
      },
    });
    expect(createProfileMock).not.toHaveBeenCalled();
    expect(createRegionalSnapshotMock).not.toHaveBeenCalled();
    expect(createBlueprintSnapshotMock).not.toHaveBeenCalled();
  });
});
