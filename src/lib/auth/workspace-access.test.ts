import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRequestAuthMock, ensurePersonalWorkspaceForUserMock, findFirstMock } = vi.hoisted(() => ({
  getRequestAuthMock: vi.fn(),
  ensurePersonalWorkspaceForUserMock: vi.fn(),
  findFirstMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    workspaceMember: {
      findFirst: findFirstMock,
    },
  }),
}));

vi.mock("@/modules/workspaces/personal-workspace", () => ({
  ensurePersonalWorkspaceForUser: ensurePersonalWorkspaceForUserMock,
}));

vi.mock("./request-auth", async () => {
  const actual = await vi.importActual<typeof import("./request-auth")>("./request-auth");

  return {
    ...actual,
    getRequestAuth: getRequestAuthMock,
  };
});

import { getCurrentWorkspaceAccess, resolveWorkspaceAccess } from "./workspace-access";

describe("resolveWorkspaceAccess", () => {
  beforeEach(() => {
    getRequestAuthMock.mockReset();
    ensurePersonalWorkspaceForUserMock.mockReset();
    findFirstMock.mockReset();
  });

  it("returns unauthenticated when requestAuth.userId is null", async () => {
    await expect(
      resolveWorkspaceAccess({
        requestAuth: {
          userId: null,
          email: "budget@example.com",
          displayName: "Budget Person",
        },
      }),
    ).resolves.toEqual({
      allowed: false,
      status: 401,
      reason: "unauthenticated",
    });
  });

  it("returns unauthenticated when requestAuth.email is null", async () => {
    await expect(
      resolveWorkspaceAccess({
        requestAuth: {
          userId: "user_live_123",
          email: null,
          displayName: "Budget Person",
        },
      }),
    ).resolves.toEqual({
      allowed: false,
      status: 401,
      reason: "unauthenticated",
    });
  });

  it("provisions a personal workspace when no explicit workspaceId is provided", async () => {
    ensurePersonalWorkspaceForUserMock.mockResolvedValue({
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
      createdWorkspace: true,
    });

    await expect(
      resolveWorkspaceAccess({
        requestAuth: {
          userId: "user_live_123",
          email: "budget@example.com",
          displayName: "Budget Person",
        },
      }),
    ).resolves.toEqual({
      allowed: true,
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
    });

    expect(ensurePersonalWorkspaceForUserMock).toHaveBeenCalledWith(
      expect.any(Object),
      {
        clerkUserId: "user_live_123",
        email: "budget@example.com",
        displayName: "Budget Person",
      },
    );
  });

  it("returns forbidden when the explicit workspace membership is missing", async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(
      resolveWorkspaceAccess({
        requestAuth: {
          userId: "user_live_123",
          email: "budget@example.com",
          displayName: "Budget Person",
        },
        workspaceId: "ws_forbidden",
      }),
    ).resolves.toEqual({
      allowed: false,
      status: 403,
      reason: "workspace_forbidden",
    });
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws_forbidden",
        user: {
          clerkUserId: "user_live_123",
        },
      },
      select: {
        workspaceId: true,
        userId: true,
      },
    });
  });

  it("returns the explicit workspace when membership exists", async () => {
    findFirstMock.mockResolvedValue({
      workspaceId: "ws_allowed",
      userId: "profile_123",
    });

    await expect(
      resolveWorkspaceAccess({
        requestAuth: {
          userId: "user_live_123",
          email: "budget@example.com",
          displayName: "Budget Person",
        },
        workspaceId: "ws_allowed",
      }),
    ).resolves.toEqual({
      allowed: true,
      workspaceId: "ws_allowed",
      userProfileId: "profile_123",
    });
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        workspaceId: "ws_allowed",
        user: {
          clerkUserId: "user_live_123",
        },
      },
      select: {
        workspaceId: true,
        userId: true,
      },
    });
  });
});

describe("getCurrentWorkspaceAccess", () => {
  beforeEach(() => {
    getRequestAuthMock.mockReset();
    ensurePersonalWorkspaceForUserMock.mockReset();
    findFirstMock.mockReset();
  });

  it("uses getRequestAuth before resolving personal workspace access", async () => {
    getRequestAuthMock.mockResolvedValue({
      userId: "user_live_123",
      email: "budget@example.com",
      displayName: "Budget Person",
    });
    ensurePersonalWorkspaceForUserMock.mockResolvedValue({
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
      createdWorkspace: false,
    });

    await expect(getCurrentWorkspaceAccess()).resolves.toEqual({
      allowed: true,
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
    });
    expect(getRequestAuthMock).toHaveBeenCalledTimes(1);
  });
});