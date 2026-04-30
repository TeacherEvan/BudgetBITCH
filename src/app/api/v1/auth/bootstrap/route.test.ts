import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different Clerk account is already linked to this local profile.",
);
const missingAuthenticatedUserEmailErrorMessage =
  "BudgetBITCH requires a verified Google email account before local setup can finish.";

vi.mock("@/auth", () => ({
  auth: authMock,
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
    authMock.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a guided error when the authenticated session has no verified email", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: false,
      },
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: missingAuthenticatedUserEmailErrorMessage,
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("delegates authenticated email-backed users to bootstrapUser", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(bootstrapUserMock).toHaveBeenCalledWith({
      clerkUserId: "google-sub-1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    await expect(response.json()).resolves.toEqual({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
  });

  it("does not bootstrap when the session email is present but not verified", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: false,
      },
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: missingAuthenticatedUserEmailErrorMessage,
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a conflict error when bootstrap finds an account link mismatch", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
    });
    bootstrapUserMock.mockRejectedValue(new Error(bootstrapUserLinkConflictErrorMessage));

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: bootstrapUserLinkConflictErrorMessage,
    });
  });
});