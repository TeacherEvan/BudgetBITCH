import { beforeEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  userProfile: {
    findUnique: vi.fn(),
  },
  workspaceMember: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/auth/convex-session", () => ({
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import {
  WorkspaceRouteGuardError,
  authorizeWorkspaceMutation,
} from "./workspace-route-guard";

describe("authorizeWorkspaceMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous requests", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 401,
      reason: "unauthenticated",
      message: "Authentication is required.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "reason" | "message">);
  });

  it("rejects users without a local profile", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue(null);

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 404,
      reason: "local_profile_required",
      message: "No local user profile exists for the authenticated account.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "reason" | "message">);
  });

  it("rejects users without workspace membership", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 403,
      reason: "workspace_membership_required",
      message: "The authenticated user is not a member of this workspace.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "reason" | "message">);
  });

  it("returns the workspace actor for any valid workspace member", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: "editor" });

    await expect(authorizeWorkspaceMutation("workspace-1")).resolves.toEqual({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      role: "editor",
    });
  });
});
