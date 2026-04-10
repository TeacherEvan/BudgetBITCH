import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  userProfile: { findUnique: vi.fn() },
  workspaceMember: { findUnique: vi.fn() },
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
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
    vi.unstubAllEnvs();
  });

  it("rejects requests when Clerk is not configured on the server", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 503,
      message: "Clerk authentication is not configured on the server.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);

    expect(authMock).not.toHaveBeenCalled();
  });

  it("rejects anonymous requests", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    authMock.mockResolvedValue({ userId: null });

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 401,
      message: "Authentication is required.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);
  });

  it("rejects users without a local profile", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    authMock.mockResolvedValue({ userId: "user_clerk_1" });
    prismaMock.userProfile.findUnique.mockResolvedValue(null);

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 403,
      message: "The authenticated user does not have a local profile.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);
  });

  it("rejects members who cannot manage integrations", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    authMock.mockResolvedValue({ userId: "user_clerk_1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: "editor" });

    await expect(authorizeIntegrationMutation("workspace-1")).rejects.toMatchObject({
      status: 403,
      message: "You do not have permission to manage integrations for this workspace.",
    } satisfies Pick<IntegrationRouteGuardError, "status" | "message">);
  });

  it("returns the workspace actor for an owner", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    authMock.mockResolvedValue({ userId: "user_clerk_1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.workspaceMember.findUnique.mockResolvedValue({ role: "owner" });

    await expect(authorizeIntegrationMutation("workspace-1")).resolves.toEqual({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
    });
  });
});
