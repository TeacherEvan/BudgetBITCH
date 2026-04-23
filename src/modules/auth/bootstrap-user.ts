import { getPrismaClient } from "@/lib/prisma";

export type BootstrapUserInput = {
  clerkUserId: string;
  email: string;
  displayName?: string | null;
};

export type BootstrapUserResult = {
  userId: string;
  workspaceId: string;
};

function getPersonalWorkspaceName(displayName: string | null | undefined, email: string) {
  const trimmedDisplayName = displayName?.trim();

  if (trimmedDisplayName) {
    return `${trimmedDisplayName}'s workspace`;
  }

  const emailLocalPart = email.split("@")[0]?.trim();

  if (emailLocalPart) {
    return `${emailLocalPart}'s workspace`;
  }

  return "Personal workspace";
}

export async function bootstrapUser({
  clerkUserId,
  email,
  displayName,
}: BootstrapUserInput): Promise<BootstrapUserResult> {
  const normalizedClerkUserId = clerkUserId.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDisplayName = displayName?.trim() || null;

  if (!normalizedClerkUserId) {
    throw new Error("A Clerk user id is required to bootstrap a local user.");
  }

  if (!normalizedEmail) {
    throw new Error("An email address is required to bootstrap a local user.");
  }

  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${normalizedClerkUserId}), 0)`;

    let profile = await tx.userProfile.findUnique({
      where: { clerkUserId: normalizedClerkUserId },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
        workspacePreferences: true,
      },
    });

    if (!profile) {
      const existingProfileByEmail = await tx.userProfile.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
        include: {
          memberships: {
            include: {
              workspace: true,
            },
          },
          workspacePreferences: true,
        },
      });

      if (existingProfileByEmail) {
        const updatedProfile = await tx.userProfile.update({
          where: { id: existingProfileByEmail.id },
          data: {
            clerkUserId: normalizedClerkUserId,
            displayName: normalizedDisplayName ?? existingProfileByEmail.displayName,
          },
        });

        profile = {
          ...existingProfileByEmail,
          ...updatedProfile,
        };
      } else {
        const createdProfile = await tx.userProfile.create({
          data: {
            clerkUserId: normalizedClerkUserId,
            email: normalizedEmail,
            displayName: normalizedDisplayName,
          },
        });

        profile = {
          ...createdProfile,
          memberships: [],
          workspacePreferences: [],
        };
      }
    }

    const defaultPreference = profile.workspacePreferences.find((preference) => preference.isDefault);
    const personalMemberships = profile.memberships.filter(
      (membership) => membership.workspace?.type === "personal",
    );
    const preferredPersonalMembership = defaultPreference
      ? personalMemberships.find((membership) => membership.workspaceId === defaultPreference.workspaceId) ?? null
      : null;
    const existingPersonalMembership = preferredPersonalMembership ?? personalMemberships[0] ?? null;

    let workspaceId = existingPersonalMembership?.workspaceId ?? null;

    if (!workspaceId) {
      const workspace = await tx.workspace.create({
        data: {
          name: getPersonalWorkspaceName(profile.displayName, normalizedEmail),
          type: "personal",
        },
      });

      workspaceId = workspace.id;
    }

    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: profile.id,
        },
      },
      update: {
        role: "owner",
      },
      create: {
        workspaceId,
        userId: profile.id,
        role: "owner",
      },
    });

    await tx.workspaceUserPreference.updateMany({
      where: {
        userId: profile.id,
        isDefault: true,
        NOT: {
          workspaceId,
        },
      },
      data: {
        isDefault: false,
      },
    });

    await tx.workspaceUserPreference.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: profile.id,
        },
      },
      update: {
        isDefault: true,
      },
      create: {
        workspaceId,
        userId: profile.id,
        isDefault: true,
        lastOpenedAt: null,
      },
    });

    return {
      userId: profile.id,
      workspaceId,
    };
  });
}