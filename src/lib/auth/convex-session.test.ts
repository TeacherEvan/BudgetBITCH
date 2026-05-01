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
  convexProfileSyncErrorMessage,
  getConvexAuthenticatedIdentity,
  syncConvexLocalProfile,
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
    ).rejects.toThrow("Authentication is required.");
    expect(fetchMutationMock).not.toHaveBeenCalled();
  });

  it("requires the server-side sync secret", async () => {
    vi.stubEnv("CONVEX_SYNC_SECRET", "");

    await expect(
      syncConvexLocalProfile({ profileId: "profile-1", displayName: null }),
    ).rejects.toThrow(convexProfileSyncErrorMessage);
    expect(fetchMutationMock).not.toHaveBeenCalled();
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