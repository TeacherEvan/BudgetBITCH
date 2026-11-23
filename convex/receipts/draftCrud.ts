import { mutation, query, internalMutation, internalQuery, type MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { v, ConvexError, type Infer } from "convex/values";
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

// Shared insert validator for the idempotent-save variants.
const receiptInsertValidator = v.object({
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
});

type ReceiptInsertArgs = Infer<typeof receiptInsertValidator>;

// P1-C9: insert-then-read claim returning BOTH the winning id and whether this
// call created it, atomically inside one mutation (no second query that can
// race or report a stale `draft._id !== draftId` comparison).
async function saveIdempotentImpl(
  ctx: MutationCtx,
  args: ReceiptInsertArgs,
): Promise<{ draftId: Doc<"receipts">["_id"]; alreadySynced: boolean }> {
  const clientDraftId = args.clientDraftId;
  if (!clientDraftId) {
    const draftId = await ctx.db.insert("receipts", args);
    return { draftId, alreadySynced: false };
  }

  const insertedId = await ctx.db.insert("receipts", args);
  const firstDraft = await ctx.db
    .query("receipts")
    .withIndex("by_user_and_clientDraftId", (q) =>
      q.eq("userId", args.userId).eq("clientDraftId", clientDraftId),
    )
    .order("asc")
    .first();

  if (!firstDraft || firstDraft._id === insertedId) {
    return { draftId: insertedId, alreadySynced: false };
  }

  // Lost the race: remove our insert and report the existing winner.
  await ctx.db.delete(insertedId);
  return { draftId: firstDraft._id, alreadySynced: true };
}

export const saveReceiptIdempotentWithStatus = internalMutation({
  args: receiptInsertValidator.fields,
  handler: async (ctx, args) => saveIdempotentImpl(ctx, args),
});

// Legacy Id-only variant retained for the W3-owned `convex/line.ts` caller,
// which still expects a bare Id. New callers (receipt ingest) must use
// `saveReceiptIdempotentWithStatus` so `alreadySynced` is reported correctly.
export const saveReceiptIdempotent = internalMutation({
  args: receiptInsertValidator.fields,
  handler: async (ctx, args) => (await saveIdempotentImpl(ctx, args)).draftId,
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
    if (!userId) return { receipts: [], nextCursor: null, scanned: 0, truncated: false };

    const limit = Math.min(args.limit || 20, 50);

    // The external cursor is a parsedAt timestamp (ms). The `by_user_parsedAt`
    // index encodes it in the index key, so a single bounded scan can seek
    // directly past the previous page instead of re-reading the index head.
    let externalCursorTime: number | undefined;
    if (args.cursor) {
      const parsed = Number(args.cursor);
      if (Number.isFinite(parsed)) externalCursorTime = parsed;
    }

    const MAX_SCAN = 1000;
    const page = await ctx.db
      .query("receipts")
      .withIndex("by_user_parsedAt", (q) => {
        const scoped = q.eq("userId", userId);
        return externalCursorTime === undefined
          ? scoped
          : scoped.lt("parsedAt", externalCursorTime);
      })
      .order("desc")
      .take(MAX_SCAN);

    const results: Doc<"receipts">[] = [];
    const seenIds = new Set<string>();
    let scanned = 0;
    let matchedBeyondLimit = false;

    for (const receipt of page) {
      // P1-C1: dedupe by document id. `_creationTime` is NOT unique and using
      // it as the dedupe key silently dropped receipts parsed in the same ms.
      if (seenIds.has(receipt._id)) continue;
      seenIds.add(receipt._id);
      scanned++;

      if (args.accountId !== undefined && receipt.accountId !== args.accountId) continue;
      // Legacy rows without a `source` are app receipts.
      if (args.source !== undefined && (receipt.source ?? "app") !== args.source) continue;
      if (args.status !== undefined && (receipt.status ?? "draft") !== args.status) continue;

      if (results.length < limit) {
        results.push(receipt);
      } else {
        matchedBeyondLimit = true;
      }
    }

    const truncated = scanned >= MAX_SCAN;
    let nextCursor: string | null = null;
    if (matchedBeyondLimit && !truncated && results.length === limit) {
      nextCursor = String(results[results.length - 1].parsedAt);
    }

    return { receipts: results, nextCursor, scanned, ...(truncated ? { truncated } : {}) };
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