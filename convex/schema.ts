import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const workspaceTypeValidator = v.union(
  v.literal("personal"),
  v.literal("household"),
  v.literal("business"),
);

const workspaceRoleValidator = v.union(
  v.literal("owner"),
  v.literal("editor"),
  v.literal("approver"),
  v.literal("read_only"),
);

const dailyCheckInStatusValidator = v.union(
  v.literal("completed"),
  v.literal("skipped"),
);

const alertStatusValidator = v.union(
  v.literal("open"),
  v.literal("resolved"),
  v.literal("dismissed"),
);

const alertSeverityValidator = v.union(
  v.literal("info"),
  v.literal("warning"),
  v.literal("critical"),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    profileId: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    lastSyncedAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_profileId", ["profileId"]),

  workspaces: defineTable({
    workspaceId: v.string(),
    name: v.string(),
    type: workspaceTypeValidator,
    lastProjectedAt: v.number(),
  }).index("by_workspaceId", ["workspaceId"]),

  workspaceMemberships: defineTable({
    workspaceId: v.string(),
    profileId: v.string(),
    role: workspaceRoleValidator,
    isDefault: v.boolean(),
    lastOpenedAt: v.optional(v.number()),
    lastProjectedAt: v.number(),
  })
    .index("by_workspaceId_and_profileId", ["workspaceId", "profileId"])
    .index("by_profileId_and_workspaceId", ["profileId", "workspaceId"])
    .index("by_profileId_and_isDefault", ["profileId", "isDefault"]),

  dailyCheckInViews: defineTable({
    workspaceId: v.string(),
    sourceCheckInId: v.string(),
    profileId: v.optional(v.string()),
    checkInDate: v.string(),
    status: dailyCheckInStatusValidator,
    headline: v.string(),
    summary: v.optional(v.string()),
    snapshotJson: v.optional(v.string()),
    alertCount: v.number(),
    openAlertCount: v.number(),
    criticalAlertCount: v.number(),
    completedAt: v.optional(v.number()),
    lastProjectedAt: v.number(),
  })
    .index("by_workspaceId_and_checkInDate", ["workspaceId", "checkInDate"])
    .index("by_workspaceId_and_status_and_checkInDate", ["workspaceId", "status", "checkInDate"])
    .index("by_sourceCheckInId", ["sourceCheckInId"]),

  alertInboxRows: defineTable({
    workspaceId: v.string(),
    sourceAlertId: v.string(),
    sourceCheckInId: v.string(),
    checkInDate: v.string(),
    status: alertStatusValidator,
    severity: alertSeverityValidator,
    code: v.string(),
    title: v.string(),
    message: v.string(),
    metadataJson: v.optional(v.string()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastProjectedAt: v.number(),
  })
    .index("by_workspaceId_and_createdAt", ["workspaceId", "createdAt"])
    .index("by_workspaceId_and_status_and_createdAt", ["workspaceId", "status", "createdAt"])
    .index("by_workspaceId_and_severity_and_createdAt", ["workspaceId", "severity", "createdAt"])
    .index("by_workspaceId_and_checkInDate", ["workspaceId", "checkInDate"])
    .index("by_sourceAlertId", ["sourceAlertId"])
    .index("by_sourceCheckInId", ["sourceCheckInId"]),

  workspaceActivity: defineTable({
    workspaceId: v.string(),
    sourceEventId: v.string(),
    profileId: v.optional(v.string()),
    action: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    headline: v.string(),
    detail: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    occurredAt: v.number(),
    lastProjectedAt: v.number(),
  })
    .index("by_workspaceId_and_occurredAt", ["workspaceId", "occurredAt"])
    .index("by_workspaceId_and_action_and_occurredAt", ["workspaceId", "action", "occurredAt"])
    .index("by_sourceEventId", ["sourceEventId"]),
});
