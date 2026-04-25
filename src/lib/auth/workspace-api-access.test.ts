import { beforeEach, describe, expect, it, vi } from "vitest";

function createPublishableKey(host: string) {
  return `pk_test_${Buffer.from(`${host}$`, "utf8").toString("base64url")}`;
}

const authorizeWorkspaceMutationMock = vi.hoisted(() => vi.fn());

vi.mock("./workspace-route-guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./workspace-route-guard")>();

  return {
    ...actual,
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

  it("allows the local demo workspace during local development when Clerk is not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    await expect(resolveWorkspaceApiAccess(localDemoWorkspaceId)).resolves.toEqual({
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("rejects non-demo workspaces when Clerk is not configured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    await expect(resolveWorkspaceApiAccess("workspace-1")).rejects.toMatchObject({
      status: 403,
      reason: "demo_workspace_required",
      message: "Local demo API access is limited to the demo workspace.",
    } satisfies Pick<WorkspaceApiAccessError, "status" | "reason" | "message">);
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("rejects demo access when Clerk is missing in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    await expect(resolveWorkspaceApiAccess(localDemoWorkspaceId)).rejects.toMatchObject({
      status: 503,
      reason: "clerk_configuration_required",
      message: "Clerk authentication is not configured on the server.",
    } satisfies Pick<WorkspaceApiAccessError, "status" | "reason" | "message">);
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("allows the local demo workspace for the stripped Clerk test harness", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BUDGETBITCH_STRIP_CLERK_ENV", "true");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    await expect(resolveWorkspaceApiAccess(localDemoWorkspaceId)).resolves.toEqual({
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });
    expect(authorizeWorkspaceMutationMock).not.toHaveBeenCalled();
  });

  it("delegates to the workspace guard when Clerk is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      createPublishableKey("clerk.budgetbitch.test"),
    );
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
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
    vi.stubEnv(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      createPublishableKey("clerk.budgetbitch.test"),
    );
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    authorizeWorkspaceMutationMock.mockRejectedValue(
      new WorkspaceRouteGuardError(
        "No local user profile exists for the authenticated Clerk user.",
        404,
        "local_profile_required",
      ),
    );

    await expect(resolveWorkspaceApiAccess("workspace-1")).rejects.toMatchObject({
      status: 404,
      reason: "local_profile_required",
      message: "No local user profile exists for the authenticated Clerk user.",
    } satisfies Pick<WorkspaceApiAccessError, "status" | "reason" | "message">);
  });
});