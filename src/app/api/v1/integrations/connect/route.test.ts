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

describe("POST /api/v1/integrations/connect", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("creates a connected integration response with a fingerprint and audit event", async () => {
    vi.stubEnv(
      "PROVIDER_SECRET_ENCRYPTION_KEY",
      "budgetbitch-provider-secret-key-32",
    );
    integrationConnectionUpsert.mockResolvedValue(undefined);
    auditEventCreate.mockResolvedValue(undefined);

    const request = new Request(
      "http://localhost/api/v1/integrations/connect",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_123",
          actorUserId: "user_123",
          connectionId: "conn_123",
          provider: "openai",
          secret: "sk_live_super_secret_value",
        }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      connectionId: "conn_123",
      provider: "openai",
      status: "connected",
      auditEvent: {
        workspaceId: "ws_123",
        actorUserId: "user_123",
        action: "integration_connected",
        targetType: "integration_connection",
        targetId: "conn_123",
        metadataJson: {
          provider: "openai",
          status: "connected",
        },
      },
    });
    expect(json.secretFingerprint).toMatch(/^[a-f0-9]{12}$/);
    expect(integrationConnectionUpsert).toHaveBeenCalledWith({
      where: { id: "conn_123" },
      update: {
        workspaceId: "ws_123",
        provider: "openai",
        displayName: "OpenAI",
        authType: "api_key",
        encryptedSecret: expect.any(String),
        secretFingerprint: json.secretFingerprint,
        status: "connected",
        revokedAt: null,
      },
      create: {
        id: "conn_123",
        workspaceId: "ws_123",
        provider: "openai",
        displayName: "OpenAI",
        authType: "api_key",
        encryptedSecret: expect.any(String),
        secretFingerprint: json.secretFingerprint,
        status: "connected",
      },
    });
    expect(auditEventCreate).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws_123",
        actorUserId: "user_123",
        action: "integration_connected",
        targetType: "integration_connection",
        targetId: "conn_123",
        metadataJson: {
          provider: "openai",
          status: "connected",
        },
      },
    });
  });

  it("returns a server error when the encryption key is missing", async () => {
    vi.stubEnv("PROVIDER_SECRET_ENCRYPTION_KEY", "");

    const request = new Request(
      "http://localhost/api/v1/integrations/connect",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_123",
          actorUserId: "user_123",
          connectionId: "conn_123",
          provider: "claude",
          secret: "sk_test_secret",
        }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toContain("PROVIDER_SECRET_ENCRYPTION_KEY");
    expect(integrationConnectionUpsert).not.toHaveBeenCalled();
    expect(auditEventCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid providers at the schema boundary", async () => {
    vi.stubEnv(
      "PROVIDER_SECRET_ENCRYPTION_KEY",
      "budgetbitch-provider-secret-key-32",
    );

    const request = new Request(
      "http://localhost/api/v1/integrations/connect",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_123",
          actorUserId: "user_123",
          connectionId: "conn_123",
          provider: "plaid",
          secret: "sk_test_secret",
        }),
        headers: { "content-type": "application/json" },
      },
    );

    await expect(POST(request)).rejects.toThrow();
    expect(integrationConnectionUpsert).not.toHaveBeenCalled();
    expect(auditEventCreate).not.toHaveBeenCalled();
  });

  it("rejects empty secrets at the schema boundary", async () => {
    vi.stubEnv(
      "PROVIDER_SECRET_ENCRYPTION_KEY",
      "budgetbitch-provider-secret-key-32",
    );

    const request = new Request(
      "http://localhost/api/v1/integrations/connect",
      {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "ws_123",
          actorUserId: "user_123",
          connectionId: "conn_123",
          provider: "openai",
          secret: "",
        }),
        headers: { "content-type": "application/json" },
      },
    );

    await expect(POST(request)).rejects.toThrow();
    expect(integrationConnectionUpsert).not.toHaveBeenCalled();
    expect(auditEventCreate).not.toHaveBeenCalled();
  });
});
