import { beforeEach, describe, expect, it, vi } from "vitest";

const convexAuthNextjsTokenMock = vi.hoisted(() => vi.fn());
const fetchMutationMock = vi.hoisted(() => vi.fn());
const fetchQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: convexAuthNextjsTokenMock,
}));

vi.mock("convex/nextjs", () => ({
  fetchMutation: fetchMutationMock,
  fetchQuery: fetchQueryMock,
}));

import {
  AuthBootstrapError,
  authBootstrapErrorCodes,
  convexProfileSyncErrorMessage,
  getConvexAuthenticatedIdentity,
  isAuthBootstrapError,
  syncConvexLocalProfile,
  toAuthBootstrapErrorResponse,
} from "./convex-session";

describe("getConvexAuthenticatedIdentity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns null when there is no Convex Auth token", async () => {
    convexAuthNextjsTokenMock.mockResolvedValue(null);

    await expect(getConvexAuthenticatedIdentity()).resolves.toBeNull();
    expect(fetchQueryMock).not.toHaveBeenCalled();
  });

  it("wraps Convex identity fetch failures in a structured bootstrap error", async () => {
    convexAuthNextjsTokenMock.mockResolvedValue("convex-token");
    fetchQueryMock.mockRejectedValue(new Error("Convex is unavailable"));

    await expect(getConvexAuthenticatedIdentity()).rejects.toMatchObject({
      name: "AuthBootstrapError",
      code: authBootstrapErrorCodes.convexIdentityFetchFailed,
      status: 503,
      message:
        "BudgetBITCH could not verify your Convex Auth session. Try again in a moment.",
    });
  });
});

describe("syncConvexLocalProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    convexAuthNextjsTokenMock.mockResolvedValue("convex-token");
    fetchMutationMock.mockResolvedValue({ syncedAt: 123 });
  });

  it("requires an authenticated token", async () => {
    process.env.CONVEX_SYNC_SECRET = "budgetbitch-sync-secret";
    convexAuthNextjsTokenMock.mockResolvedValue(null);

    await expect(
      syncConvexLocalProfile({ profileId: "profile-1", displayName: null }),
    ).rejects.toMatchObject({
      code: authBootstrapErrorCodes.authenticationRequired,
      status: 401,
      message: "Authentication is required.",
    });
    expect(fetchMutationMock).not.toHaveBeenCalled();
  });

  it("requires the server-side sync secret", async () => {
    vi.stubEnv("CONVEX_SYNC_SECRET", "");

    await expect(
      syncConvexLocalProfile({ profileId: "profile-1", displayName: null }),
    ).rejects.toMatchObject({
      code: authBootstrapErrorCodes.missingConvexSyncSecret,
      status: 503,
      message: convexProfileSyncErrorMessage,
    });
    expect(fetchMutationMock).not.toHaveBeenCalled();
  });

  it("exposes the missing sync secret as an identifiable bootstrap error", async () => {
    vi.stubEnv("CONVEX_SYNC_SECRET", "");

    try {
      await syncConvexLocalProfile({ profileId: "profile-1", displayName: null });
      throw new Error("Expected syncConvexLocalProfile to reject");
    } catch (error) {
      expect(isAuthBootstrapError(error)).toBe(true);
      expect(error).toBeInstanceOf(AuthBootstrapError);

      if (isAuthBootstrapError(error)) {
        expect(toAuthBootstrapErrorResponse(error)).toEqual({
          error: {
            code: authBootstrapErrorCodes.missingConvexSyncSecret,
            message: convexProfileSyncErrorMessage,
          },
        });
      }
    }
  });

  it("wraps Convex profile sync failures in a structured bootstrap error", async () => {
    process.env.CONVEX_SYNC_SECRET = "budgetbitch-sync-secret";
    fetchMutationMock.mockRejectedValue(new Error("Convex mutation failed"));

    await expect(
      syncConvexLocalProfile({ profileId: "profile-1", displayName: null }),
    ).rejects.toMatchObject({
      code: authBootstrapErrorCodes.convexProfileSyncFailed,
      status: 503,
      message:
        "BudgetBITCH could not sync your local profile with Convex. Try again in a moment.",
    });
  });

  it("sends the trusted sync secret without caller email", async () => {
    process.env.CONVEX_SYNC_SECRET = " budgetbitch-sync-secret ";

    await expect(
      syncConvexLocalProfile({
        profileId: "profile-1",
        displayName: "Alex Example",
      }),
    ).resolves.toEqual({ syncedAt: 123 });

    expect(fetchMutationMock).toHaveBeenCalledWith(
      expect.anything(),
      {
        profileId: "profile-1",
        displayName: "Alex Example",
        syncSecret: "budgetbitch-sync-secret",
      },
      { token: "convex-token" },
    );
  });
});