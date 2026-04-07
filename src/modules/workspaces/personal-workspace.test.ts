import { describe, expect, it, vi } from "vitest";

import { ensurePersonalWorkspaceForUser } from "./personal-workspace";

describe("ensurePersonalWorkspaceForUser", () => {
  it("creates a personal workspace when the user has no memberships", async () => {
    const executeRawMock = vi.fn().mockResolvedValue(1);
    const createWorkspaceMemberMock = vi.fn().mockResolvedValue({ id: "member_123" });
    const prisma = {
      $executeRaw: executeRawMock,
      userProfile: {
        upsert: vi.fn().mockResolvedValue({ id: "profile_123" }),
      },
      workspaceMember: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: createWorkspaceMemberMock,
      },
      workspace: {
        create: vi.fn().mockResolvedValue({ id: "ws_personal_123" }),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
    };

    await expect(
      ensurePersonalWorkspaceForUser(prisma as never, {
        clerkUserId: "user_live_123",
        email: "budget@example.com",
        displayName: "Budget Person",
      }),
    ).resolves.toEqual({
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
      createdWorkspace: true,
    });

    expect(executeRawMock).toHaveBeenCalledTimes(1);
    expect(createWorkspaceMemberMock).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws_personal_123",
        userId: "profile_123",
        role: "owner",
      },
    });
  });

  it("returns the existing personal membership when one already exists", async () => {
    const executeRawMock = vi.fn().mockResolvedValue(1);
    const createWorkspaceMock = vi.fn();
    const findFirstMock = vi.fn().mockResolvedValue({ workspaceId: "ws_personal_123" });
    const prisma = {
      $executeRaw: executeRawMock,
      userProfile: {
        upsert: vi.fn().mockResolvedValue({ id: "profile_123" }),
      },
      workspaceMember: {
        findFirst: findFirstMock,
        create: vi.fn(),
      },
      workspace: {
        create: createWorkspaceMock,
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
    };

    await expect(
      ensurePersonalWorkspaceForUser(prisma as never, {
        clerkUserId: "user_live_123",
        email: "budget@example.com",
        displayName: "Budget Person",
      }),
    ).resolves.toEqual({
      workspaceId: "ws_personal_123",
      userProfileId: "profile_123",
      createdWorkspace: false,
    });

    expect(executeRawMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        userId: "profile_123",
        workspace: {
          type: "personal",
        },
      },
      orderBy: { createdAt: "asc" },
      select: { workspaceId: true },
    });
    expect(createWorkspaceMock).not.toHaveBeenCalled();
  });

  it("creates a personal workspace when only non-personal memberships exist", async () => {
    const executeRawMock = vi.fn().mockResolvedValue(1);
    const createWorkspaceMemberMock = vi.fn().mockResolvedValue({ id: "member_123" });
    const findFirstMock = vi.fn().mockResolvedValue(null);
    const prisma = {
      $executeRaw: executeRawMock,
      userProfile: {
        upsert: vi.fn().mockResolvedValue({ id: "profile_123" }),
      },
      workspaceMember: {
        findFirst: findFirstMock,
        create: createWorkspaceMemberMock,
      },
      workspace: {
        create: vi.fn().mockResolvedValue({ id: "ws_personal_456" }),
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(prisma)),
    };

    await expect(
      ensurePersonalWorkspaceForUser(prisma as never, {
        clerkUserId: "user_live_123",
        email: "budget@example.com",
        displayName: "Budget Person",
      }),
    ).resolves.toEqual({
      workspaceId: "ws_personal_456",
      userProfileId: "profile_123",
      createdWorkspace: true,
    });

    expect(executeRawMock).toHaveBeenCalledTimes(1);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: {
        userId: "profile_123",
        workspace: {
          type: "personal",
        },
      },
      orderBy: { createdAt: "asc" },
      select: { workspaceId: true },
    });
    expect(createWorkspaceMemberMock).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws_personal_456",
        userId: "profile_123",
        role: "owner",
      },
    });
  });
});
