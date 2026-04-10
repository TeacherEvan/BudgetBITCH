import { ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import type { ActiveWorkspaceResolutionSource } from "@/modules/workspaces/active-workspace";
import type { WorkspaceRole } from "@/modules/workspaces/permissions";

export type WorkspaceSwitcherWorkspace = {
  id: string;
  isDefault?: boolean;
  name: string;
  role: WorkspaceRole;
};

type WorkspaceSwitcherProps = {
  activeWorkspaceId: string | null;
  isDemo?: boolean;
  requestedWorkspaceId: string | null;
  resolutionSource: ActiveWorkspaceResolutionSource;
  workspaces: readonly WorkspaceSwitcherWorkspace[];
};

function formatRoleLabel(role: WorkspaceRole) {
  return role.replaceAll("_", " ");
}

function getResolutionMessage(
  requestedWorkspaceId: string | null,
  resolutionSource: ActiveWorkspaceResolutionSource,
) {
  if (!requestedWorkspaceId) {
    return null;
  }

  if (resolutionSource === "requested") {
    return null;
  }

  if (resolutionSource === "default") {
    return "Requested workspace is unavailable. Showing your default workspace instead.";
  }

  if (resolutionSource === "first") {
    return "Requested workspace is unavailable. Showing the first workspace you can access.";
  }

  return "Requested workspace is unavailable because no workspace access is available yet.";
}

export function WorkspaceSwitcher({
  activeWorkspaceId,
  isDemo = false,
  requestedWorkspaceId,
  resolutionSource,
  workspaces,
}: WorkspaceSwitcherProps) {
  const resolutionMessage = getResolutionMessage(requestedWorkspaceId, resolutionSource);

  return (
    <section className="bb-panel p-6" aria-labelledby="workspace-switcher-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="bb-kicker">Workspace context</p>
          <h2 id="workspace-switcher-heading" className="mt-3 text-3xl font-semibold">
            Switch workspace
          </h2>
          <p className="bb-mini-copy mt-3 max-w-md">
            Keep this board tied to the exact workspace you are checking today.
          </p>
        </div>
        <span className="bb-status-pill">{workspaces.length} workspaces</span>
      </div>

      {isDemo ? (
        <p className="bb-mini-copy mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
          Showing sample workspace context until live memberships are available.
        </p>
      ) : null}

      {resolutionMessage ? (
        <p className="bb-mini-copy mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
          {resolutionMessage}
        </p>
      ) : null}

      {workspaces.length === 0 ? (
        <article className="bb-compact-card mt-5">
          <span className="font-semibold text-white">No workspaces available yet</span>
          <p className="bb-mini-copy">
            Add a workspace before you submit daily check-ins or switch context.
          </p>
        </article>
      ) : (
        <div className="bb-stack-list mt-5">
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId;

            return (
              <Link
                key={workspace.id}
                href={{
                  pathname: "/dashboard",
                  query: { workspaceId: workspace.id },
                }}
                aria-current={isActive ? "page" : undefined}
                className={`bb-lane-link ${
                  isActive
                    ? "border-[color:var(--border-strong)] bg-white/10"
                    : "border-[color:var(--border-soft)]"
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{workspace.name}</span>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-emerald-50/80">
                      {formatRoleLabel(workspace.role)}
                    </span>
                    {workspace.isDefault ? <span className="bb-status-pill">Default</span> : null}
                  </div>
                  <p className="bb-mini-copy mt-2">
                    {isActive
                      ? "Current workspace on this board."
                      : `Open ${workspace.name} workspace.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {isActive ? "Current workspace" : "Open workspace"}
                  </span>
                  <ArrowRightLeft
                    className="h-4 w-4 shrink-0 text-(--accent-strong)"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
