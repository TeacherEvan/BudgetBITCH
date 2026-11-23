// convex/snapshots.ts
import { v, ConvexError } from "convex/values";
import { mutation, internalMutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

const DELETE_CHUNK_SIZE = 500;

// P1-C8: leave headroom so a chunk never trips Convex's per-transaction write
// limits. Continuations run in fresh transactions via the scheduler.
const WRITE_RESERVE_DOCS = 32;
const WRITE_RESERVE_BYTES = 256 * 1024;

async function hasWriteBudget(ctx: MutationCtx): Promise<boolean> {
  const metrics = await ctx.meta.getTransactionMetrics();
  return (
    metrics.documentsWritten.remaining > WRITE_RESERVE_DOCS &&
    metrics.bytesWritten.remaining > WRITE_RESERVE_BYTES
  );
}

/**
 * Upserts a daily snapshot of the user's budget data.
 * Called daily via Service Worker to backup local data to Convex.
 * Uses insert-then-read with the by_user_account_date index for idempotency
 * scoped to (user, account, day).
 * Attempts insert, then reads to detect conflicts. If conflict, updates the winner (first insert).
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

    // INSERT: Attempt to insert the snapshot
    const insertedId = await ctx.db.insert("dailySnapshots", {
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

    // READ: use the per-account key so two boards owned by the same user do
    // not overwrite each other's snapshot for the same day (P1-C8).
    const firstSnapshot = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user_account_date", (q) =>
        q.eq("userId", userId).eq("accountId", args.accountId).eq("date", today),
      )
      .order("asc")
      .first();

    if (!firstSnapshot) {
      // Should not happen since we just inserted, but handle gracefully
      return { success: true, created: true, date: today, snapshotId: insertedId };
    }

    // If we won the race (our insert is the first/oldest), update it with latest data and return created
    if (firstSnapshot._id === insertedId) {
      // Ensure the winner has the latest data (in case args differ between concurrent calls)
      await ctx.db.patch(insertedId, {
        accountId: args.accountId,
        wizardProfile: args.wizardProfile,
        totals: args.totals,
        criticalExpenseCommitment: args.criticalExpenseCommitment,
        fullBackupData: args.fullBackupData,
        storeCounts: args.storeCounts,
        createdAt,
      });
      return { success: true, created: true, date: today, snapshotId: insertedId };
    }

    // We lost the race: delete our insert and update the winner with latest data
    await ctx.db.delete(insertedId);
    await ctx.db.patch(firstSnapshot._id, {
      accountId: args.accountId,
      wizardProfile: args.wizardProfile,
      totals: args.totals,
      criticalExpenseCommitment: args.criticalExpenseCommitment,
      fullBackupData: args.fullBackupData,
      storeCounts: args.storeCounts,
      createdAt,
    });
    return { success: true, updated: true, date: today, snapshotId: firstSnapshot._id };
  },
});

/**
 * Retrieves the latest daily snapshot for the authenticated user.
 */
export const getLatestSnapshot = query({
  args: { accountId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    try {
      const userId = await getAuthUserId(ctx);
      if (!userId) return null;
      if (args.accountId !== undefined) {
        return await ctx.db
          .query("dailySnapshots")
          .withIndex("by_user_account_date", (q) =>
            q.eq("userId", userId).eq("accountId", args.accountId),
          )
          .order("desc")
          .first();
      }
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
// Kept zero-argument for backward compatibility: the only existing caller
// (W2-owned src/components/settings/storage-diagnostics-modal.tsx) calls this
// with no args, and Convex's generated types require an args object as soon as
// a validator declares one. Account-scoped listing lives in the companion
// query below — see the W4 report for the cross-scope rationale.
export const listCloudSnapshots = query({
  args: {},
  handler: async (ctx) => {
    let userId: Id<"users"> | null = null;
    try {
      userId = await getAuthUserId(ctx);
    } catch (e) {
      console.error("Auth failed in listCloudSnapshots:", e);
      return [];
    }
    if (!userId) return [];
    return await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(7);
  },
});

/** Account-scoped variant of `listCloudSnapshots` (P1-C8 / W2 client fix). */
export const listCloudSnapshotsForAccount = query({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user_account_date", (q) =>
        q.eq("userId", userId).eq("accountId", args.accountId),
      )
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

/**
 * Permanently deletes ALL daily snapshots, receipts, and merchant aliases for the user from Convex cloud storage.
 * Called when the user executes a "Reset all data" wipe.
 */
export const deleteAllUserSnapshots = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, deletedSnapshots: 0, deletedReceipts: 0 };
    }

    // 1. Delete daily snapshots in batches (≤500 per chunk)
    let deletedSnapshots = 0;
    let snapshotsMore = false;
    while (true) {
      const batch = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(DELETE_CHUNK_SIZE);
      for (const snap of batch) {
        await ctx.db.delete(snap._id);
      }
      deletedSnapshots += batch.length;
      if (batch.length < DELETE_CHUNK_SIZE) break;
      // One chunk done and rows remain — continue in a fresh transaction.
      snapshotsMore = true;
      break;
    }
    if (snapshotsMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.snapshots.deleteSnapshotsChunk,
        { userId },
      );
      return { success: true, deletedSnapshots, continuation: true };
    }

    // Phases 2 & 3 (receipts, aliases) are handled by the bounded continuation
    // chunk. Never run multiple unbounded while(true) delete loops in the same
    // transaction: each chunk keeps a fixed total-write budget (P1-C8).
    const receiptsRemaining = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(1);
    const aliasesRemaining = await ctx.db
      .query("merchantAliases")
      .withIndex("by_user_and_normalised", (q) => q.eq("userId", userId))
      .take(1);
    if (receiptsRemaining.length > 0 || aliasesRemaining.length > 0) {
      await ctx.scheduler.runAfter(0, internal.snapshots.deleteSnapshotsChunk, { userId });
      return { success: true, deletedSnapshots, deletedReceipts: 0, continuation: true };
    }

    return {
      success: true,
      deletedSnapshots,
      deletedReceipts: 0,
      deletedAliases: 0,
    };
  },
});

