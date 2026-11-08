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

// Internal query: get receipt by clientDraftId for a specific user (for tenant-safe idempotency)
export const getReceiptByClientDraftId = internalQuery({
  args: { userId: v.id("users"), clientDraftId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("receipts")
      .withIndex("by_user_and_clientDraftId", (q) =>
        q.eq("userId", args.userId).eq("clientDraftId", args.clientDraftId)
      )
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

// Query: List receipts for user (paginated, newest first) - index-safe windowed pagination
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
    if (!userId) return { receipts: [], nextCursor: null, truncated: false };

    const limit = Math.min(args.limit || 20, 50);

    // Helper to build the base query
    const buildBaseQuery = () => {
      if (args.accountId) {
        return ctx.db
          .query("receipts")
          .withIndex("by_user_and_account", (q) =>
            q.eq("userId", userId).eq("accountId", args.accountId as string)
          );
      } else {
        return ctx.db
          .query("receipts")
          .withIndex("by_user", (q) => q.eq("userId", userId));
      }
    };

    // Parse the external cursor (based on parsedAt)
    let externalCursorTime: number | undefined;
    if (args.cursor) {
      const parsed = parseInt(args.cursor);
      if (!isNaN(parsed)) {
        externalCursorTime = parsed;
      }
    }

    // Index-safe windowed pagination:
    // - Use growing take() windows: take(min(scanned + pageSize, maxScan))
    // - Track seen _creationTime in a JS Set to avoid duplicates
    // - Apply source/status/parsedAt filters in JS (no .filter() on query)
    // - Stop when we have enough results OR hit maxScan
    // - If maxScan hit and more results exist, return truncated=true
    const pageSize = 50;
    const maxTotalScan = 1000;
    const results: any[] = [];
    const seenCreationTimes = new Set<number>();
    let totalScanned = 0;
    let truncated = false;

    let iteration = 0;
    while (results.length < limit && totalScanned < maxTotalScan) {
      iteration++;
      // Growing take window: take(scanned + pageSize) but capped at maxTotalScan
      const takeCount = Math.min(totalScanned + pageSize, maxTotalScan);
      const pageQuery = buildBaseQuery().order("desc");
      const page = await pageQuery.take(takeCount);
      
      if (page.length === 0) {
        break; // No more results
      }

      // Apply filters in-memory (JS-side predicates only)
      let newUniqueItems = 0;
      let newResults = 0;
      for (const receipt of page) {
        // Skip duplicates (same _creationTime)
        if (seenCreationTimes.has(receipt._creationTime)) {
          continue;
        }
        seenCreationTimes.add(receipt._creationTime);
        newUniqueItems++;
        totalScanned++;

        // External cursor filter (parsedAt)
        if (externalCursorTime !== undefined && receipt.parsedAt >= externalCursorTime) {
          continue;
        }
        // Source filter
        if (args.source !== undefined && (receipt.source ?? "app") !== args.source) {
          continue;
        }
        // Status filter
        if (args.status !== undefined && (receipt.status ?? "draft") !== args.status) {
          continue;
        }

        results.push(receipt);
        newResults++;
        if (results.length >= limit) {
          break;
        }
      }

      // If we got no new unique items (all items in page were already seen), we've reached the end
      if (newUniqueItems === 0) {
        break;
      }
      
      // If we scanned the full takeCount and it equals maxTotalScan, we hit the limit
      if (takeCount >= maxTotalScan) {
        break;
      }
    }

    // Check for truncation: if we hit maxScan and there might be more results
    if (totalScanned >= maxTotalScan && results.length === limit) {
      truncated = true;
    }

    // Determine nextCursor (external cursor based on parsedAt)
    let nextCursor: string | null = null;
    if (results.length === limit && !truncated) {
      const lastMatched = results[results.length - 1];
      // Check if there are more matching results beyond the last one we returned
      const checkTake = Math.min(pageSize, maxTotalScan - totalScanned);
      if (checkTake > 0) {
        const checkQuery = buildBaseQuery().order("desc");
        const checkPage = await checkQuery.take(checkTake);
        let hasMore = false;
        for (const receipt of checkPage) {
          if (seenCreationTimes.has(receipt._creationTime)) {
            continue;
          }
          const matchesSource = args.source === undefined || (receipt.source ?? "app") === args.source;
          const matchesStatus = args.status === undefined || (receipt.status ?? "draft") === args.status;
          const matchesCursor = externalCursorTime === undefined || receipt.parsedAt < externalCursorTime;
          if (matchesSource && matchesStatus && matchesCursor) {
            hasMore = true;
            break;
          }
        }
        if (hasMore) {
          nextCursor = String(lastMatched.parsedAt);
        }
      }
    }

    return { receipts: results, nextCursor, ...(truncated ? { truncated } : {}) };
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

    if (receipt.imageStorageId) {
      try {
        await ctx.storage.delete(receipt.imageStorageId);
      } catch (err) {
        console.warn("Failed to delete receipt image storage:", err);
      }
    }

    await ctx.db.delete(args.receiptId);
    return { success: true };
  },
});