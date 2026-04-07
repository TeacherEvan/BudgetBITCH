import { Prisma, type PrismaClient } from "@prisma/client";

type PersonalWorkspaceUser = {
  clerkUserId: string;
  email: string;
  displayName: string | null;
};

type PersonalWorkspaceResult = {
  workspaceId: string;
  userProfileId: string;
  createdWorkspace: boolean;
};

export async function ensurePersonalWorkspaceForUser(
  prisma: PrismaClient,
  user: PersonalWorkspaceUser,
): Promise<PersonalWorkspaceResult> {
  return prisma.$transaction(async (tx) => {
    const userProfile = await tx.userProfile.upsert({
      where: { clerkUserId: user.clerkUserId },
      update: {
        email: user.email,
        displayName: user.displayName,
      },
      create: {
        clerkUserId: user.clerkUserId,
        email: user.email,
        displayName: user.displayName,
      },
      select: { id: true },
    });

    await tx.$executeRaw(
      Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`personal-workspace:${userProfile.id}`}))`,
    );

    const existingMembership = await tx.workspaceMember.findFirst({
      where: {
        userId: userProfile.id,
        workspace: {
          type: "personal",
        },
      },
      orderBy: { createdAt: "asc" },
      select: { workspaceId: true },
    });

    if (existingMembership) {
      return {
        workspaceId: existingMembership.workspaceId,
        userProfileId: userProfile.id,
        createdWorkspace: false,
      };
    }

    const displayName = user.displayName?.trim();
    const workspace = await tx.workspace.create({
      data: {
        name: displayName ? `${displayName}'s Workspace` : "Personal Workspace",
        type: "personal",
      },
      select: { id: true },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: userProfile.id,
        role: "owner",
      },
    });

    return {
      workspaceId: workspace.id,
      userProfileId: userProfile.id,
      createdWorkspace: true,
    };
  });
}