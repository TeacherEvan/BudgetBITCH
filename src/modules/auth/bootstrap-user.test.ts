import { beforeEach, describe, expect, it, vi } from "vitest";

type UserProfileRecord = {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string | null;
};

type WorkspaceRecord = {
  id: string;
  name: string;
  type: "personal" | "household" | "business";
};

type WorkspaceMemberRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "editor" | "approver" | "read_only";
};

type WorkspaceUserPreferenceRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  isDefault: boolean;
  lastOpenedAt: Date | null;
};

function createPrismaMock() {
  const state = {
    userProfiles: [] as UserProfileRecord[],
    workspaces: [] as WorkspaceRecord[],
    workspaceMembers: [] as WorkspaceMemberRecord[],
    workspaceUserPreferences: [] as WorkspaceUserPreferenceRecord[],
  };

  let nextId = 1;

  function createId(prefix: string) {
    const id = `${prefix}-${nextId}`;
    nextId += 1;
    return id;
  }

  function hydrateProfile(profile: UserProfileRecord) {
    return {
      ...profile,
      memberships: state.workspaceMembers
        .filter((membership) => membership.userId === profile.id)
        .map((membership) => ({
          ...membership,
          workspace: state.workspaces.find((workspace) => workspace.id === membership.workspaceId) ?? null,
        })),
      workspacePreferences: state.workspaceUserPreferences.filter(
        (preference) => preference.userId === profile.id,
      ),
    };
  }

  const prisma = {
    __state: state,
    $transaction: vi.fn(async <T>(callback: (tx: typeof prisma) => Promise<T>) => callback(prisma)),
    $queryRaw: vi.fn(async () => undefined),
    userProfile: {
      findUnique: vi.fn(
        async ({ where }: { where: { clerkUserId?: string; email?: string } }) => {
          const profile = state.userProfiles.find((candidate) => {
            if (where.clerkUserId) {
              return candidate.clerkUserId === where.clerkUserId;
            }

            if (where.email) {
              return candidate.email === where.email;
            }

            return false;
          });

          return profile ? hydrateProfile(profile) : null;
        },
      ),
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { email?: { equals?: string; mode?: string } };
        }) => {
          const email = where.email?.equals;

          if (!email) {
            return null;
          }

          const profile = state.userProfiles.find(
            (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
          );

          return profile ? hydrateProfile(profile) : null;
        },
      ),
      create: vi.fn(
        async ({ data }: { data: Omit<UserProfileRecord, "id"> }) => {
          const profile = {
            id: createId("profile"),
            ...data,
          } satisfies UserProfileRecord;

          state.userProfiles.push(profile);

          return profile;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<Pick<UserProfileRecord, "clerkUserId" | "displayName">>;
        }) => {
          const profile = state.userProfiles.find((candidate) => candidate.id === where.id);

          if (!profile) {
            throw new Error(`Missing profile ${where.id}`);
          }

          Object.assign(profile, data);

          return profile;
        },
      ),
    },
    workspace: {
      create: vi.fn(async ({ data }: { data: Omit<WorkspaceRecord, "id"> }) => {
        const workspace = {
          id: createId("workspace"),
          ...data,
        } satisfies WorkspaceRecord;

        state.workspaces.push(workspace);

        return workspace;
      }),
    },
    workspaceMember: {
      create: vi.fn(async ({ data }: { data: Omit<WorkspaceMemberRecord, "id"> }) => {
        const membership = {
          id: createId("membership"),
          ...data,
        } satisfies WorkspaceMemberRecord;

        state.workspaceMembers.push(membership);

        return membership;
      }),
      upsert: vi.fn(
        async ({
          where,
          update,
          create,
        }: {
          where: { workspaceId_userId: { workspaceId: string; userId: string } };
          update: Partial<Pick<WorkspaceMemberRecord, "role">>;
          create: Omit<WorkspaceMemberRecord, "id">;
        }) => {
          const existingMembership = state.workspaceMembers.find(
            (membership) =>
              membership.workspaceId === where.workspaceId_userId.workspaceId &&
              membership.userId === where.workspaceId_userId.userId,
          );

          if (existingMembership) {
            Object.assign(existingMembership, update);
            return existingMembership;
          }

          const membership = {
            id: createId("membership"),
            ...create,
          } satisfies WorkspaceMemberRecord;

          state.workspaceMembers.push(membership);

          return membership;
        },
      ),
    },
    workspaceUserPreference: {
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: {
            userId: string;
            isDefault: boolean;
            NOT: { workspaceId: string };
          };
          data: Partial<Pick<WorkspaceUserPreferenceRecord, "isDefault">>;
        }) => {
          let count = 0;

          for (const preference of state.workspaceUserPreferences) {
            if (
              preference.userId === where.userId &&
              preference.isDefault === where.isDefault &&
              preference.workspaceId !== where.NOT.workspaceId
            ) {
              Object.assign(preference, data);
              count += 1;
            }
          }

          return { count };
        },
      ),
      upsert: vi.fn(
        async ({
          where,
          update,
          create,
        }: {
          where: { workspaceId_userId: { workspaceId: string; userId: string } };
          update: Partial<Omit<WorkspaceUserPreferenceRecord, "id" | "workspaceId" | "userId">>;
          create: Omit<WorkspaceUserPreferenceRecord, "id">;
        }) => {
          const existingPreference = state.workspaceUserPreferences.find(
            (preference) =>
              preference.workspaceId === where.workspaceId_userId.workspaceId &&
              preference.userId === where.workspaceId_userId.userId,
          );

          if (existingPreference) {
            Object.assign(existingPreference, update);
            return existingPreference;
          }

          const preference = {
            id: createId("preference"),
            ...create,
          } satisfies WorkspaceUserPreferenceRecord;

          state.workspaceUserPreferences.push(preference);

          return preference;
        },
      ),
    },
  };

  return prisma;
}

