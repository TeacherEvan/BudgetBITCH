import { v } from "convex/values";
import { query } from "./_generated/server";
import { getWorkspaceAccess } from "./lib/auth";

const DEFAULT_LIST_LIMIT = 10;
const MAX_LIST_LIMIT = 50;

const dailyCheckInStatusValidator = v.union(
  v.literal("completed"),
  v.literal("skipped"),
);

const alertStatusValidator = v.union(
  v.literal("open"),
  v.literal("resolved"),
  v.literal("dismissed"),
);

function clampListLimit(limit: number) {
  return Math.max(1, Math.min(Math.floor(limit), MAX_LIST_LIMIT));
}

export const listDailyCheckInViews = query({
  args: {
    workspaceId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(dailyCheckInStatusValidator),
  },
  handler: async (ctx, args) => {
    const access = await getWorkspaceAccess(ctx, args.workspaceId);

    if (!access) {
      return [];
    }

    const limit = clampListLimit(args.limit ?? DEFAULT_LIST_LIMIT);
    const status = args.status;

    if (status !== undefined) {
      return await ctx.db
        .query("dailyCheckInViews")
        .withIndex("by_workspaceId_and_status_and_checkInDate", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("status", status),
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("dailyCheckInViews")
      .withIndex("by_workspaceId_and_checkInDate", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .take(limit);
  },
});

export const listAlertInboxRows = query({
  args: {
    workspaceId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(alertStatusValidator),
  },
  handler: async (ctx, args) => {
    const access = await getWorkspaceAccess(ctx, args.workspaceId);

    if (!access) {
      return [];
    }

    const limit = clampListLimit(args.limit ?? DEFAULT_LIST_LIMIT);
    const status = args.status;

    if (status !== undefined) {
      return await ctx.db
        .query("alertInboxRows")
        .withIndex("by_workspaceId_and_status_and_createdAt", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("status", status),
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("alertInboxRows")
      .withIndex("by_workspaceId_and_createdAt", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .take(limit);
  },
});

export const listWorkspaceActivity = query({
  args: {
    workspaceId: v.string(),
    limit: v.optional(v.number()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await getWorkspaceAccess(ctx, args.workspaceId);

    if (!access) {
      return [];
    }

    const limit = clampListLimit(args.limit ?? DEFAULT_LIST_LIMIT);
    const action = args.action;

    if (action !== undefined) {
      return await ctx.db
        .query("workspaceActivity")
        .withIndex("by_workspaceId_and_action_and_occurredAt", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("action", action),
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("workspaceActivity")
      .withIndex("by_workspaceId_and_occurredAt", (q) =>
        q.eq("workspaceId", args.workspaceId),
      )
      .order("desc")
      .take(limit);
  },
});
