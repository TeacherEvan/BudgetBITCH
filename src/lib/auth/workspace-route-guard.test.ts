import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  userProfile: {
    findUnique: vi.fn(),
  },
  workspaceMember: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
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
    vi.unstubAllEnvs();
  });

  it("rejects requests when Clerk is not configured on the server", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 503,
      message: "Clerk authentication is not configured on the server.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "message">);
  });

  it("rejects anonymous requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abcdefghijklmnopqrstuvwxyz012345");
    authMock.mockResolvedValue({ userId: null });

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 401,
      message: "Authentication is required.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "message">);
  });

  it("rejects users without a local profile", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abcdefghijklmnopqrstuvwxyz012345");
    authMock.mockResolvedValue({ userId: "user_clerk_1" });
    prismaMock.userProfile.findUnique.mockResolvedValue(null);

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 404,
      message: "No local user profile exists for the authenticated Clerk user.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "message">);
  });

  it("rejects users without workspace membership", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abcdefghijklmnopqrstuvwxyz012345");
    authMock.mockResolvedValue({ userId: "user_clerk_1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue(null);

    await expect(authorizeWorkspaceMutation("workspace-1")).rejects.toMatchObject({
      status: 403,
      message: "The authenticated user is not a member of this workspace.",
    } satisfies Pick<WorkspaceRouteGuardError, "status" | "message">);
  });

  it("returns the workspace actor for any valid workspace member", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abcdefghijklmnopqrstuvwxyz012345");
    authMock.mockResolvedValue({ userId: "user_clerk_1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: "editor" });

    await expect(authorizeWorkspaceMutation("workspace-1")).resolves.toEqual({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      role: "editor",
    });
  });
});
