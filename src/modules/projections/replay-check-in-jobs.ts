import {
  ProjectionOutboxStatus,
  ProjectionTopic,
  type Prisma,
} from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import {
  projectDailyCheckInToConvex,
  type ProjectDailyCheckInInput,
} from "./project-daily-check-in";

export const DEFAULT_BATCH_LIMIT = 25;
export const MAX_BATCH_LIMIT = 25;
export const MAX_REPLAY_ATTEMPTS = 5;
export const STALE_PROCESSING_WINDOW_MS = 5 * 60_000;

type ReplayableProjectionJob = {
  id: string;
  sourceId: string;
  workspaceId: string;
  status: ProjectionOutboxStatus;
  attemptCount: number;
  availableAt: Date;
  lastAttemptAt: Date | null;
  createdAt: Date;
};

type ReplayableDailyCheckIn = {
  id: string;
  workspaceId: string;
  actorUserId: string | null;
  checkInDate: Date;
  status: "completed" | "skipped";
  checkInJson: Prisma.JsonValue;
  alerts: Array<{
    id: string;
    checkInId: string;
    workspaceId: string;
    status: "open" | "resolved" | "dismissed";
    severity: "info" | "warning" | "critical";
    code: string;
    title: string;
    message: string;
    metadataJson: Prisma.JsonValue | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

type ProjectionOutboxClient = {
  findMany(args: {
    where: Prisma.ProjectionOutboxWhereInput;
    orderBy: Prisma.ProjectionOutboxOrderByWithRelationInput[];
    take: number;
  }): Promise<ReplayableProjectionJob[]>;
  update(args: {
    where: { id: string };
    data: Prisma.ProjectionOutboxUpdateInput;
  }): Promise<unknown>;
  updateMany(args: {
    where: Prisma.ProjectionOutboxWhereInput;
    data: Prisma.ProjectionOutboxUpdateManyMutationInput;
  }): Promise<{ count: number }>;
};

type DailyCheckInClient = {
  findUnique(args: {
    where: { id: string };
    include: {
      alerts: {
        orderBy: {
          createdAt: "asc";
        };
      };
    };
  }): Promise<ReplayableDailyCheckIn | null>;
};

export type ReplayDailyCheckInProjectionJobsInput = {
  limit?: number;
};

export type ReplayDailyCheckInProjectionJobsResult = {
  processed: number;
  succeeded: number;
  failed: number;
};

export type ReplayDailyCheckInProjectionJobsDependencies = {
  prisma: {
    projectionOutbox: ProjectionOutboxClient;
    dailyCheckIn: DailyCheckInClient;
  };
  projectDailyCheckIn: (
    input: ProjectDailyCheckInInput,
  ) => Promise<unknown>;
  now?: () => Date;
};

function clampBatchLimit(limit: number) {
  return Math.max(1, Math.min(Math.floor(limit), MAX_BATCH_LIMIT));
}

function toCheckInDateString(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toProjectionSnapshot(checkInJson: Prisma.JsonValue) {
  if (!checkInJson || typeof checkInJson !== "object" || Array.isArray(checkInJson)) {
    return {
      headline: "Daily check-in ready.",
      summary: null,
      snapshotJson: JSON.stringify(checkInJson ?? null),
    };
  }

  const record = checkInJson as Record<string, unknown>;
  const summary = record.summary;

  return {
    headline:
      typeof record.headline === "string" ? record.headline : "Daily check-in ready.",
    summary: summary === undefined ? null : JSON.stringify(summary),
    snapshotJson: JSON.stringify(checkInJson),
  };
}

function getRetryMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown projection replay error.";
}

function getRetryDelayMs(attemptCount: number) {
  return Math.min(60_000 * 2 ** Math.max(attemptCount - 1, 0), 15 * 60_000);
}

function buildReplayWindow(now: Date) {
  return new Date(now.getTime() - STALE_PROCESSING_WINDOW_MS);
}

function buildEligibleJobWhere(now: Date): Prisma.ProjectionOutboxWhereInput {
  return {
    topic: ProjectionTopic.daily_check_in,
    attemptCount: {
      lt: MAX_REPLAY_ATTEMPTS,
    },
    OR: [
      {
        status: {
          in: [ProjectionOutboxStatus.pending, ProjectionOutboxStatus.failed],
        },
        availableAt: {
          lte: now,
        },
      },
      {
        status: ProjectionOutboxStatus.processing,
        lastAttemptAt: {
          lte: buildReplayWindow(now),
        },
      },
    ],
  };
}

function buildClaimWhere(job: ReplayableProjectionJob): Prisma.ProjectionOutboxWhereInput {
  return {
    id: job.id,
    status: job.status,
    attemptCount: job.attemptCount,
    availableAt: job.availableAt,
    lastAttemptAt: job.lastAttemptAt,
  };
}

function buildDailyCheckInProjectionInput(
  checkIn: ReplayableDailyCheckIn,
): ProjectDailyCheckInInput {
  const snapshot = toProjectionSnapshot(checkIn.checkInJson);
  const checkInDate = toCheckInDateString(checkIn.checkInDate);

  return {
    workspaceId: checkIn.workspaceId,
    sourceCheckInId: checkIn.id,
    profileId: checkIn.actorUserId ?? null,
    checkInDate,
    status: checkIn.status,
    headline: snapshot.headline,
    summary: snapshot.summary,
    snapshotJson: snapshot.snapshotJson,
    alertRows: checkIn.alerts.map((alert) => ({
      sourceAlertId: alert.id,
      sourceCheckInId: alert.checkInId,
      workspaceId: alert.workspaceId,
      checkInDate,
      status: alert.status,
      severity: alert.severity,
      code: alert.code,
      title: alert.title,
      message: alert.message,
      metadataJson: alert.metadataJson ? JSON.stringify(alert.metadataJson) : null,
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.getTime() : null,
      createdAt: alert.createdAt.getTime(),
      updatedAt: alert.updatedAt.getTime(),
    })),
  };
}

export async function processDailyCheckInProjectionReplayBatch(
  dependencies: ReplayDailyCheckInProjectionJobsDependencies,
  input: ReplayDailyCheckInProjectionJobsInput = {},
): Promise<ReplayDailyCheckInProjectionJobsResult> {
  const now = dependencies.now ?? (() => new Date());
  const initialNow = now();
  const jobs = await dependencies.prisma.projectionOutbox.findMany({
    where: buildEligibleJobWhere(initialNow),
    orderBy: [{ availableAt: "asc" }, { createdAt: "asc" }],
    take: clampBatchLimit(input.limit ?? DEFAULT_BATCH_LIMIT),
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const job of jobs) {
    const claimedAt = now();
    const claim = await dependencies.prisma.projectionOutbox.updateMany({
      where: buildClaimWhere(job),
      data: {
        status: ProjectionOutboxStatus.processing,
        attemptCount: {
          increment: 1,
        },
        lastAttemptAt: claimedAt,
        processedAt: null,
      },
    });

    if (claim.count !== 1) {
      continue;
    }

    processed += 1;

    try {
      const checkIn = await dependencies.prisma.dailyCheckIn.findUnique({
        where: { id: job.sourceId },
        include: {
          alerts: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!checkIn) {
        throw new Error("Daily check-in not found for projection replay.");
      }

      await dependencies.projectDailyCheckIn(
        buildDailyCheckInProjectionInput(checkIn),
      );

      await dependencies.prisma.projectionOutbox.update({
        where: { id: job.id },
        data: {
          status: ProjectionOutboxStatus.succeeded,
          processedAt: now(),
          lastError: null,
        },
      });

      succeeded += 1;
    } catch (error) {
      const finalizedAt = now();
      const attemptCount = job.attemptCount + 1;
      const retryAt = new Date(finalizedAt.getTime() + getRetryDelayMs(attemptCount));

      await dependencies.prisma.projectionOutbox.update({
        where: { id: job.id },
        data: {
          status: ProjectionOutboxStatus.failed,
          availableAt: retryAt,
          processedAt:
            attemptCount >= MAX_REPLAY_ATTEMPTS ? finalizedAt : null,
          lastError: getRetryMessage(error),
        },
      });

      failed += 1;
    }
  }

  return {
    processed,
    succeeded,
    failed,
  };
}

export async function replayDailyCheckInProjectionJobs(
  input?: ReplayDailyCheckInProjectionJobsInput,
) {
  const prisma = getPrismaClient();

  return await processDailyCheckInProjectionReplayBatch(
    {
      prisma: {
        projectionOutbox: prisma.projectionOutbox,
        dailyCheckIn: prisma.dailyCheckIn,
      },
      projectDailyCheckIn: projectDailyCheckInToConvex,
    },
    input,
  );
}
