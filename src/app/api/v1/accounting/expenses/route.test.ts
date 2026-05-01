import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resolveWorkspaceApiAccess = vi.hoisted(() => vi.fn());
const createWorkspaceApiAccessErrorResponse = vi.hoisted(() => vi.fn());

const prismaMock = {
  account: {
    findFirst: vi.fn(),
  },
  budgetCategory: {
    findFirst: vi.fn(),
  },
  financialTransaction: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/auth/workspace-api-access", () => ({
  resolveWorkspaceApiAccess,
  createWorkspaceApiAccessErrorResponse,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { POST } from "./route";

beforeEach(() => {
  createWorkspaceApiAccessErrorResponse.mockReturnValue(null);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/accounting/expenses", () => {
  it("authorizes the workspace and writes a normalized manual expense", async () => {
    resolveWorkspaceApiAccess.mockResolvedValue({
      workspaceId: "workspace-1",
      accessMode: "authenticated",
      actorUserId: "profile-1",
      role: "editor",
    });
    prismaMock.account.findFirst.mockResolvedValue({ id: "checking" });
    prismaMock.budgetCategory.findFirst.mockResolvedValue({ id: "food" });
    prismaMock.financialTransaction.create.mockResolvedValue({
      id: "txn-1",
      workspaceId: "workspace-1",
      amount: 18.25,
      merchantName: "Corner Store",
      occurredAt: new Date("2026-05-01T00:00:00.000Z"),
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/v1/accounting/expenses", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          budgetCategoryId: "food",
          accountId: "checking",
          merchantName: " Corner Store ",
          amount: "18.25",
          occurredAt: "2026-05-01",
          note: " lunch ",
        }),
      }),
    );

    expect(resolveWorkspaceApiAccess).toHaveBeenCalledWith("workspace-1");
    expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
      where: {
        id: "checking",
        workspaceId: "workspace-1",
      },
      select: { id: true },
    });
    expect(prismaMock.budgetCategory.findFirst).toHaveBeenCalledWith({
      where: {
        id: "food",
        workspaceId: "workspace-1",
      },
      select: { id: true },
    });
    expect(prismaMock.financialTransaction.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "workspace-1",
        actorUserId: "profile-1",
        budgetCategoryId: "food",
        accountId: "checking",
        merchantName: "Corner Store",
        amount: 18.25,
        occurredAt: new Date("2026-05-01T00:00:00.000Z"),
        note: "lunch",
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
    expect(response.status).toBe(200);
  });

  it("returns the workspace access error response when authorization fails", async () => {
    const deniedResponse = new Response(JSON.stringify({ error: { message: "Authentication is required." } }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
    resolveWorkspaceApiAccess.mockRejectedValue(new Error("Authentication is required."));
    createWorkspaceApiAccessErrorResponse.mockReturnValue(deniedResponse);

    const response = await POST(
      new Request("http://localhost/api/v1/accounting/expenses", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          amount: 18.25,
          occurredAt: "2026-05-01",
        }),
      }),
    );

    expect(createWorkspaceApiAccessErrorResponse).toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it("returns a synthetic success payload in demo mode without touching the database", async () => {
    resolveWorkspaceApiAccess.mockResolvedValue({
      workspaceId: "demo_workspace",
      accessMode: "demo",
      actorUserId: null,
      role: null,
    });

    const response = await POST(
      new Request("http://localhost/api/v1/accounting/expenses", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "demo_workspace",
          amount: 9.5,
          occurredAt: "2026-05-01",
          merchantName: "Demo Cafe",
        }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      expense: {
        workspaceId: "demo_workspace",
        amount: 9.5,
        merchantName: "Demo Cafe",
      },
    });
    expect(prismaMock.financialTransaction.create).not.toHaveBeenCalled();
  });

  it("rejects category and account ids that do not belong to the authorized workspace", async () => {
    resolveWorkspaceApiAccess.mockResolvedValue({
      workspaceId: "workspace-1",
      accessMode: "authenticated",
      actorUserId: "profile-1",
      role: "editor",
    });
    prismaMock.account.findFirst.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/v1/accounting/expenses", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          budgetCategoryId: "food",
          accountId: "foreign-account",
          amount: "18.25",
          occurredAt: "2026-05-01",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Choose an account from the active workspace." },
    });
    expect(prismaMock.financialTransaction.create).not.toHaveBeenCalled();
  });

  it("returns a 400 response when the amount is malformed", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/accounting/expenses", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          amount: "12abc",
          occurredAt: "2026-05-01",
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Enter an amount using digits and up to two decimals." },
    });
    expect(resolveWorkspaceApiAccess).not.toHaveBeenCalled();
  });
});