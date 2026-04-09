import { afterEach, describe, expect, it, vi } from "vitest";

const authorizeIntegrationMutation = vi.hoisted(() => vi.fn());
const connectIntegration = vi.hoisted(() => vi.fn());
const errorClasses = vi.hoisted(() => ({
  IntegrationRouteGuardError: class IntegrationRouteGuardError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
  IntegrationGatewayError: class IntegrationGatewayError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/auth/integration-route-guard", () => ({
  authorizeIntegrationMutation,
  IntegrationRouteGuardError: errorClasses.IntegrationRouteGuardError,
}));

vi.mock("@/modules/integrations/integration-gateway", () => ({
  connectIntegration,
  IntegrationGatewayError: errorClasses.IntegrationGatewayError,
}));

import { POST as connectPOST } from "./route";

afterEach(() => {
  delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY;
  vi.clearAllMocks();
});

describe("connect integration route", () => {
  it("authorizes the workspace and delegates only trusted fields to the gateway", async () => {
    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = "budgetbitch-provider-secret-key-32";
    authorizeIntegrationMutation.mockResolvedValue({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
    });
    connectIntegration.mockResolvedValue({
      connectionId: "conn-db-1",
      provider: "openai",
      secretFingerprint: "abc123def456",
      status: "connected",
      auditEvent: { action: "integration_connected" },
    });

    const response = await connectPOST(
      new Request("http://localhost/api/v1/integrations/connect", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          provider: "openai",
          secret: "sk_test_secret_value",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authorizeIntegrationMutation).toHaveBeenCalledWith("workspace-1");
    expect(connectIntegration).toHaveBeenCalledWith(
      {
        workspaceId: "workspace-1",
        actorUserId: "profile-1",
        provider: "openai",
        secret: "sk_test_secret_value",
      },
      { encryptionKey: "budgetbitch-provider-secret-key-32" },
    );
  });

  it("returns the route-guard status for unauthenticated callers", async () => {
    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = "budgetbitch-provider-secret-key-32";
    authorizeIntegrationMutation.mockRejectedValue(
      new errorClasses.IntegrationRouteGuardError("Authentication is required.", 401),
    );

    const response = await connectPOST(
      new Request("http://localhost/api/v1/integrations/connect", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          provider: "openai",
          secret: "sk_test_secret_value",
        }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });
});
