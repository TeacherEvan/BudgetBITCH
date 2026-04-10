import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { runDailyCheckInEngine } from "./daily-check-in-engine";
import { createCheckInProjectionOutboxJob } from "@/modules/projections/check-in-outbox";

export type SubmitDailyCheckInInput = {
  workspaceId: string;
  actorUserId: string;
  checkInDate: string;
  plannedSpend: number;
  categorySpending: Array<{
    categoryId: string;
    spent: number;
  }>;
};

function buildUtcDayRange(checkInDate: string) {
  const dayStart = new Date(`${checkInDate}T00:00:00.000Z`);
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return { dayStart, nextDay };
}

export async function submitDailyCheckIn(input: SubmitDailyCheckInInput) {
  const prisma = getPrismaClient();
  const { dayStart, nextDay } = buildUtcDayRange(input.checkInDate);

  const [accounts, bills, categories] = await Promise.all([
    prisma.account.findMany({
      where: { workspaceId: input.workspaceId },
      select: { balance: true },
    }),
    prisma.bill.findMany({
      where: {
        workspaceId: input.workspaceId,
        dueDate: {
          gte: dayStart,
          lt: nextDay,
        },
      },
      select: { title: true, amount: true },
    }),
    prisma.budgetCategory.findMany({
      where: { workspaceId: input.workspaceId },
      select: { id: true, name: true, monthlyLimit: true },
    }),
  ]);

  const spendingByCategoryId = new Map(
    input.categorySpending.map((category) => [category.categoryId, category.spent]),
  );
  const cashOnHand = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  );
  const dueBillTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const result = runDailyCheckInEngine({
    checkInDate: input.checkInDate,
    cashflow: {
      availableCash: cashOnHand,
      plannedOutflow: input.plannedSpend,
      committedOutflow: dueBillTotal,
    },
    categories: categories.map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      budgetedAmount: Number(category.monthlyLimit),
      spentAmount: spendingByCategoryId.get(category.id) ?? 0,
    })),
  });

  return prisma.$transaction(async (tx) => {
    const savedCheckIn = await tx.dailyCheckIn.upsert({
      where: {
        workspaceId_checkInDate: {
          workspaceId: input.workspaceId,
          checkInDate: dayStart,
        },
      },
      update: {
        actorUserId: input.actorUserId,
        status: "completed",
        checkInJson: result as Prisma.InputJsonValue,
      },
      create: {
        workspaceId: input.workspaceId,
        actorUserId: input.actorUserId,
        checkInDate: dayStart,
        status: "completed",
        checkInJson: result as Prisma.InputJsonValue,
      },
    });

    await tx.dailyCheckInAlert.deleteMany({
      where: { checkInId: savedCheckIn.id },
    });

    if (result.alerts.length > 0) {
      await tx.dailyCheckInAlert.createMany({
        data: result.alerts.map((alert) => ({
          workspaceId: input.workspaceId,
          checkInId: savedCheckIn.id,
          status: "open",
          severity: alert.severity,
          code: alert.code,
          title: alert.title,
          message: alert.message,
          metadataJson: alert.metadata as Prisma.InputJsonValue,
        })),
      });
    }

    const projectionJob = createCheckInProjectionOutboxJob({
      workspaceId: input.workspaceId,
      checkInId: savedCheckIn.id,
      checkInDate: input.checkInDate,
      payload: {
        headline: result.headline,
        alertCount: result.alerts.length,
      },
    });

    await tx.projectionOutbox.upsert({
      where: {
        dedupeKey: projectionJob.dedupeKey,
      },
      update: {
        sourceId: projectionJob.sourceId,
        payloadJson: projectionJob.payloadJson as Prisma.InputJsonValue,
        status: projectionJob.status,
        attemptCount: 0,
        availableAt: projectionJob.availableAt,
        lastAttemptAt: null,
        processedAt: null,
        lastError: null,
      },
      create: projectionJob,
    });

    return {
      checkInId: savedCheckIn.id,
      status: savedCheckIn.status,
      headline: result.headline,
      summary: result.summary,
      alerts: result.alerts,
      projection: {
        status: "pending" as const,
        dedupeKey: projectionJob.dedupeKey,
      },
    };
  });
}
