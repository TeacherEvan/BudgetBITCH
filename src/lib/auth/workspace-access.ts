import { getPrismaClient } from "@/lib/prisma";
import { ensurePersonalWorkspaceForUser } from "@/modules/workspaces/personal-workspace";

import { getRequestAuth, type RequestAuth } from "./request-auth";

type WorkspaceAccessOptions = {
  requestAuth: RequestAuth;
  workspaceId?: string;
};

type WorkspaceAccessDenied = {
  allowed: false;
  status: 401 | 403;
  reason:
    | "unauthenticated"
    | "workspace_forbidden"
    | "no_workspace_membership";
};

type WorkspaceAccessAllowed = {
  allowed: true;
  workspaceId: string;
  userProfileId: string;
};

export type WorkspaceAccessResult = WorkspaceAccessAllowed | WorkspaceAccessDenied;

export async function resolveWorkspaceAccess(
  options: WorkspaceAccessOptions,
): Promise<WorkspaceAccessResult> {
  if (!options.requestAuth.userId || !options.requestAuth.email) {
    return {
      allowed: false,
      status: 401,
      reason: "unauthenticated",
    };
  }

  const prisma = getPrismaClient();

  if (!options.workspaceId) {
    const personalWorkspace = await ensurePersonalWorkspaceForUser(prisma, {
      clerkUserId: options.requestAuth.userId,
      email: options.requestAuth.email,
      displayName: options.requestAuth.displayName,
    });

    return {
      allowed: true,
      workspaceId: personalWorkspace.workspaceId,
      userProfileId: personalWorkspace.userProfileId,
    };
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: options.workspaceId,
      user: {
        clerkUserId: options.requestAuth.userId,
      },
    },
    select: {
      workspaceId: true,
      userId: true,
    },
  });

  if (!membership) {
    return {
      allowed: false,
      status: 403,
      reason: "workspace_forbidden",
    };
  }

  return {
    allowed: true,
    workspaceId: membership.workspaceId,
    userProfileId: membership.userId,
  };
}

export async function getCurrentWorkspaceAccess(
  workspaceId?: string,
): Promise<WorkspaceAccessResult> {
  const requestAuth = await getRequestAuth();

  return resolveWorkspaceAccess({
    requestAuth,
    workspaceId,
  });
}