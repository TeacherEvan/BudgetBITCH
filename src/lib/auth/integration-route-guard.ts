import { auth } from "@/auth";
import { getAuthenticatedUserId } from "@/lib/auth/session";
import { getPrismaClient } from "@/lib/prisma";
import { canManageIntegrations } from "@/modules/workspaces/permissions";

export class IntegrationRouteGuardError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "IntegrationRouteGuardError";
  }
}

export type AuthorizedIntegrationActor = {
  workspaceId: string;
  actorUserId: string;
};

export async function authorizeIntegrationMutation(
  workspaceId: string,
): Promise<AuthorizedIntegrationActor> {
  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (!userId) {
    throw new IntegrationRouteGuardError("Authentication is required.", 401);
  }

  const prisma = getPrismaClient();
  const userProfile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!userProfile) {
    throw new IntegrationRouteGuardError(
      "The authenticated user does not have a local profile.",
      403,
    );
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: userProfile.id,
      },
    },
    select: { role: true },
  });

  if (!membership || !canManageIntegrations(membership.role)) {
    throw new IntegrationRouteGuardError(
      "You do not have permission to manage integrations for this workspace.",
      403,
    );
  }

  return {
    workspaceId,
    actorUserId: userProfile.id,
  };
}
