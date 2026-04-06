import { buildAuditEvent } from "./audit-log";

type BuildIntegrationAuditInput = {
  workspaceId: string;
  actorUserId: string;
  provider: string;
  targetId: string;
};

export function buildIntegrationConnectedAuditEvent(
  input: BuildIntegrationAuditInput,
) {
  return buildAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "integration_connected",
    targetType: "integration_connection",
    targetId: input.targetId,
    metadata: {
      provider: input.provider,
      status: "connected",
    },
  });
}

export function buildIntegrationRevokedAuditEvent(
  input: BuildIntegrationAuditInput,
) {
  return buildAuditEvent({
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: "integration_revoked",
    targetType: "integration_connection",
    targetId: input.targetId,
    metadata: {
      provider: input.provider,
      status: "revoked",
    },
  });
}