/**
 * Continuation chunk for `deleteAllUserSnapshots`: deletes the remaining
 * daily snapshots (≤500), then re-schedules itself while rows remain.
 */
export const deleteSnapshotsChunk = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    let deleted = 0;
    let hasMore = false;

    // 1. dailySnapshots
    const snapshotsBatch = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(DELETE_CHUNK_SIZE);
    for (const snap of snapshotsBatch) {
      await ctx.db.delete(snap._id);
    }
    deleted += snapshotsBatch.length;
    if (snapshotsBatch.length === DELETE_CHUNK_SIZE) {
      hasMore = true;
    }

    // 2. receipts (if capacity in this chunk)
    if (!hasMore && !(await hasWriteBudget(ctx))) {
      hasMore = true; // yield; the next transaction continues from receipts
    }
    if (!hasMore) {
      const remainingLimit = DELETE_CHUNK_SIZE - deleted;
      if (remainingLimit > 0) {
        const receiptsBatch = await ctx.db
          .query("receipts")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .take(remainingLimit);
        for (const rec of receiptsBatch) {
          if (rec.imageStorageId) {
            try {
              await ctx.storage.delete(rec.imageStorageId);
            } catch {
              // Non-fatal if storage file already removed
            }
          }
          await ctx.db.delete(rec._id);
        }
        deleted += receiptsBatch.length;
        if (receiptsBatch.length === remainingLimit) {
          hasMore = true;
        }
      }
    }

    // 3. merchantAliases (if capacity in this chunk)
    if (!hasMore && !(await hasWriteBudget(ctx))) {
      hasMore = true;
    }
    if (!hasMore) {
      const remainingLimit = DELETE_CHUNK_SIZE - deleted;
      if (remainingLimit > 0) {
        const aliasBatch = await ctx.db
          .query("merchantAliases")
          .withIndex("by_user_and_normalised", (q) => q.eq("userId", args.userId))
          .take(remainingLimit);
        for (const alias of aliasBatch) {
          await ctx.db.delete(alias._id);
        }
        deleted += aliasBatch.length;
        if (aliasBatch.length === remainingLimit) {
          hasMore = true;
        }
      }
    }

    // Check if any rows remain across any of the three tables
    if (!hasMore) {
      const snapRemaining = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(1);
      const recRemaining = await ctx.db
        .query("receipts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(1);
      const aliasRemaining = await ctx.db
        .query("merchantAliases")
        .withIndex("by_user_and_normalised", (q) => q.eq("userId", args.userId))
        .take(1);
      if (snapRemaining.length > 0 || recRemaining.length > 0 || aliasRemaining.length > 0) {
        hasMore = true;
      }
    }

    if (hasMore) {
      await ctx.scheduler.runAfter(
        0,
        internal.snapshots.deleteSnapshotsChunk,
        { userId: args.userId },
      );
    }
    return { deleted, done: !hasMore };
  },
});