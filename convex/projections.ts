import { v } from "convex/values";
import { mutation } from "./_generated/server";

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

export const projectDailyCheckIn = mutation({
  args: {
    syncSecret: v.string(),
    workspaceId: v.string(),
    sourceCheckInId: v.string(),
    profileId: v.union(v.string(), v.null()),
    checkInDate: v.string(),
    status: dailyCheckInStatusValidator,
    headline: v.string(),
    summary: v.union(v.string(), v.null()),
    snapshotJson: v.union(v.string(), v.null()),
    alertRows: v.array(
      v.object({
        sourceAlertId: v.string(),
        sourceCheckInId: v.string(),
        workspaceId: v.string(),
        checkInDate: v.string(),
        status: alertStatusValidator,
        severity: alertSeverityValidator,
        code: v.string(),
        title: v.string(),
        message: v.string(),
        metadataJson: v.union(v.string(), v.null()),
        resolvedAt: v.union(v.number(), v.null()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (!process.env.CONVEX_SYNC_SECRET) {
      throw new Error("CONVEX_SYNC_SECRET is not configured for Convex projection sync.");
    }

    if (args.syncSecret !== process.env.CONVEX_SYNC_SECRET) {
      throw new Error("Projection secret is invalid.");
    }

    const now = Date.now();
    const existingView = await ctx.db
      .query("dailyCheckInViews")
      .withIndex("by_sourceCheckInId", (q) =>
        q.eq("sourceCheckInId", args.sourceCheckInId),
      )
      .unique();

    const viewData = {
      workspaceId: args.workspaceId,
      sourceCheckInId: args.sourceCheckInId,
      profileId: args.profileId ?? undefined,
      checkInDate: args.checkInDate,
      status: args.status,
      headline: args.headline,
      summary: args.summary ?? undefined,
      snapshotJson: args.snapshotJson ?? undefined,
      alertCount: args.alertRows.length,
      openAlertCount: args.alertRows.filter((alert) => alert.status === "open").length,
      criticalAlertCount: args.alertRows.filter((alert) => alert.severity === "critical")
        .length,
      completedAt: now,
      lastProjectedAt: now,
    };

    if (existingView) {
      await ctx.db.patch(existingView._id, viewData);
    } else {
      await ctx.db.insert("dailyCheckInViews", viewData);
    }

    const existingAlertRows = await ctx.db
      .query("alertInboxRows")
      .withIndex("by_sourceCheckInId", (q) =>
        q.eq("sourceCheckInId", args.sourceCheckInId),
      )
      .take(100);

    for (const row of existingAlertRows) {
      await ctx.db.delete(row._id);
    }

    for (const alert of args.alertRows) {
      await ctx.db.insert("alertInboxRows", {
        workspaceId: alert.workspaceId,
        sourceAlertId: alert.sourceAlertId,
        sourceCheckInId: alert.sourceCheckInId,
        checkInDate: alert.checkInDate,
        status: alert.status,
        severity: alert.severity,
        code: alert.code,
        title: alert.title,
        message: alert.message,
        metadataJson: alert.metadataJson ?? undefined,
        resolvedAt: alert.resolvedAt ?? undefined,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt,
        lastProjectedAt: now,
      });
    }

    return {
      projectedAlertCount: args.alertRows.length,
      projectedAt: now,
    };
  },
});
