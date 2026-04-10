import { beforeEach, describe, expect, it, vi } from "vitest";

const txMock = vi.hoisted(() => ({
  dailyCheckIn: {
    upsert: vi.fn(),
  },
  dailyCheckInAlert: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
  projectionOutbox: {
    upsert: vi.fn(),
  },
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
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => unknown) => callback(txMock)),
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { submitDailyCheckIn } from "./submit-daily-check-in";

describe("submitDailyCheckIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.account.findMany.mockResolvedValue([{ balance: 500 }]);
    prismaMock.bill.findMany.mockResolvedValue([
      { title: "Rent", amount: 400 },
      { title: "Phone", amount: 60 },
    ]);
    prismaMock.budgetCategory.findMany.mockResolvedValue([
      { id: "cat_food", name: "Food", monthlyLimit: 300 },
      { id: "cat_gas", name: "Gas", monthlyLimit: 120 },
    ]);
    txMock.dailyCheckIn.upsert.mockResolvedValue({
      id: "check-in-1",
      status: "completed",
    });
    txMock.dailyCheckInAlert.deleteMany.mockResolvedValue({ count: 1 });
    txMock.dailyCheckInAlert.createMany.mockResolvedValue({ count: 2 });
    txMock.projectionOutbox.upsert.mockResolvedValue({ id: "outbox-1" });
  });

  it("stores a durable check-in, replaces alert rows, and upserts a pending outbox job", async () => {
    const result = await submitDailyCheckIn({
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

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.dailyCheckIn.upsert).toHaveBeenCalledTimes(1);
    expect(txMock.dailyCheckInAlert.deleteMany).toHaveBeenCalledWith({
      where: { checkInId: "check-in-1" },
    });
    expect(txMock.dailyCheckInAlert.createMany).toHaveBeenCalledTimes(1);
    expect(txMock.projectionOutbox.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          dedupeKey: "daily_check_in:workspace-1:2026-04-09",
        },
      }),
    );
    expect(result.projection).toEqual({
      status: "pending",
      dedupeKey: "daily_check_in:workspace-1:2026-04-09",
    });
    expect(result.alerts.map((alert) => alert.code)).toEqual([
      "cashflow_negative",
      "category_at_risk",
    ]);
  });
});
