import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@/lib/prisma";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
} from "./clerk-config";

export class WorkspaceRouteGuardError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "WorkspaceRouteGuardError";
  }
}

export type AuthorizedWorkspaceActor = {
  workspaceId: string;
  actorUserId: string;
  role: "owner" | "editor" | "approver" | "read_only";
};

export async function authorizeWorkspaceMutation(
  workspaceId: string,
): Promise<AuthorizedWorkspaceActor> {
  if (!isClerkConfigured()) {
    throw new WorkspaceRouteGuardError(clerkConfigurationErrorMessage, 503);
  }

  const { userId } = await auth();

  if (!userId) {
    throw new WorkspaceRouteGuardError("Authentication is required.", 401);
  }

  const prisma = getPrismaClient();
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!profile) {
    throw new WorkspaceRouteGuardError(
      "No local user profile exists for the authenticated Clerk user.",
      404,
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: profile.id,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    throw new WorkspaceRouteGuardError(
      "The authenticated user is not a member of this workspace.",
      403,
    );
  }

  return {
    workspaceId,
    actorUserId: profile.id,
    role: membership.role,
  };
}
