import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    integrationConnection: { upsert: vi.fn().mockResolvedValue(undefined) },
    auditEvent: { create: vi.fn().mockResolvedValue(undefined) },
  }),
}));

vi.mock("@/modules/integrations/integration-gateway", () => ({
  revokeIntegration: vi.fn().mockResolvedValue({
    connectionId: "conn-1",
    provider: "openai",
    secretFingerprint: "abc123def456",
    status: "revoked",
    revokedAt: "2026-04-09T00:00:00.000Z",
    auditEvent: { action: "integration_revoked" },
  }),
}));

import { revokeIntegration } from "@/modules/integrations/integration-gateway";
import { POST as revokePOST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("revoke integration route", () => {
  it("delegates to the gateway instead of mutating persistence inline", async () => {
    const response = await revokePOST(
      new Request("http://localhost/api/v1/integrations/revoke", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          actorUserId: "user-1",
          connectionId: "conn-1",
          provider: "openai",
          encryptedSecret: "sealed-value",
          secretFingerprint: "abc123def456",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(revokeIntegration).toHaveBeenCalledTimes(1);
  });
});
