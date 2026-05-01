import { afterEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());
const syncConvexLocalProfileMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different auth account is already linked to this local profile.",
);
const missingAuthenticatedUserEmailErrorMessage =
  "BudgetBITCH requires an email-backed account before local setup can finish.";

vi.mock("@/lib/auth/convex-session", () => ({
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
  syncConvexLocalProfile: syncConvexLocalProfileMock,
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
      error: "Authentication is required.",
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
      error: missingAuthenticatedUserEmailErrorMessage,
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
      error: missingAuthenticatedUserEmailErrorMessage,
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
      error: bootstrapUserLinkConflictErrorMessage,
    });
  });
});