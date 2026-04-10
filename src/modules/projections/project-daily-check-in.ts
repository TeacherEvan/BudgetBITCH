import { api } from "../../../convex/_generated/api";
import { getConvexHttpClient } from "@/lib/convex/http-client";

export const convexProjectionSyncErrorMessage =
  "CONVEX_SYNC_SECRET is not configured for Convex projection sync.";

export type ProjectDailyCheckInInput = {
  workspaceId: string;
  sourceCheckInId: string;
  profileId: string | null;
  checkInDate: string;
  status: "completed" | "skipped";
  headline: string;
  summary: string | null;
  snapshotJson: string | null;
  alertRows: Array<{
    sourceAlertId: string;
    sourceCheckInId: string;
    workspaceId: string;
    checkInDate: string;
    status: "open" | "resolved" | "dismissed";
    severity: "info" | "warning" | "critical";
    code: string;
    title: string;
    message: string;
    metadataJson: string | null;
    resolvedAt: number | null;
    createdAt: number;
    updatedAt: number;
  }>;
};

function getConvexSyncSecret() {
  const syncSecret = process.env.CONVEX_SYNC_SECRET?.trim();

  if (!syncSecret) {
    throw new Error(convexProjectionSyncErrorMessage);
  }

  return syncSecret;
}

export async function projectDailyCheckInToConvex(input: ProjectDailyCheckInInput) {
  const client = getConvexHttpClient();

  return await client.mutation(api.projections.projectDailyCheckIn, {
    syncSecret: getConvexSyncSecret(),
    ...input,
  });
}
