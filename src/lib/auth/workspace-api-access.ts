import { NextResponse } from "next/server";
import {
  authorizeWorkspaceMutation,
  type AuthorizedWorkspaceActor,
  type WorkspaceRouteGuardErrorReason,
  WorkspaceRouteGuardError,
} from "./workspace-route-guard";

export const localDemoWorkspaceId = "demo_workspace";

type WorkspaceApiRole = AuthorizedWorkspaceActor["role"];

export type WorkspaceApiAccessErrorReason =
  | "demo_workspace_required"
  | WorkspaceRouteGuardErrorReason;

export type WorkspaceApiAccessErrorResponseBody = {
  error: {
    message: string;
    reason: WorkspaceApiAccessErrorReason;
  };
};

export class WorkspaceApiAccessError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly reason: WorkspaceApiAccessErrorReason,
  ) {
    super(message);
    this.name = "WorkspaceApiAccessError";
  }
}

export type TrustedWorkspaceApiAccess =
  | {
      workspaceId: typeof localDemoWorkspaceId;
      accessMode: "demo";
      actorUserId: null;
      role: null;
    }
  | {
      workspaceId: string;
      accessMode: "authenticated";
      actorUserId: string;
      role: WorkspaceApiRole;
    };

function isWorkspaceApiDemoModeEnabled() {
  const nodeEnv = process.env.NODE_ENV?.trim();

  return (
    nodeEnv === "development" ||
    nodeEnv === "test" ||
    process.env.BUDGETBITCH_STRIP_AUTH_ENV?.trim() === "true" ||
    process.env.BUDGETBITCH_STRIP_CLERK_ENV?.trim() === "true"
  );
}

export function createWorkspaceApiAccessErrorResponse(error: unknown) {
  if (!(error instanceof WorkspaceApiAccessError)) {
    return null;
  }

  return NextResponse.json<WorkspaceApiAccessErrorResponseBody>(
    {
      error: {
        message: error.message,
        reason: error.reason,
      },
    },
    { status: error.status },
  );
}

export async function resolveWorkspaceApiAccess(
  workspaceId: string,
): Promise<TrustedWorkspaceApiAccess> {
  if (isWorkspaceApiDemoModeEnabled() && workspaceId === localDemoWorkspaceId) {
    return {
      workspaceId: localDemoWorkspaceId,
      accessMode: "demo",
      actorUserId: null,
      role: null,
    };
  }

  if (isWorkspaceApiDemoModeEnabled() && workspaceId !== localDemoWorkspaceId) {
    throw new WorkspaceApiAccessError(
      "Local demo API access is limited to the demo workspace.",
      403,
      "demo_workspace_required",
    );
  }

  try {
    const actor = await authorizeWorkspaceMutation(workspaceId);

    return {
      workspaceId: actor.workspaceId,
      accessMode: "authenticated",
      actorUserId: actor.actorUserId,
      role: actor.role,
    };
  } catch (error) {
    if (error instanceof WorkspaceRouteGuardError) {
      throw new WorkspaceApiAccessError(
        error.message,
        error.status,
        error.reason,
      );
    }

    throw error;
  }
}