import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { normalizeExpenseEntryInput } from "@/modules/accounting/accounting-schema";
import {
  createWorkspaceApiAccessErrorResponse,
  resolveWorkspaceApiAccess,
} from "@/lib/auth/workspace-api-access";
import { getPrismaClient } from "@/lib/prisma";

function toUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function createBadRequestResponse(message: string) {
  return NextResponse.json({ error: { message } }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalizeExpenseEntryInput(body);
    const access = await resolveWorkspaceApiAccess(input.workspaceId);

    if (access.accessMode === "demo") {
      return NextResponse.json({
        expense: {
          id: "demo-expense",
          workspaceId: access.workspaceId,
          amount: input.amount,
          merchantName: input.merchantName ?? null,
          occurredAt: toUtcDate(input.occurredAt).toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
    }

    const prisma = getPrismaClient();

    if (input.accountId) {
      const account = await prisma.account.findFirst({
        where: {
          id: input.accountId,
          workspaceId: access.workspaceId,
        },
        select: { id: true },
      });

      if (!account) {
        return createBadRequestResponse("Choose an account from the active workspace.");
      }
    }

    if (input.budgetCategoryId) {
      const category = await prisma.budgetCategory.findFirst({
        where: {
          id: input.budgetCategoryId,
          workspaceId: access.workspaceId,
        },
        select: { id: true },
      });

      if (!category) {
        return createBadRequestResponse("Choose a category from the active workspace.");
      }
    }

    const expense = await prisma.financialTransaction.create({
      data: {
        workspaceId: access.workspaceId,
        actorUserId: access.actorUserId,
        budgetCategoryId: input.budgetCategoryId ?? null,
        accountId: input.accountId ?? null,
        merchantName: input.merchantName ?? null,
        amount: input.amount,
        occurredAt: toUtcDate(input.occurredAt),
        note: input.note ?? null,
        type: "expense",
        source: "manual",
      },
      select: {
        id: true,
        workspaceId: true,
        amount: true,
        merchantName: true,
        occurredAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ expense });
  } catch (error) {
    const accessErrorResponse = createWorkspaceApiAccessErrorResponse(error);

    if (accessErrorResponse) {
      return accessErrorResponse;
    }

    if (error instanceof ZodError) {
      return createBadRequestResponse(error.issues[0]?.message ?? "Invalid expense payload.");
    }

    throw error;
  }
}