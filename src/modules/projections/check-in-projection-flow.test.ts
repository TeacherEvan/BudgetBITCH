import { beforeEach, describe, expect, it, vi } from "vitest";

type StoredCheckIn = {
  id: string;
  workspaceId: string;
  actorUserId: string;
  checkInDate: Date;
  status: "completed";
  checkInJson: unknown;
};

type StoredAlert = {
  id: string;
  workspaceId: string;
  checkInId: string;
  status: "open";
  severity: "info" | "warning" | "critical";
  code: string;
  title: string;
  message: string;
  metadataJson: unknown;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoredOutboxJob = {
  id: string;
  topic: "daily_check_in";
  sourceId: string;
  workspaceId: string;
  dedupeKey: string;
  payloadJson: unknown;
  status: "pending" | "processing" | "failed" | "succeeded";
  attemptCount: number;
  availableAt: Date;
  lastAttemptAt: Date | null;
  processedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
};

const state = vi.hoisted(() => ({
  accounts: [] as Array<{ workspaceId: string; balance: number }>,
  bills: [] as Array<{ workspaceId: string; title: string; amount: number; dueDate: Date }>,
  categories: [] as Array<{
    workspaceId: string;
    id: string;
    name: string;
    monthlyLimit: number;
  }>,
  checkIn: null as StoredCheckIn | null,
  alerts: [] as StoredAlert[],
  outbox: null as StoredOutboxJob | null,
}));

const prismaMock = vi.hoisted(() => ({
  account: {
    findMany: vi.fn(),
  },
  bill: {
    findMany: vi.fn(),
  },
  budgetCategory: {
    findMany: vi.fn(),
  },
  dailyCheckIn: {
    findUnique: vi.fn(),
  },
  projectionOutbox: {
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { submitDailyCheckIn } from "@/modules/check-ins/submit-daily-check-in";
import { processDailyCheckInProjectionReplayBatch } from "./replay-check-in-jobs";

describe("daily check-in projection flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    state.accounts = [{ workspaceId: "workspace-1", balance: 500 }];
    state.bills = [
      {
        workspaceId: "workspace-1",
        title: "Rent",
        amount: 400,
        dueDate: new Date("2026-04-09T00:00:00.000Z"),
      },
    ];
    state.categories = [
      {
        workspaceId: "workspace-1",
        id: "cat_food",
        name: "Food",
        monthlyLimit: 300,
      },
    ];
    state.checkIn = null;
    state.alerts = [];
    state.outbox = null;

    prismaMock.account.findMany.mockImplementation(async ({ where }) => {
      return state.accounts
        .filter((account) => account.workspaceId === where.workspaceId)
        .map(({ balance }) => ({ balance }));
    });

    prismaMock.bill.findMany.mockImplementation(async ({ where }) => {
      return state.bills
        .filter(
          (bill) =>
            bill.workspaceId === where.workspaceId &&
            bill.dueDate >= where.dueDate.gte &&
            bill.dueDate < where.dueDate.lt,
        )
        .map(({ title, amount }) => ({ title, amount }));
    });

    prismaMock.budgetCategory.findMany.mockImplementation(async ({ where }) => {
      return state.categories
        .filter((category) => category.workspaceId === where.workspaceId)
        .map(({ id, name, monthlyLimit }) => ({ id, name, monthlyLimit }));
    });

    const tx = {
      dailyCheckIn: {
        upsert: vi.fn(async ({ create, update }) => {
          const nextRecord =
            state.checkIn === null
              ? {
                  id: "check-in-1",
                  workspaceId: create.workspaceId,
                  actorUserId: create.actorUserId,
                  checkInDate: create.checkInDate,
                  status: create.status,
                  checkInJson: create.checkInJson,
                }
              : {
                  ...state.checkIn,
                  actorUserId: update.actorUserId,
                  status: update.status,
                  checkInJson: update.checkInJson,
                };

          state.checkIn = nextRecord;
          return nextRecord;
        }),
      },
      dailyCheckInAlert: {
        deleteMany: vi.fn(async ({ where }) => {
          const before = state.alerts.length;
          state.alerts = state.alerts.filter(
            (alert) => alert.checkInId !== where.checkInId,
          );
          return { count: before - state.alerts.length };
        }),
        createMany: vi.fn(async ({ data }) => {
          const createdAt = new Date("2026-04-09T12:00:00.000Z");
          state.alerts = data.map(
            (
              alert: Omit<StoredAlert, "id" | "createdAt" | "updatedAt" | "resolvedAt"> & {
                metadataJson: unknown;
              },
              index: number,
            ) => ({
              id: `alert-${index + 1}`,
              workspaceId: alert.workspaceId,
              checkInId: alert.checkInId,
              status: alert.status,
              severity: alert.severity,
              code: alert.code,
              title: alert.title,
              message: alert.message,
              metadataJson: alert.metadataJson,
              resolvedAt: null,
              createdAt: new Date(createdAt.getTime() + index * 1000),
              updatedAt: new Date(createdAt.getTime() + index * 1000),
            }),
          );
          return { count: state.alerts.length };
        }),
      },
      projectionOutbox: {
        upsert: vi.fn(async ({ create, update }) => {
          state.outbox =
            state.outbox === null
              ? {
                  id: "outbox-1",
                  ...create,
                  createdAt: new Date("2026-04-09T12:00:00.000Z"),
                  lastAttemptAt: null,
                  processedAt: null,
                  lastError: null,
                }
              : {
                  ...state.outbox,
                  sourceId: update.sourceId,
                  payloadJson: update.payloadJson,
                  status: update.status,
                  attemptCount: update.attemptCount,
                  availableAt: update.availableAt,
                  lastAttemptAt: update.lastAttemptAt,
                  processedAt: update.processedAt,
                  lastError: update.lastError,
                };

          return state.outbox;
        }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback) => callback(tx));

    prismaMock.projectionOutbox.findMany.mockImplementation(async () => {
      return state.outbox ? [state.outbox] : [];
    });

    prismaMock.projectionOutbox.updateMany.mockImplementation(async ({ where, data }) => {
      if (
        !state.outbox ||
        state.outbox.id !== where.id ||
        state.outbox.status !== where.status ||
        state.outbox.attemptCount !== where.attemptCount
      ) {
        return { count: 0 };
      }

      state.outbox = {
        ...state.outbox,
        status: data.status,
        attemptCount: state.outbox.attemptCount + data.attemptCount.increment,
        lastAttemptAt: data.lastAttemptAt,
        processedAt: null,
      };

      return { count: 1 };
    });

    prismaMock.projectionOutbox.update.mockImplementation(async ({ where, data }) => {
      if (!state.outbox || state.outbox.id !== where.id) {
        throw new Error("Missing outbox job");
      }

      state.outbox = {
        ...state.outbox,
        status: data.status,
        availableAt: data.availableAt ?? state.outbox.availableAt,
        processedAt: data.processedAt ?? state.outbox.processedAt,
        lastError: data.lastError ?? state.outbox.lastError,
      };

      return state.outbox;
    });

    prismaMock.dailyCheckIn.findUnique.mockImplementation(async ({ where }) => {
      if (!state.checkIn || state.checkIn.id !== where.id) {
        return null;
      }

      return {
        ...state.checkIn,
        alerts: state.alerts,
      };
    });
  });

  it("submits a durable check-in, then replays the outbox job into the Convex projector payload", async () => {
    const projectDailyCheckIn = vi.fn().mockResolvedValue({
      projectedAlertCount: 2,
    });

    const submitResult = await submitDailyCheckIn({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      checkInDate: "2026-04-09",
      plannedSpend: 150,
      categorySpending: [
        {
          categoryId: "cat_food",
          spent: 260,
        },
      ],
    });

    const replayResult = await processDailyCheckInProjectionReplayBatch(
      {
        prisma: {
          projectionOutbox: prismaMock.projectionOutbox,
          dailyCheckIn: prismaMock.dailyCheckIn,
        },
        projectDailyCheckIn,
        now: () => new Date("2030-01-01T00:00:00.000Z"),
      },
      { limit: 10 },
    );

    expect(submitResult.projection).toEqual({
      status: "pending",
      dedupeKey: "daily_check_in:workspace-1:2026-04-09",
    });
    expect(projectDailyCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
        sourceCheckInId: "check-in-1",
        profileId: "profile-1",
        checkInDate: "2026-04-09",
        status: "completed",
        headline: "Today needs a tighter plan.",
        summary: expect.stringContaining("\"netCashflow\":-50"),
      }),
    );
    expect(projectDailyCheckIn.mock.calls[0]?.[0].alertRows).toHaveLength(2);
    expect(state.outbox?.status).toBe("succeeded");
    expect(replayResult).toEqual({
      processed: 1,
      succeeded: 1,
      failed: 0,
    });
  });
});
