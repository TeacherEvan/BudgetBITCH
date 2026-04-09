import { afterEach, describe, expect, it, vi } from "vitest";

const authorizeIntegrationMutation = vi.hoisted(() => vi.fn());
const revokeIntegration = vi.hoisted(() => vi.fn());
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
  revokeIntegration,
  IntegrationGatewayError: errorClasses.IntegrationGatewayError,
}));

import { POST as revokePOST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("revoke integration route", () => {
  it("authorizes the workspace and revokes the stored provider connection", async () => {
    authorizeIntegrationMutation.mockResolvedValue({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
    });
    revokeIntegration.mockResolvedValue({
      connectionId: "conn-db-1",
      provider: "openai",
      secretFingerprint: "abc123def456",
      status: "revoked",
      revokedAt: "2026-04-09T00:00:00.000Z",
      auditEvent: { action: "integration_revoked" },
    });

    const response = await revokePOST(
      new Request("http://localhost/api/v1/integrations/revoke", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          provider: "openai",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(authorizeIntegrationMutation).toHaveBeenCalledWith("workspace-1");
    expect(revokeIntegration).toHaveBeenCalledWith({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
      provider: "openai",
    });
  });

  it("returns gateway errors without leaking internal state", async () => {
    authorizeIntegrationMutation.mockResolvedValue({
      workspaceId: "workspace-1",
      actorUserId: "profile-1",
    });
    revokeIntegration.mockRejectedValue(
      new errorClasses.IntegrationGatewayError(
        "No integration connection exists for this workspace and provider.",
        404,
      ),
    );

    const response = await revokePOST(
      new Request("http://localhost/api/v1/integrations/revoke", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          provider: "openai",
        }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No integration connection exists for this workspace and provider.",
    });
  });
});
