import { mutation, query, internalMutation, internalQuery } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Internal mutation to save receipt (called from action)
export const saveReceipt = internalMutation({
  args: {
    userId: v.id("users"),
    accountId: v.optional(v.string()),
    amount: v.number(),
    merchant: v.string(),
    category: v.string(),
    date: v.optional(v.string()),
    rawGeminiResponse: v.optional(v.string()),
    imageMimeType: v.string(),
    imageSizeBytes: v.number(),
    parsedAt: v.number(),
    geminiModel: v.string(),
    source: v.optional(v.string()), // "app" (default) | "line"
    clientDraftId: v.optional(v.string()),
    engine: v.optional(v.string()),
    confidence: v.optional(v.any()),
    evidence: v.optional(v.any()),
    ocrText: v.optional(v.string()),
    tax: v.optional(v.number()),
    currency: v.optional(v.string()),
    questionsAsked: v.optional(v.any()),
    status: v.optional(v.string()),
    lineItems: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("receipts", args);
  },
});

// Internal query: get receipt by clientDraftId (for idempotency)
export const getReceiptByClientDraftId = internalQuery({
  args: { clientDraftId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("receipts")
      .withIndex("by_clientDraftId", (q) => q.eq("clientDraftId", args.clientDraftId))
      .first();
  },
});

// Internal query: verify a Convex user exists (app camera ingest path).
// The app flow sends "app:<userId>" instead of a LINE user ID, so there
// is no lineUsers mapping to resolve — we validate the user directly.
export const getUserForIngest = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user ? { _id: user._id } : null;
  },
});

// Query: List receipts for user (paginated, newest first)
export const listReceipts = query({
  args: {
    accountId: v.optional(v.string()),
    cursor: v.optional(v.string()), // ISO timestamp string for parsedAt
    limit: v.optional(v.number()), // Max 50
    source: v.optional(v.string()), // Optional filter: "app" | "line"
    status: v.optional(v.string()), // Optional filter: "draft" | "confirmed"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { receipts: [], nextCursor: null };

    const limit = Math.min(args.limit || 20, 50);

    // When no accountId is supplied, list across all the user's receipts
    // (bot-ingested drafts often have no accountId). Use the by_user index;
    // otherwise scope to the specific account via by_user_and_account.
    let queryBuilder;
    if (args.accountId) {
      queryBuilder = ctx.db
        .query("receipts")
        .withIndex("by_user_and_account", (q) =>
          q.eq("userId", userId).eq("accountId", args.accountId as string)
        );
    } else {
      queryBuilder = ctx.db
        .query("receipts")
        .withIndex("by_user", (q) => q.eq("userId", userId));
    }
    queryBuilder = queryBuilder.order("desc");

    // Fetch one extra to check if there are more
    const receipts = await queryBuilder.take(limit + 1);

    // Apply optional server-side filters (source / status)
    let filtered = receipts;
    if (args.source !== undefined) {
      filtered = filtered.filter((r) => (r.source ?? "app") === args.source);
    }
    if (args.status !== undefined) {
      filtered = filtered.filter((r) => (r.status ?? "draft") === args.status);
    }

    // Filter by cursor if provided
    if (args.cursor) {
      const cursorTime = parseInt(args.cursor);
      if (!isNaN(cursorTime)) {
        filtered = filtered.filter((r) => r.parsedAt < cursorTime);
      }
    }

    // Check if there are more results
    let nextCursor: string | null = null;
    if (filtered.length > limit) {
      filtered = filtered.slice(0, limit);
      const last = filtered[filtered.length - 1];
      nextCursor = String(last.parsedAt);
    }

    return { receipts: filtered, nextCursor };
  },
});

// Query: Get single receipt by ID (with auth check)
export const getReceipt = query({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.userId !== userId) {
      return null;
    }
    return receipt;
  },
});

// Mutation: Delete receipt (with auth check)
export const deleteReceipt = mutation({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.userId !== userId) {
      throw new ConvexError("Receipt not found or access denied");
    }

    await ctx.db.delete(args.receiptId);
    return { success: true };
  },
});
