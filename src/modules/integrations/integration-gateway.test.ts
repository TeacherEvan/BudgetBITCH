import { beforeEach, describe, expect, it, vi } from "vitest";

const txMock = vi.hoisted(() => ({
  integrationConnection: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  auditEvent: { create: vi.fn() },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => unknown) => callback(txMock)),
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import {
  IntegrationGatewayError,
  connectIntegration,
  revokeIntegration,
} from "./integration-gateway";

describe("integration gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connectIntegration stores provider data inside a transaction and returns the saved id", async () => {
    txMock.integrationConnection.findMany.mockResolvedValue([]);
    txMock.integrationConnection.create.mockResolvedValue({ id: "conn-db-1" });
    txMock.auditEvent.create.mockResolvedValue(undefined);

    const result = await connectIntegration(
      {
        workspaceId: "workspace-1",
        actorUserId: "profile-1",
        provider: "openai",
        secret: "sk_test_secret_value",
      },
      { encryptionKey: "budgetbitch-provider-secret-key-32" },
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.integrationConnection.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace-1", provider: "openai" },
      orderBy: { updatedAt: "desc" },
      take: 2,
    });
    expect(txMock.integrationConnection.create).toHaveBeenCalledTimes(1);
    expect(txMock.integrationConnection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workspaceId: "workspace-1",
          provider: "openai",
          displayName: "OpenAI",
          authType: "api_key",
          status: "connected",
        }),
      }),
    );
    expect(txMock.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(result.connectionId).toBe("conn-db-1");
    expect(result.status).toBe("connected");
    expect(result.secretFingerprint).toMatch(/^[a-f0-9]{12}$/);
  });

  it("revokeIntegration revokes the persisted secret instead of trusting client input", async () => {
    txMock.integrationConnection.findMany.mockResolvedValue([
      {
        id: "conn-db-1",
        encryptedSecret: "sealed-value",
        secretFingerprint: "abc123def456",
        status: "connected",
      },
    ]);
    txMock.integrationConnection.update.mockResolvedValue({ id: "conn-db-1" });
    txMock.auditEvent.create.mockResolvedValue(undefined);

    const result = await revokeIntegration({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      provider: "openai",
    });

    expect(txMock.integrationConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "conn-db-1" },
        data: expect.objectContaining({
          encryptedSecret: "sealed-value",
          secretFingerprint: "abc123def456",
          status: "revoked",
        }),
      }),
    );
    expect(txMock.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(result.connectionId).toBe("conn-db-1");
    expect(result.status).toBe("revoked");
    expect(result.secretFingerprint).toBe("abc123def456");
  });

  it("revokeIntegration returns 404 when no authorized connection exists", async () => {
    txMock.integrationConnection.findMany.mockResolvedValue([]);

    await expect(
      revokeIntegration({
        workspaceId: "workspace-1",
        actorUserId: "profile-1",
        provider: "openai",
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: "No integration connection exists for this workspace and provider.",
    } satisfies Pick<IntegrationGatewayError, "status" | "message">);
  });
});
