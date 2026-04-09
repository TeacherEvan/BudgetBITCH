import { beforeEach, describe, expect, it, vi } from "vitest";
import { connectIntegration, revokeIntegration } from "./integration-gateway";

const prismaMock = {
  integrationConnection: { upsert: vi.fn() },
  auditEvent: { create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

describe("integration gateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("connectIntegration seals the secret, stores the provider label, and logs the audit event", async () => {
    const result = await connectIntegration(
      {
        workspaceId: "workspace-1",
        actorUserId: "user-1",
        connectionId: "conn-1",
        provider: "openai",
        secret: "sk_test_secret_value",
      },
      { encryptionKey: "budgetbitch-provider-secret-key-32" },
    );

    expect(prismaMock.integrationConnection.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("connected");
    expect(result.secretFingerprint).toMatch(/^[a-f0-9]{12}$/);
  });

  it("revokeIntegration marks the connection revoked and preserves the fingerprint", async () => {
    const result = await revokeIntegration({
      workspaceId: "workspace-1",
      actorUserId: "user-1",
      connectionId: "conn-1",
      provider: "openai",
      encryptedSecret: "sealed-value",
      secretFingerprint: "abc123def456",
    });

    expect(prismaMock.integrationConnection.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.auditEvent.create).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("revoked");
    expect(result.secretFingerprint).toBe("abc123def456");
  });
});
