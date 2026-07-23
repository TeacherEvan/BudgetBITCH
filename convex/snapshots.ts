// convex/snapshots.ts
import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

/**
 * Upserts a daily snapshot of the user's budget data.
 * Called daily via Service Worker to backup local data to Convex.
 */
export const upsertDailySnapshot = mutation({
  args: {
    accountId: v.optional(v.string()),
    wizardProfile: v.any(), // Full WizardProfile object
    totals: v.object({
      income: v.number(),
      expenses: v.number(),
      savings: v.number(),
      netWorth: v.optional(v.number()),
    }),
    criticalExpenseCommitment: v.optional(v.object({
      expenseKey: v.string(),
      estimatedMonthlyCost: v.number(),
      status: v.string(),
      compoundProjection: v.object({
        oneYear: v.number(),
        fiveYears: v.number(),
        tenYears: v.number(),
      }),
    })),
    fullBackupData: v.optional(v.any()),
    storeCounts: v.optional(v.record(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const createdAt = Date.now();

    // Check if snapshot already exists for today
    const existing = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId).eq("date", today))
      .first();

    if (existing) {
      // Update existing snapshot
      await ctx.db.patch(existing._id, {
        accountId: args.accountId,
        wizardProfile: args.wizardProfile,
        totals: args.totals,
        criticalExpenseCommitment: args.criticalExpenseCommitment,
        fullBackupData: args.fullBackupData,
        storeCounts: args.storeCounts,
        createdAt,
      });
      return { success: true, updated: true, date: today };
    } else {
      // Insert new snapshot
      await ctx.db.insert("dailySnapshots", {
        userId,
        accountId: args.accountId,
        date: today,
        wizardProfile: args.wizardProfile,
        totals: args.totals,
        criticalExpenseCommitment: args.criticalExpenseCommitment,
        fullBackupData: args.fullBackupData,
        storeCounts: args.storeCounts,
        createdAt,
      });
      return { success: true, created: true, date: today };
    }
  },
});

/**
 * Retrieves the latest daily snapshot for the authenticated user.
 */
export const getLatestSnapshot = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) return null;
      return await ctx.db
        .query("dailySnapshots")
        .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
    } catch (error) {
      console.error("Error fetching latest snapshot:", error);
      return null;
    }
  },
});

/**
 * Lists the last 7 snapshots for the user with metadata.
 */
export const listCloudSnapshots = query({
  args: {},
  handler: async (ctx) => {
    let userId: Id<"users"> | null;
    try {
      userId = await getAuthUserId(ctx);
    } catch (e) {
      throw new ConvexError(
        `Auth failed in listCloudSnapshots: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    if (!userId) return [];
    return await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(7);
  },
});

/**
 * Retrieves a specific snapshot by ID.
 */
export const getSnapshotById = query({
  args: { snapshotId: v.id("dailySnapshots") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot || snapshot.userId !== userId) {
      return null;
    }
    return snapshot;
  },
});