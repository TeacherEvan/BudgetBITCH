import type { WorkspaceRole } from "./permissions";

export type WorkspaceMembershipOption = {
  workspaceId: string;
  role: WorkspaceRole;
  isDefault?: boolean;
};

export type ActiveWorkspaceResolutionSource =
  | "requested"
  | "default"
  | "first"
  | "none";

export type ActiveWorkspaceResolution<
  TWorkspace extends WorkspaceMembershipOption,
> = {
  activeWorkspace: TWorkspace | null;
  requestedWorkspaceId: string | null;
  matchedRequestedWorkspace: boolean;
  resolutionSource: ActiveWorkspaceResolutionSource;
};

export function resolveActiveWorkspace<
  TWorkspace extends WorkspaceMembershipOption,
>(
  workspaces: readonly TWorkspace[],
  requestedWorkspaceId?: string | null,
): ActiveWorkspaceResolution<TWorkspace> {
  const normalizedRequestedWorkspaceId = requestedWorkspaceId?.trim() || null;
  const requestedWorkspace = normalizedRequestedWorkspaceId
    ? workspaces.find(
        (workspace) => workspace.workspaceId === normalizedRequestedWorkspaceId,
      ) ?? null
    : null;

  if (requestedWorkspace) {
    return {
      activeWorkspace: requestedWorkspace,
      requestedWorkspaceId: normalizedRequestedWorkspaceId,
      matchedRequestedWorkspace: true,
      resolutionSource: "requested",
    };
  }

  const defaultWorkspace =
    workspaces.find((workspace) => workspace.isDefault) ?? null;

  if (defaultWorkspace) {
    return {
      activeWorkspace: defaultWorkspace,
      requestedWorkspaceId: normalizedRequestedWorkspaceId,
      matchedRequestedWorkspace: false,
      resolutionSource: "default",
    };
  }

  const firstWorkspace = workspaces[0] ?? null;

  return {
    activeWorkspace: firstWorkspace,
    requestedWorkspaceId: normalizedRequestedWorkspaceId,
    matchedRequestedWorkspace: false,
    resolutionSource: firstWorkspace ? "first" : "none",
  };
}
