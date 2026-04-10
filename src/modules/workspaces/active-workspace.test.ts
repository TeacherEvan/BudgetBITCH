import { describe, expect, it } from "vitest";
import { resolveActiveWorkspace } from "./active-workspace";

describe("resolveActiveWorkspace", () => {
  const workspaces = [
    {
      workspaceId: "workspace-1",
      role: "editor" as const,
      name: "Household",
    },
    {
      workspaceId: "workspace-2",
      role: "owner" as const,
      isDefault: true,
      name: "Side Hustle",
    },
    {
      workspaceId: "workspace-3",
      role: "read_only" as const,
      name: "Archive",
    },
  ];

  it("prefers a requested workspace when the user belongs to it", () => {
    expect(resolveActiveWorkspace(workspaces, "workspace-3")).toEqual({
      activeWorkspace: workspaces[2],
      requestedWorkspaceId: "workspace-3",
      matchedRequestedWorkspace: true,
      resolutionSource: "requested",
    });
  });

  it("falls back to the default workspace when the request is unavailable", () => {
    expect(resolveActiveWorkspace(workspaces, "workspace-missing")).toEqual({
      activeWorkspace: workspaces[1],
      requestedWorkspaceId: "workspace-missing",
      matchedRequestedWorkspace: false,
      resolutionSource: "default",
    });
  });

  it("falls back to the first workspace when no default exists", () => {
    const result = resolveActiveWorkspace(
      workspaces.map((workspace) => ({
        workspaceId: workspace.workspaceId,
        role: workspace.role,
        name: workspace.name,
      })),
    );

    expect(result).toEqual({
      activeWorkspace: {
        workspaceId: "workspace-1",
        role: "editor",
        name: "Household",
      },
      requestedWorkspaceId: null,
      matchedRequestedWorkspace: false,
      resolutionSource: "first",
    });
  });

  it("treats blank requested ids as missing", () => {
    expect(resolveActiveWorkspace(workspaces, "   ")).toEqual({
      activeWorkspace: workspaces[1],
      requestedWorkspaceId: null,
      matchedRequestedWorkspace: false,
      resolutionSource: "default",
    });
  });

  it("returns an empty resolution when the user has no workspaces", () => {
    expect(resolveActiveWorkspace([], "workspace-1")).toEqual({
      activeWorkspace: null,
      requestedWorkspaceId: "workspace-1",
      matchedRequestedWorkspace: false,
      resolutionSource: "none",
    });
  });
});
