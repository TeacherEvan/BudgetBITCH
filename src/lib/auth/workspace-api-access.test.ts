import { beforeEach, describe, expect, it, vi } from "vitest";

const authorizeWorkspaceMutationMock = vi.hoisted(() => vi.fn());
const WorkspaceRouteGuardErrorMock = vi.hoisted(
  () =>
    class WorkspaceRouteGuardError extends Error {
      constructor(
        message: string,
        public readonly status: number,
        public readonly reason:
          | "unauthenticated"
          | "local_profile_required"
          | "workspace_membership_required",
      ) {
        super(message);
        this.name = "WorkspaceRouteGuardError";
      }
    },
);

vi.mock("./workspace-route-guard", () => {
  return {
    WorkspaceRouteGuardError: WorkspaceRouteGuardErrorMock,
    authorizeWorkspaceMutation: authorizeWorkspaceMutationMock,
  };
});

import {
  localDemoWorkspaceId,
  resolveWorkspaceApiAccess,
  WorkspaceApiAccessError,
} from "./workspace-api-access";
import { WorkspaceRouteGuardError } from "./workspace-route-guard";

describe("resolveWorkspaceApiAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("allows the local demo workspace during local development when auth is not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");

    await expect(resolveWorkspaceApiAccess(localDemoWorkspaceId)).resolves.toEqual({
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("rejects non-demo workspaces when auth is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");

    await expect(resolveWorkspaceApiAccess("workspace-1")).rejects.toMatchObject({
      status: 403,
      reason: "demo_workspace_required",
      message: "Local demo API access is limited to the demo workspace.",
    } satisfies Pick<WorkspaceApiAccessError, "status" | "reason" | "message">);
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("allows the local demo workspace for the stripped auth test harness", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BUDGETBITCH_STRIP_AUTH_ENV", "true");

    await expect(resolveWorkspaceApiAccess(localDemoWorkspaceId)).resolves.toEqual({
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("delegates to the workspace guard outside demo mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    authorizeWorkspaceMutationMock.mockResolvedValue({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      role: "editor",
    });

    await expect(resolveWorkspaceApiAccess("workspace-1")).resolves.toEqual({
      workspaceId: "workspace-1",
      accessMode: "authenticated",
      actorUserId: "profile-1",
      role: "editor",
    });
    expect(authorizeWorkspaceMutationMock).toHaveBeenCalledWith("workspace-1");
  });

  it("preserves the workspace guard reason when delegation fails", async () => {
    vi.stubEnv("NODE_ENV", "production");
    authorizeWorkspaceMutationMock.mockRejectedValue(
      new WorkspaceRouteGuardError(
        "No local user profile exists for the authenticated account.",
        404,
        "local_profile_required",
      ),
    );

    await expect(resolveWorkspaceApiAccess("workspace-1")).rejects.toMatchObject({
      status: 404,
      reason: "local_profile_required",
      message: "No local user profile exists for the authenticated account.",
    } satisfies Pick<WorkspaceApiAccessError, "status" | "reason" | "message">);
  });
});