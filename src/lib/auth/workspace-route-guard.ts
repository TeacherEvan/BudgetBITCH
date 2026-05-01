import { getConvexAuthenticatedIdentity } from "@/lib/auth/convex-session";
import { getPrismaClient } from "@/lib/prisma";

export type WorkspaceRouteGuardErrorReason =
  | "unauthenticated"
  | "local_profile_required"
  | "workspace_membership_required";

export class WorkspaceRouteGuardError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly reason: WorkspaceRouteGuardErrorReason,
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
  const identity = await getConvexAuthenticatedIdentity();
  const userId = identity?.tokenIdentifier ?? "";

  if (!userId) {
    throw new WorkspaceRouteGuardError(
      "Authentication is required.",
      401,
      "unauthenticated",
    );
  }

  const prisma = getPrismaClient();
  const profile = await prisma.userProfile.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!profile) {
    throw new WorkspaceRouteGuardError(
      "No local user profile exists for the authenticated account.",
      404,
      "local_profile_required",
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
      "workspace_membership_required",
    );
  }

  return {
    workspaceId,
    actorUserId: profile.id,
    role: membership.role,
  };
}
