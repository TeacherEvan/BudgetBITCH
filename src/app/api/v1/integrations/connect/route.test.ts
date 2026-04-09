import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    integrationConnection: { upsert: vi.fn().mockResolvedValue(undefined) },
    auditEvent: { create: vi.fn().mockResolvedValue(undefined) },
  }),
}));

vi.mock("@/modules/integrations/integration-gateway", () => ({
  connectIntegration: vi.fn().mockResolvedValue({
    connectionId: "conn-1",
    provider: "openai",
    secretFingerprint: "abc123def456",
    status: "connected",
    auditEvent: { action: "integration_connected" },
  }),
}));

import { connectIntegration } from "@/modules/integrations/integration-gateway";
import { POST as connectPOST } from "./route";

afterEach(() => {
  delete process.env.PROVIDER_SECRET_ENCRYPTION_KEY;
  vi.clearAllMocks();
});

describe("connect integration route", () => {
  it("delegates to the gateway instead of handling persistence inline", async () => {
    process.env.PROVIDER_SECRET_ENCRYPTION_KEY = "budgetbitch-provider-secret-key-32";

    const response = await connectPOST(
      new Request("http://localhost/api/v1/integrations/connect", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          actorUserId: "user-1",
          connectionId: "conn-1",
          provider: "openai",
          secret: "sk_test_secret_value",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(connectIntegration).toHaveBeenCalledTimes(1);
  });
});
