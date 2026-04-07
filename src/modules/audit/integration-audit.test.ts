import { describe, expect, it } from "vitest";
import {
  buildIntegrationConnectedAuditEvent,
  buildIntegrationRevokedAuditEvent,
} from "./integration-audit";

describe("integration audit events", () => {
  it("builds a connected audit event with the expected metadata", () => {
    expect(
      buildIntegrationConnectedAuditEvent({
        workspaceId: "ws_123",
        actorUserId: "user_123",
        provider: "claude",
        targetId: "conn_123",
      }),
    ).toEqual({
      workspaceId: "ws_123",
      actorUserId: "user_123",
      action: "integration_connected",
      targetType: "integration_connection",
      targetId: "conn_123",
      metadataJson: {
        provider: "claude",
        status: "connected",
      },
    });
  });

  it("builds a revoked audit event with the expected metadata", () => {
    expect(
      buildIntegrationRevokedAuditEvent({
        workspaceId: "ws_123",
        actorUserId: "user_123",
        provider: "copilot",
        targetId: "conn_123",
      }),
    ).toEqual({
      workspaceId: "ws_123",
      actorUserId: "user_123",
      action: "integration_revoked",
      targetType: "integration_connection",
      targetId: "conn_123",
      metadataJson: {
        provider: "copilot",
        status: "revoked",
      },
    });
  });
});
