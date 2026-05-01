import { beforeEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  userProfile: { findUnique: vi.fn() },
  workspaceMember: { findUnique: vi.fn() },
}));

vi.mock("@/lib/auth/convex-session", () => ({
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import {
  IntegrationRouteGuardError,
  authorizeIntegrationMutation,
} from "./integration-route-guard";

describe("authorizeIntegrationMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous requests", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 401,
      message: "Authentication is required.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);
  });

  it("rejects users without a local profile", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue(null);

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 403,
      message: "The authenticated user does not have a local profile.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);
  });

  it("rejects members who cannot manage integrations", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: "editor" });

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 403,
      message: "You do not have permission to manage integrations for this workspace.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);
  });

  it("returns the workspace actor for an owner", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(authorizeIntegrationMutation("workspace-1")).resolves.toEqual({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
    });
  });
});
