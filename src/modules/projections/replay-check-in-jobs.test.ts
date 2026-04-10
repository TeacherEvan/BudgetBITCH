import { beforeEach, describe, expect, it, vi } from "vitest";

const projectDailyCheckInToConvex = vi.hoisted(() => vi.fn());
const prismaMock = vi.hoisted(() => ({
  projectionOutbox: {
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  dailyCheckIn: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

vi.mock("./project-daily-check-in", () => ({
  projectDailyCheckInToConvex,
}));

import {
  MAX_REPLAY_ATTEMPTS,
  processDailyCheckInProjectionReplayBatch,
  replayDailyCheckInProjectionJobs,
} from "./replay-check-in-jobs";

describe("processDailyCheckInProjectionReplayBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("claims a bounded job, projects the latest Neon check-in state, and marks success", async () => {
    const now = vi
      .fn()
      .mockReturnValueOnce(new Date("2026-04-09T00:00:00.000Z"))
      .mockReturnValue(new Date("2026-04-09T00:00:30.000Z"));

    prismaMock.projectionOutbox.findMany.mockResolvedValue([
      {
        id: "job-1",
        sourceId: "check-in-1",
        workspaceId: "workspace-1",
        status: "pending",
        attemptCount: 0,
        availableAt: new Date("2026-04-09T00:00:00.000Z"),
        lastAttemptAt: null,
        createdAt: new Date("2026-04-09T00:00:00.000Z"),
      },
    ]);
    prismaMock.projectionOutbox.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.dailyCheckIn.findUnique.mockResolvedValue({
      id: "check-in-1",
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      checkInDate: new Date("2026-04-09T00:00:00.000Z"),
      status: "completed",
      checkInJson: {
        headline: "Today needs a tighter plan.",
        summary: { remainingAfterPlannedSpend: -110 },
      },
      alerts: [
        {
          id: "alert-1",
          checkInId: "check-in-1",
          workspaceId: "workspace-1",
          status: "open",
          severity: "warning",
          code: "cashflow_negative",
          title: "Cash is running short",
          message: "You're projected to go negative today.",
          metadataJson: { remaining: -110 },
          resolvedAt: null,
          createdAt: new Date("2026-04-09T00:00:10.000Z"),
          updatedAt: new Date("2026-04-09T00:00:20.000Z"),
        },
      ],
    });
    projectDailyCheckInToConvex.mockResolvedValue({
      projectedAlertCount: 1,
    });

    const result = await processDailyCheckInProjectionReplayBatch(
      {
        prisma: prismaMock,
        projectDailyCheckIn: projectDailyCheckInToConvex,
        now,
      },
      { limit: 99 },
    );

    expect(prismaMock.projectionOutbox.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
      }),
    );
    expect(prismaMock.projectionOutbox.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "job-1",
          status: "pending",
          attemptCount: 0,
        }),
        data: expect.objectContaining({
          status: "processing",
          attemptCount: { increment: 1 },
        }),
      }),
    );
    expect(projectDailyCheckInToConvex).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      sourceCheckInId: "check-in-1",
      profileId: "profile-1",
      checkInDate: "2026-04-09",
      status: "completed",
      headline: "Today needs a tighter plan.",
      summary: JSON.stringify({ remainingAfterPlannedSpend: -110 }),
      snapshotJson: JSON.stringify({
        headline: "Today needs a tighter plan.",
        summary: { remainingAfterPlannedSpend: -110 },
      }),
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
          metadataJson: JSON.stringify({ remaining: -110 }),
          resolvedAt: null,
          createdAt: new Date("2026-04-09T00:00:10.000Z").getTime(),
          updatedAt: new Date("2026-04-09T00:00:20.000Z").getTime(),
        },
      ],
    });
    expect(prismaMock.projectionOutbox.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "succeeded",
        processedAt: new Date("2026-04-09T00:00:30.000Z"),
        lastError: null,
      }),
    });
    expect(result).toEqual({
      processed: 1,
      succeeded: 1,
      failed: 0,
    });
  });

  it("marks exhausted jobs as failed after the final bounded retry", async () => {
    const now = vi
      .fn()
      .mockReturnValueOnce(new Date("2026-04-09T00:00:00.000Z"))
      .mockReturnValue(new Date("2026-04-09T00:01:00.000Z"));

    prismaMock.projectionOutbox.findMany.mockResolvedValue([
      {
        id: "job-1",
        sourceId: "check-in-1",
        workspaceId: "workspace-1",
        status: "failed",
        attemptCount: MAX_REPLAY_ATTEMPTS - 1,
        availableAt: new Date("2026-04-09T00:00:00.000Z"),
        lastAttemptAt: new Date("2026-04-08T23:59:00.000Z"),
        createdAt: new Date("2026-04-08T23:58:00.000Z"),
      },
    ]);
    prismaMock.projectionOutbox.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.dailyCheckIn.findUnique.mockResolvedValue({
      id: "check-in-1",
      workspaceId: "workspace-1",
      actorUserId: null,
      checkInDate: new Date("2026-04-09T00:00:00.000Z"),
      status: "completed",
      checkInJson: {},
      alerts: [],
    });
    projectDailyCheckInToConvex.mockRejectedValue(new Error("Convex unreachable"));

    const result = await processDailyCheckInProjectionReplayBatch(
      {
        prisma: prismaMock,
        projectDailyCheckIn: projectDailyCheckInToConvex,
        now,
      },
      { limit: 10 },
    );

    expect(prismaMock.projectionOutbox.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({
        status: "failed",
        processedAt: new Date("2026-04-09T00:01:00.000Z"),
        lastError: "Convex unreachable",
      }),
    });
    expect(result).toEqual({
      processed: 1,
      succeeded: 0,
      failed: 1,
    });
  });

  it("skips rows that another worker already claimed", async () => {
    prismaMock.projectionOutbox.findMany.mockResolvedValue([
      {
        id: "job-1",
        sourceId: "check-in-1",
        workspaceId: "workspace-1",
        status: "pending",
        attemptCount: 0,
        availableAt: new Date("2026-04-09T00:00:00.000Z"),
        lastAttemptAt: null,
        createdAt: new Date("2026-04-09T00:00:00.000Z"),
      },
    ]);
    prismaMock.projectionOutbox.updateMany.mockResolvedValue({ count: 0 });

    const result = await processDailyCheckInProjectionReplayBatch(
      {
        prisma: prismaMock,
        projectDailyCheckIn: projectDailyCheckInToConvex,
      },
      { limit: 5 },
    );

    expect(prismaMock.dailyCheckIn.findUnique).not.toHaveBeenCalled();
    expect(projectDailyCheckInToConvex).not.toHaveBeenCalled();
    expect(prismaMock.projectionOutbox.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      processed: 0,
      succeeded: 0,
      failed: 0,
    });
  });
});

describe("replayDailyCheckInProjectionJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the shared Prisma client and Convex projector wiring", async () => {
    prismaMock.projectionOutbox.findMany.mockResolvedValue([]);

    const result = await replayDailyCheckInProjectionJobs();

    expect(prismaMock.projectionOutbox.findMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      processed: 0,
      succeeded: 0,
      failed: 0,
    });
  });
});