const prismaMock = vi.hoisted(() => createPrismaMock());

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { bootstrapUser } from "./bootstrap-user";

describe("bootstrapUser", () => {
  beforeEach(() => {
    prismaMock.__state.userProfiles.length = 0;
    prismaMock.__state.workspaces.length = 0;
    prismaMock.__state.workspaceMembers.length = 0;
    prismaMock.__state.workspaceUserPreferences.length = 0;
    prismaMock.$transaction.mockClear();
    prismaMock.$queryRaw.mockClear();
    prismaMock.userProfile.findUnique.mockClear();
    prismaMock.userProfile.findFirst.mockClear();
    prismaMock.userProfile.create.mockClear();
    prismaMock.userProfile.update.mockClear();
    prismaMock.workspace.create.mockClear();
    prismaMock.workspaceMember.create.mockClear();
    prismaMock.workspaceMember.upsert.mockClear();
    prismaMock.workspaceUserPreference.updateMany.mockClear();
    prismaMock.workspaceUserPreference.upsert.mockClear();
  });

  it("creates a local profile, personal workspace, owner membership, and default preference", async () => {
    const result = await bootstrapUser({
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });

    expect(result).toEqual({
      userId: expect.any(String),
      workspaceId: expect.any(String),
    });

    expect(prismaMock.__state.userProfiles).toEqual([
      {
        id: result.userId,
        clerkUserId: "user_clerk_123",
        email: "alex@example.com",
        displayName: "Alex Example",
      },
    ]);

    expect(prismaMock.__state.workspaces).toEqual([
      {
        id: result.workspaceId,
        name: expect.any(String),
        type: "personal",
      },
    ]);

    expect(prismaMock.__state.workspaceMembers).toEqual([
      {
        id: expect.any(String),
        workspaceId: result.workspaceId,
        userId: result.userId,
        role: "owner",
      },
    ]);

    expect(prismaMock.__state.workspaceUserPreferences).toEqual([
      {
        id: expect.any(String),
        workspaceId: result.workspaceId,
        userId: result.userId,
        isDefault: true,
        lastOpenedAt: null,
      },
    ]);
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(2);
    expect(prismaMock.$queryRaw.mock.calls[0]?.[1]).toBe("alex@example.com");
    expect(prismaMock.$queryRaw.mock.calls[1]?.[1]).toBe("user_clerk_123");
  });

  it("reuses the same local profile and workspace when bootstrap runs again", async () => {
    const firstResult = await bootstrapUser({
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });

    const secondResult = await bootstrapUser({
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });

    expect(secondResult).toEqual(firstResult);
    expect(prismaMock.__state.userProfiles).toHaveLength(1);
    expect(prismaMock.__state.workspaces).toHaveLength(1);
    expect(prismaMock.__state.workspaceMembers).toHaveLength(1);
    expect(prismaMock.__state.workspaceUserPreferences).toHaveLength(1);
  });

  it("creates a personal workspace when an existing user only has non-personal memberships", async () => {
    prismaMock.__state.userProfiles.push({
      id: "profile-existing",
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    prismaMock.__state.workspaces.push({
      id: "workspace-household",
      name: "Shared household",
      type: "household",
    });
    prismaMock.__state.workspaceMembers.push({
      id: "membership-household",
      workspaceId: "workspace-household",
      userId: "profile-existing",
      role: "owner",
    });
    prismaMock.__state.workspaceUserPreferences.push({
      id: "preference-household",
      workspaceId: "workspace-household",
      userId: "profile-existing",
      isDefault: true,
      lastOpenedAt: null,
    });

    const result = await bootstrapUser({
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });

    expect(result.userId).toBe("profile-existing");
    expect(result.workspaceId).not.toBe("workspace-household");
    expect(prismaMock.__state.workspaces).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "workspace-household", type: "household" }),
        expect.objectContaining({ id: result.workspaceId, type: "personal" }),
      ]),
    );
    expect(prismaMock.__state.workspaceMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ workspaceId: "workspace-household", userId: "profile-existing" }),
        expect.objectContaining({ workspaceId: result.workspaceId, userId: "profile-existing", role: "owner" }),
      ]),
    );
    expect(
      prismaMock.__state.workspaceUserPreferences.find(
        (preference) => preference.workspaceId === "workspace-household",
      )?.isDefault,
    ).toBe(false);
    expect(
      prismaMock.__state.workspaceUserPreferences.find(
        (preference) => preference.workspaceId === result.workspaceId,
      )?.isDefault,
    ).toBe(true);
  });

  it("upgrades an existing personal membership to owner and keeps it as the only default", async () => {
    prismaMock.__state.userProfiles.push({
      id: "profile-existing",
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    prismaMock.__state.workspaces.push({
      id: "workspace-personal",
      name: "Alex's workspace",
      type: "personal",
    });
    prismaMock.__state.workspaceMembers.push({
      id: "membership-personal",
      workspaceId: "workspace-personal",
      userId: "profile-existing",
      role: "editor",
    });
    prismaMock.__state.workspaceUserPreferences.push({
      id: "preference-personal",
      workspaceId: "workspace-personal",
      userId: "profile-existing",
      isDefault: true,
      lastOpenedAt: null,
    });
    prismaMock.__state.workspaces.push({
      id: "workspace-business",
      name: "Alex business",
      type: "business",
    });
    prismaMock.__state.workspaceUserPreferences.push({
      id: "preference-business",
      workspaceId: "workspace-business",
      userId: "profile-existing",
      isDefault: true,
      lastOpenedAt: null,
    });

    const result = await bootstrapUser({
      clerkUserId: "user_clerk_123",
      email: "alex@example.com",
      displayName: "Alex Example",
    });

    expect(result).toEqual({
      userId: "profile-existing",
      workspaceId: "workspace-personal",
    });
    expect(
      prismaMock.__state.workspaceMembers.find(
        (membership) => membership.workspaceId === "workspace-personal",
      )?.role,
    ).toBe("owner");
    expect(
      prismaMock.__state.workspaceUserPreferences.find(
        (preference) => preference.workspaceId === "workspace-personal",
      )?.isDefault,
    ).toBe(true);
    expect(
      prismaMock.__state.workspaceUserPreferences.find(
        (preference) => preference.workspaceId === "workspace-business",
      )?.isDefault,
    ).toBe(false);
  });

  it("rejects claiming a local profile already linked to another auth account", async () => {
    prismaMock.__state.userProfiles.push({
      id: "profile-existing",
      clerkUserId: "legacy_clerk_user",
      email: "Alex@Example.com",
      displayName: null,
    });

    await expect(
      bootstrapUser({
        clerkUserId: "user_clerk_123",
        email: "alex@example.com",
        displayName: "Alex Example",
      }),
    ).rejects.toThrow("A different auth account is already linked to this local profile.");

    expect(prismaMock.__state.userProfiles).toEqual([
      {
        id: "profile-existing",
        clerkUserId: "legacy_clerk_user",
        email: "Alex@Example.com",
        displayName: null,
      },
    ]);
    expect(prismaMock.__state.workspaces).toEqual([]);
    expect(prismaMock.__state.workspaceMembers).toEqual([]);
    expect(prismaMock.__state.workspaceUserPreferences).toEqual([]);
  });
});