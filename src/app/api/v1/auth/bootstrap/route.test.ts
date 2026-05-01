import { afterEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());
const syncConvexLocalProfileMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const authBootstrapErrorCodes = vi.hoisted(() => ({
  authenticationRequired: "authentication-required",
  missingConvexSyncSecret: "missing-convex-sync-secret",
  convexIdentityFetchFailed: "convex-identity-fetch-failed",
  convexProfileSyncFailed: "convex-profile-sync-failed",
}));
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different auth account is already linked to this local profile.",
);
const missingAuthenticatedUserEmailErrorMessage =
  "BudgetBITCH requires an email-backed account before local setup can finish.";
const convexProfileSyncErrorMessage =
  "CONVEX_SYNC_SECRET is not configured for Convex profile sync.";

function makeAuthBootstrapError(input: {
  code: string;
  message: string;
  status: number;
}) {
  const error = new Error(input.message) as Error & {
    code: string;
    status: number;
  };
  error.name = "AuthBootstrapError";
  error.code = input.code;
  error.status = input.status;
  return error;
}

vi.mock("@/lib/auth/convex-session", () => ({
  authBootstrapAuthenticationRequiredMessage: "Authentication is required.",
  authBootstrapErrorCodes,
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
  isAuthBootstrapError: (error: unknown) =>
    error instanceof Error &&
    "code" in error &&
    "status" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    typeof (error as { status: unknown }).status === "number",
  syncConvexLocalProfile: syncConvexLocalProfileMock,
  toAuthBootstrapErrorResponse: (error: { code: string; message: string }) => ({
    error: {
      code: error.code,
      message: error.message,
    },
  }),
}));

vi.mock("@/modules/auth/bootstrap-user", () => ({
  bootstrapUserLinkConflictErrorMessage,
  bootstrapUser: bootstrapUserMock,
}));

import { POST } from "./route";

describe("POST /api/v1/auth/bootstrap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects anonymous requests", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing-session",
        message: "Authentication is required.",
      },
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a structured error when Convex identity lookup fails", async () => {
    getConvexAuthenticatedIdentityMock.mockRejectedValue(
      makeAuthBootstrapError({
        code: authBootstrapErrorCodes.convexIdentityFetchFailed,
        message:
          "BudgetBITCH could not verify your Convex Auth session. Try again in a moment.",
        status: 503,
      }),
    );

    const response = await POST();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "convex-identity-fetch-failed",
        message:
          "BudgetBITCH could not verify your Convex Auth session. Try again in a moment.",
      },
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a guided error when the authenticated session has no verified email", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: null,
      name: "Alex Example",
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing-email",
        message: missingAuthenticatedUserEmailErrorMessage,
      },
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("delegates authenticated email-backed users to bootstrapUser", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
    syncConvexLocalProfileMock.mockResolvedValue({ syncedAt: Date.now() });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(bootstrapUserMock).toHaveBeenCalledWith({
      clerkUserId: "convex|user-1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    expect(syncConvexLocalProfileMock).toHaveBeenCalledWith({
      profileId: "profile-1",
      displayName: "Alex Example",
    });
    await expect(response.json()).resolves.toEqual({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
  });

  it("does not bootstrap when the session email is present but not verified", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "",
      name: "Alex Example",
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing-email",
        message: missingAuthenticatedUserEmailErrorMessage,
      },
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a conflict error when bootstrap finds an account link mismatch", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockRejectedValue(new Error(bootstrapUserLinkConflictErrorMessage));

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "relink-conflict",
        message: bootstrapUserLinkConflictErrorMessage,
      },
    });
  });

  it("returns a structured config error when profile sync is missing its secret", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
    syncConvexLocalProfileMock.mockRejectedValue(
      makeAuthBootstrapError({
        code: authBootstrapErrorCodes.missingConvexSyncSecret,
        message: convexProfileSyncErrorMessage,
        status: 503,
      }),
    );

    const response = await POST();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "missing-convex-sync-secret",
        message: convexProfileSyncErrorMessage,
      },
    });
  });
});
