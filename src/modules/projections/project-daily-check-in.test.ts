import { beforeEach, describe, expect, it, vi } from "vitest";

const mutationMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/convex/http-client", () => ({
  getConvexHttpClient: () => ({
    mutation: mutationMock,
  }),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    projections: {
      projectDailyCheckIn: "projections:projectDailyCheckIn",
    },
  },
}));

import {
  convexProjectionSyncErrorMessage,
  projectDailyCheckInToConvex,
} from "./project-daily-check-in";

describe("projectDailyCheckInToConvex", () => {
  beforeEach(() => {
    delete process.env.CONVEX_SYNC_SECRET;
    mutationMock.mockReset();
  });

  it("throws a clear error when the shared Convex sync secret is missing", async () => {
    await expect(
      projectDailyCheckInToConvex({
        workspaceId: "workspace-1",
        sourceCheckInId: "check-in-1",
        profileId: null,
        checkInDate: "2026-04-09",
        status: "completed",
        headline: "Today needs a tighter plan.",
        summary: null,
        snapshotJson: "{}",
        alertRows: [],
      }),
    ).rejects.toThrow(convexProjectionSyncErrorMessage);
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("forwards the projection payload plus the shared sync secret to Convex", async () => {
    process.env.CONVEX_SYNC_SECRET = " budgetbitch-sync-secret ";
    mutationMock.mockResolvedValue({
      projectedAlertCount: 1,
      projectedAt: 1_775_778_000_000,
    });

    const result = await projectDailyCheckInToConvex({
      workspaceId: "workspace-1",
      sourceCheckInId: "check-in-1",
      profileId: "profile-1",
      checkInDate: "2026-04-09",
      status: "completed",
      headline: "Today needs a tighter plan.",
      summary: "{\"remainingAfterPlannedSpend\":-110}",
      snapshotJson: "{\"headline\":\"Today needs a tighter plan.\"}",
      alertRows: [
        {
          sourceAlertId: "alert-1",
          sourceCheckInId: "check-in-1",
          workspaceId: "workspace-1",
          checkInDate: "2026-04-09",
          status: "open",
          severity: "warning",
          code: "cashflow_negative",
          title: "Cash is running short",
          message: "You're projected to go negative today.",
          metadataJson: "{\"remaining\":-110}",
          resolvedAt: null,
          createdAt: 1_775_778_000_000,
          updatedAt: 1_775_778_000_000,
        },
      ],
    });

    expect(mutationMock).toHaveBeenCalledWith("projections:projectDailyCheckIn", {
      syncSecret: "budgetbitch-sync-secret",
      workspaceId: "workspace-1",
      sourceCheckInId: "check-in-1",
      profileId: "profile-1",
      checkInDate: "2026-04-09",
      status: "completed",
      headline: "Today needs a tighter plan.",
      summary: "{\"remainingAfterPlannedSpend\":-110}",
      snapshotJson: "{\"headline\":\"Today needs a tighter plan.\"}",
      alertRows: [
        {
          sourceAlertId: "alert-1",
          sourceCheckInId: "check-in-1",
          workspaceId: "workspace-1",
          checkInDate: "2026-04-09",
          status: "open",
          severity: "warning",
          code: "cashflow_negative",
          title: "Cash is running short",
          message: "You're projected to go negative today.",
          metadataJson: "{\"remaining\":-110}",
          resolvedAt: null,
          createdAt: 1_775_778_000_000,
          updatedAt: 1_775_778_000_000,
        },
      ],
    });
    expect(result).toEqual({
      projectedAlertCount: 1,
      projectedAt: 1_775_778_000_000,
    });
  });
});
