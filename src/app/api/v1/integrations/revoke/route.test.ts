import { afterEach, describe, expect, it, vi } from "vitest";

const { auditEventCreate, integrationConnectionUpsert } = vi.hoisted(() => ({
  integrationConnectionUpsert: vi.fn(),
  auditEventCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    integrationConnection: {
      upsert: integrationConnectionUpsert,
    },
    auditEvent: {
      create: auditEventCreate,
    },
  }),
}));

import { POST } from "./route";

describe("POST /api/v1/integrations/revoke", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a revoked integration response with audit metadata", async () => {
    integrationConnectionUpsert.mockResolvedValue(undefined);
    auditEventCreate.mockResolvedValue(undefined);

    const request = new Request("http://localhost/api/v1/integrations/revoke", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_123",
        actorUserId: "user_123",
        connectionId: "conn_123",
        provider: "copilot",
        encryptedSecret: "sealed-value",
        secretFingerprint: "abc123def456",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      connectionId: "conn_123",
      provider: "copilot",
      secretFingerprint: "abc123def456",
      status: "revoked",
      auditEvent: {
        workspaceId: "ws_123",
        actorUserId: "user_123",
        action: "integration_revoked",
        targetType: "integration_connection",
        targetId: "conn_123",
        metadataJson: {
          provider: "copilot",
          status: "revoked",
        },
      },
    });
    expect(Date.parse(json.revokedAt)).not.toBeNaN();
    expect(integrationConnectionUpsert).toHaveBeenCalledWith({
      where: { id: "conn_123" },
      update: {
        workspaceId: "ws_123",
        provider: "copilot",
        displayName: "GitHub Copilot",
        authType: "api_key",
        encryptedSecret: "sealed-value",
        secretFingerprint: "abc123def456",
        status: "revoked",
        revokedAt: expect.any(Date),
      },
      create: {
        id: "conn_123",
        workspaceId: "ws_123",
        provider: "copilot",
        displayName: "GitHub Copilot",
        authType: "api_key",
        encryptedSecret: "sealed-value",
        secretFingerprint: "abc123def456",
        status: "revoked",
        revokedAt: expect.any(Date),
      },
    });
    expect(auditEventCreate).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws_123",
        actorUserId: "user_123",
        action: "integration_revoked",
        targetType: "integration_connection",
        targetId: "conn_123",
        metadataJson: {
          provider: "copilot",
          status: "revoked",
        },
      },
    });
  });

  it("rejects malformed revoke payloads", async () => {
    const request = new Request("http://localhost/api/v1/integrations/revoke", {
      method: "POST",
      body: JSON.stringify({
        workspaceId: "ws_123",
        actorUserId: "user_123",
        connectionId: "conn_123",
        provider: "openai",
        encryptedSecret: "sealed-value",
      }),
      headers: { "content-type": "application/json" },
    });

    await expect(POST(request)).rejects.toThrow();
    expect(integrationConnectionUpsert).not.toHaveBeenCalled();
    expect(auditEventCreate).not.toHaveBeenCalled();
  });
});
