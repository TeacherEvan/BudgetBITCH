import { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { scrape as scrapeEngine } from "../lib/receipt/engine";
import { applyAnswers, generateQuestions } from "../lib/receipt/questions";
import type { OcrPayload } from "../lib/receipt/types";

// Scraper Bot: Scrape receipt from OCR payload
export const scrape = mutation({
  args: {
    payload: v.any(),
    accountId: v.optional(v.string()),
    clientDraftId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    const payload = args.payload as OcrPayload;
    const result = scrapeEngine(payload);

    const amount = typeof result.fields.total?.value === "number" ? result.fields.total.value : 0;
    const merchant = typeof result.fields.merchant?.value === "string" ? result.fields.merchant.value : "Unknown Merchant";
    const category = typeof result.fields.category?.value === "string" ? result.fields.category.value : "other";
    const date = typeof result.fields.date?.value === "string" ? result.fields.date.value : undefined;

    const draftId = await ctx.db.insert("receipts", {
      userId,
      accountId: args.accountId,
      amount,
      merchant,
      category,
      date,
      parsedAt: Date.now(),
      geminiModel: "scraper-bot",
      imageMimeType: "application/json",
      imageSizeBytes: 0,
      clientDraftId: args.clientDraftId,
      engine: "scraper-bot",
      confidence: result.confidence,
      evidence: result.evidence,
      ocrText: payload.lines?.map((l: any) => l.text).join("\n"),
      tax: typeof result.fields.tax?.value === "number" ? result.fields.tax.value : undefined,
      currency: typeof result.fields.currency?.value === "string" ? result.fields.currency.value : undefined,
      questionsAsked: result.questions,
      status: "draft",
    });

    return {
      draftId,
      fields: result.fields,
      confidence: result.confidence,
      evidence: result.evidence,
      questions: result.questions,
    };
  },
});

// Scraper Bot: Answer verification questions
export const answer = mutation({
  args: {
    draftId: v.id("receipts"),
    answers: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.userId !== userId) {
      throw new ConvexError("Draft not found or access denied");
    }

    const currentFields = (draft as any).fields ?? {};
    const currentConfidence = (draft.confidence as any) ?? {};

    const folded = applyAnswers(currentFields, currentConfidence, args.answers);
    const questions = generateQuestions(folded.updatedFields, folded.updatedConfidence);

    const amount = typeof folded.updatedFields.total?.value === "number" ? folded.updatedFields.total.value : draft.amount;
    const merchant = typeof folded.updatedFields.merchant?.value === "string" ? folded.updatedFields.merchant.value : draft.merchant;
    const category = typeof folded.updatedFields.category?.value === "string" ? folded.updatedFields.category.value : draft.category;
    const date = typeof folded.updatedFields.date?.value === "string" ? folded.updatedFields.date.value : draft.date;

    await ctx.db.patch(args.draftId, {
      amount,
      merchant,
      category,
      date,
      confidence: folded.updatedConfidence,
      questionsAsked: questions,
    });

    return {
      fields: folded.updatedFields,
      confidence: folded.updatedConfidence,
      questions,
    };
  },
});

// Scraper Bot: Confirm draft receipt & learn merchant aliases
export const confirm = mutation({
  args: {
    draftId: v.id("receipts"),
    overrides: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.userId !== userId) {
      throw new ConvexError("Draft not found or access denied");
    }

    await ctx.db.patch(args.draftId, {
      status: "confirmed",
      corrections: args.overrides,
    });

    const merchantName = args.overrides?.merchant || draft.merchant;
    const normalised = merchantName.toLowerCase().trim();

    const existingAlias = await ctx.db
      .query("merchantAliases")
      .withIndex("by_user_and_normalised", (q) => q.eq("userId", userId).eq("normalised", normalised))
      .first();

    if (existingAlias) {
      await ctx.db.patch(existingAlias._id, {
        hits: existingAlias.hits + 1,
        category: args.overrides?.category || draft.category,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("merchantAliases", {
        userId,
        normalised,
        displayName: merchantName,
        category: args.overrides?.category || draft.category,
        hits: 1,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Scraper Bot: Sync offline draft (idempotent by clientDraftId)
export const syncOfflineDraft = mutation({
  args: {
    clientDraftId: v.string(),
    payload: v.any(),
    answers: v.optional(v.any()),
    confirmed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const existing = await ctx.db
      .query("receipts")
      .withIndex("by_clientDraftId", (q) => q.eq("clientDraftId", args.clientDraftId))
      .first();

    if (existing) {
      return { receiptId: existing._id, alreadySynced: true };
    }

    const payload = args.payload as OcrPayload;
    const result = scrapeEngine(payload);

    let fields = result.fields;
    let confidence = result.confidence;

    if (args.answers) {
      const folded = applyAnswers(fields, confidence, args.answers);
      fields = folded.updatedFields;
      confidence = folded.updatedConfidence;
    }

    const amount = typeof fields.total?.value === "number" ? fields.total.value : 0;
    const merchant = typeof fields.merchant?.value === "string" ? fields.merchant.value : "Unknown Merchant";
    const category = typeof fields.category?.value === "string" ? fields.category.value : "other";
    const date = typeof fields.date?.value === "string" ? fields.date.value : undefined;

    const receiptId = await ctx.db.insert("receipts", {
      userId,
      amount,
      merchant,
      category,
      date,
      parsedAt: Date.now(),
      geminiModel: "scraper-bot",
      imageMimeType: "application/json",
      imageSizeBytes: 0,
      clientDraftId: args.clientDraftId,
      engine: "scraper-bot",
      confidence,
      status: args.confirmed ? "confirmed" : "draft",
    });

    return { receiptId, alreadySynced: false };
  },
});

// Scraper Bot: Template & alias snapshot for offline caching
export const templateSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    const templates = await ctx.db
      .query("receiptTemplates")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();

    let aliases: Doc<"merchantAliases">[] = [];
    if (userId) {
      aliases = await ctx.db
        .query("merchantAliases")
        .withIndex("by_user_and_normalised", (q) => q.eq("userId", userId))
        .collect();
    }

    return { templates, aliases };
  },
});
