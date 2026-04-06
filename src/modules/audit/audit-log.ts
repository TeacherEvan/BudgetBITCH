export type BuildAuditEventInput = {
  workspaceId: string;
  actorUserId: string;
  action:
    | "workspace_created"
    | "workspace_member_added"
    | "budget_category_created"
    | "bill_created"
    | "reminder_created"
    | "notification_sent"
    | "api_token_created"
    | "webhook_delivered"
    | "integration_connected"
    | "integration_revoked"
    | "consent_recorded";
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
};

export function buildAuditEvent(input: BuildAuditEventInput) {
  return {
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadataJson: input.metadata,
  };
}
