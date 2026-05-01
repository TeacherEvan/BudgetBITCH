import { beforeEach, describe, expect, it, vi } from "vitest";

const convexAuthNextjsTokenMock = vi.hoisted(() => vi.fn());
const captureMessageMock = vi.hoisted(() => vi.fn());
const fetchMutationMock = vi.hoisted(() => vi.fn());
const fetchQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@convex-dev/auth/nextjs/server", () => ({
  convexAuthNextjsToken: convexAuthNextjsTokenMock,
}));

vi.mock("convex/nextjs", () => ({
  fetchMutation: fetchMutationMock,
  fetchQuery: fetchQueryMock,
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: captureMessageMock,
}));

import {
  AuthBootstrapError,
  authBootstrapErrorCodes,
  convexProfileSyncErrorMessage,
  getConvexAuthenticatedIdentity,
  isAuthBootstrapError,
  reportAuthBootstrapError,
  syncConvexLocalProfile,
  toAuthBootstrapErrorResponse,
} from "./convex-session";

describe("reportAuthBootstrapError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports handled server bootstrap failures with sanitized metadata", () => {
    const error = new AuthBootstrapError({
      cause: new Error("Convex mutation failed with budgetbitch-sync-secret"),
      code: authBootstrapErrorCodes.missingConvexSyncSecret,
      message: convexProfileSyncErrorMessage,
      status: 503,
    });

    reportAuthBootstrapError(error, {
      operation: "profile-sync",
      surface: "auth-bootstrap-api",
    });

    expect(captureMessageMock).toHaveBeenCalledWith(
      "Handled auth bootstrap error",
      {
        contexts: {
          authBootstrap: {
            causeType: "Error",
            status: 503,
          },
        },
        level: "error",
        tags: {
          authBootstrapCode: authBootstrapErrorCodes.missingConvexSyncSecret,
          authBootstrapOperation: "profile-sync",
          authBootstrapSurface: "auth-bootstrap-api",
        },
      },
    );
    expect(JSON.stringify(captureMessageMock.mock.calls)).not.toContain(
      "budgetbitch-sync-secret",
    );
  });

  it("does not report expected authentication handoffs", () => {
    const error = new AuthBootstrapError({
      code: authBootstrapErrorCodes.authenticationRequired,
      message: "Authentication is required.",
      status: 401,
    });

    reportAuthBootstrapError(error, {
      operation: "profile-sync",
      surface: "auth-continue-page",
    });

    expect(captureMessageMock).not.toHaveBeenCalled();
  });
});

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