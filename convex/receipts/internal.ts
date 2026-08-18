// convex/receipts/internal.ts
// Internal-only mutations that have no external call site yet but are part of
// the receipts domain surface (referenced via internal.receipts.*). Kept in its
// own module so convex/receipts.ts can stay a thin barrel.
import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const updateReceiptFields = internalMutation({
  args: {
    draftId: v.id('receipts'),
    amount: v.number(),
    merchant: v.string(),
    category: v.string(),
    date: v.optional(v.string()),
    geminiModel: v.string(),
    confidence: v.optional(v.any()),
    evidence: v.optional(v.any()),
    ocrText: v.optional(v.string()),
    tax: v.optional(v.number()),
    currency: v.optional(v.string()),
    questionsAsked: v.optional(v.any()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    lineItems: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { draftId, ...fields } = args;
    await ctx.db.patch(draftId, fields);
    return { success: true };
  },
});
