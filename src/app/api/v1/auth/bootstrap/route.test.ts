import { afterEach, describe, expect, it, vi } from "vitest";
import { missingClerkUserEmailErrorMessage } from "@/modules/auth/clerk-user";

const authMock = vi.hoisted(() => vi.fn());
const currentUserMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const clerkConfiguredMock = vi.hoisted(() => vi.fn());
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different Clerk account is already linked to this local profile.",
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

vi.mock("@/lib/auth/clerk-config", () => ({
  clerkConfigurationErrorMessage: "Clerk auth is not configured.",
  isClerkConfigured: clerkConfiguredMock,
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
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a guided error when the Clerk account has no verified email", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: null,
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "unverified" },
      },
      emailAddresses: [{ emailAddress: "alex@example.com", verification: { status: "unverified" } }],
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: missingClerkUserEmailErrorMessage,
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("delegates authenticated email-backed users to bootstrapUser", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(bootstrapUserMock).toHaveBeenCalledWith({
      clerkUserId: "clerk_user_1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    await expect(response.json()).resolves.toEqual({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
  });

  it("does not bootstrap when only an unverified primary email exists", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "unverified" },
      },
      emailAddresses: [],
    });

    const response = await POST();

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: missingClerkUserEmailErrorMessage,
    });
    expect(bootstrapUserMock).not.toHaveBeenCalled();
  });

  it("returns a conflict error when bootstrap finds a Clerk link mismatch", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockRejectedValue(new Error(bootstrapUserLinkConflictErrorMessage));

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: bootstrapUserLinkConflictErrorMessage,
    });
  });
});