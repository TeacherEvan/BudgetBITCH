"use client";

import { useQuery } from "convex/react";
import { ShieldCheck, Siren, TriangleAlert } from "lucide-react";
import { isClerkClientConfigured } from "@/lib/auth/clerk-config";
import { api } from "../../../convex/_generated/api";

type LiveAlertFeedProps = {
  workspaceId: string | null;
};

const VIEWER_WORKSPACE_LIMIT = 10;

function severityIcon(severity: "info" | "warning" | "critical") {
  if (severity === "critical") {
    return Siren;
  }

  if (severity === "warning") {
    return TriangleAlert;
  }

  return ShieldCheck;
}

function LiveAlertFeedBody({ workspaceId }: LiveAlertFeedProps) {
  const viewer = useQuery(api.viewer.current, {
    workspaceLimit: VIEWER_WORKSPACE_LIMIT,
  });
  const canReadWorkspace =
    viewer?.projectionReady === true &&
    viewer.workspaces.some((workspace) => workspace.workspaceId === workspaceId);
  const rows = useQuery(
    api.live.listAlertInboxRows,
    workspaceId && canReadWorkspace ? { workspaceId, limit: 6, status: "open" } : "skip",
  );

  if (viewer === undefined) {
    return <p className="bb-mini-copy mt-4">Loading live alerts...</p>;
  }

  if (!viewer.projectionReady) {
    return (
      <p className="bb-mini-copy mt-4">
        Live alerts will appear here after your Convex viewer profile finishes syncing.
      </p>
    );
  }

  if (!canReadWorkspace) {
    return (
      <p className="bb-mini-copy mt-4">
        Live alerts are waiting for this workspace membership to finish syncing.
      </p>
    );
  }

  if (rows === undefined) {
    return <p className="bb-mini-copy mt-4">Loading live alerts...</p>;
  }

  if (rows.length === 0) {
    return (
      <p className="bb-mini-copy mt-4">
        Live alerts will appear here after the first projected check-in.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {rows.map((row) => {
        const Icon = severityIcon(row.severity);

        return (
          <article key={row._id} className="bb-compact-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="bb-icon-badge" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{row.title}</p>
                  <p className="bb-mini-copy mt-1">{row.message}</p>
                  <p className="bb-mini-copy mt-3">Check-in {row.checkInDate}</p>
                </div>
              </div>
              <span className="bb-status-pill">{row.severity}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function LiveAlertFeed({ workspaceId }: LiveAlertFeedProps) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const clerkPublishableKeyConfigured = isClerkClientConfigured();

  return (
    <section className="bb-panel bb-panel-muted p-6" aria-labelledby="live-alerts-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bb-kicker">Live alerts</p>
          <h2 id="live-alerts-heading" className="mt-3 text-3xl font-semibold">
            Watch the pressure points
          </h2>
          <p className="bb-mini-copy mt-3 max-w-md">
            Keep the latest projected alerts visible even while the rest of the board is still
            warming up.
          </p>
        </div>
      </div>

      {!workspaceId ? (
        <p className="bb-mini-copy mt-4">Select a workspace to view live alerts.</p>
      ) : !convexUrl || !clerkPublishableKeyConfigured ? (
        <p className="bb-mini-copy mt-4">
          Live alerts stay on standby until Convex auth is configured for this dashboard.
        </p>
      ) : (
        <LiveAlertFeedBody workspaceId={workspaceId} />
      )}
    </section>
  );
}
