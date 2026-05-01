"use client";

import { useQuery } from "convex/react";
import { ShieldCheck, Siren, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "../../../convex/_generated/api";
import { normalizeConvexCloudUrl } from "@/lib/url";

type LiveAlertFeedProps = {
  workspaceId: string | null;
};

const VIEWER_WORKSPACE_LIMIT = 10;

function isConvexRealtimeAuthReady() {
  return process.env.NEXT_PUBLIC_CONVEX_AUTH_BRIDGE_READY?.trim() === "true";
}

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
  const t = useTranslations("liveAlerts");
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
    return <p className="bb-mini-copy mt-4">{t("loading")}</p>;
  }

  if (!viewer.projectionReady) {
    return <p className="bb-mini-copy mt-4">{t("viewerSync")}</p>;
  }

  if (!canReadWorkspace) {
    return <p className="bb-mini-copy mt-4">{t("workspaceSync")}</p>;
  }

  if (rows === undefined) {
    return <p className="bb-mini-copy mt-4">{t("loading")}</p>;
  }

  if (rows.length === 0) {
    return <p className="bb-mini-copy mt-4">{t("empty")}</p>;
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
                  <p className="bb-mini-copy mt-3">{t("checkInDate", { date: row.checkInDate })}</p>
                </div>
              </div>
              <span className="bb-status-pill">{t(`severity.${row.severity}`)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function LiveAlertFeed({ workspaceId }: LiveAlertFeedProps) {
  const t = useTranslations("liveAlerts");
  const convexUrlConfigured = Boolean(
    normalizeConvexCloudUrl(process.env.NEXT_PUBLIC_CONVEX_URL),
  );
  const convexRealtimeAuthReady = isConvexRealtimeAuthReady();

  return (
    <section className="bb-panel bb-panel-muted p-6" aria-labelledby="live-alerts-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="bb-kicker">{t("kicker")}</p>
          <h2 id="live-alerts-heading" className="mt-3 text-3xl font-semibold">
            {t("title")}
          </h2>
          <p className="bb-helper-copy mt-3 max-w-md">{t("description")}</p>
        </div>
      </div>

      {!workspaceId ? (
        <p className="bb-mini-copy mt-4">{t("selectWorkspace")}</p>
      ) : !convexUrlConfigured ? (
        <p className="bb-mini-copy mt-4">{t("standbyNoUrl")}</p>
      ) : !convexRealtimeAuthReady ? (
        <p className="bb-mini-copy mt-4">{t("standbyNoBridge")}</p>
      ) : (
        <LiveAlertFeedBody workspaceId={workspaceId} />
      )}
    </section>
  );
}
