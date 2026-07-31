import { action, mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { scrape as scrapeEngine } from "./lib/receipt/engine";
import { applyAnswers, generateQuestions } from "./lib/receipt/questions";
import type { OcrPayload } from "./lib/receipt/types";

const VALID_CATEGORIES = [
  "food", "transport", "shopping", "utilities", "entertainment",
  "medical", "housing", "personal", "education", "income", "other"
] as const;

function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().trim();
  return VALID_CATEGORIES.includes(normalized as typeof VALID_CATEGORIES[number])
    ? normalized
    : "other";
}

function validateAmount(amount: unknown): number {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || "0"));
  if (!Number.isFinite(num) || num < 0) return 0;
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

function validateDate(date: unknown): string | null {
  if (!date || typeof date !== "string") return null;
  // Validate YYYY-MM-DD format
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  // Don't accept future dates > 1 day from now (allow for timezone)
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d > tomorrow) return null;
  return date;
}

function validateMerchant(merchant: unknown): string {
  const str = String(merchant || "Unknown Merchant").trim();
  return str.length > 0 ? str.slice(0, 200) : "Unknown Merchant";
}

export const parseReceipt = action({
  args: {
    base64Image: v.string(), // Base64 encoded receipt image
    accountId: v.optional(v.string()), // Optional: which account/board this belongs to
  },
  handler: async (ctx, args): Promise<{ receiptId: string; amount: number; merchant: string; category: string; date: string | null }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required to parse receipts");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ConvexError(
        "Gemini API key is not configured in the backend environment. Please set GEMINI_API_KEY in your Convex dashboard."
      );
    }

    // Parse out MIME type if it's a data URL
    const match = args.base64Image.match(/^data:([^;]+);base64,(.+)$/);
    let mimeType = "image/jpeg";
    let data = args.base64Image;
    if (match) {
      mimeType = match[1];
      data = match[2];
    }

    // Calculate image size in bytes (approximate from base64)
    const imageSizeBytes = Math.floor(data.length * 0.75);

    const prompt = `Analyze the receipt in the image. You must extract:
1. Total amount spent (as a number, do not include currency symbols).
2. Merchant/Store name.
3. A suggested category (e.g. food, transport, shopping, utilities, entertainment, medical, housing, personal, education, income, other).
4. Date (formatted as YYYY-MM-DD or null if not clear).

Return a JSON object matching this schema exactly:
{
  "amount": number,
  "merchant": string,
  "category": string,
  "date": string | null
}
Do not include any formatting, markdown wrappers, or extra text. Output ONLY the raw JSON string.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API returned error status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No parsing response candidates returned from Gemini API");
      }

      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      }

      const parsed = JSON.parse(cleanText);

      // Validate and normalize
      const amount = validateAmount(parsed.amount);
      const merchant = validateMerchant(parsed.merchant);
      const category = normalizeCategory(parsed.category);
      const date = validateDate(parsed.date);
      const parsedAt = Date.now();

      // Persist to Convex using internal mutation
      const receiptId = await ctx.runMutation(internal.receipts.saveReceipt, {
        userId,
        accountId: args.accountId,
        amount,
        merchant,
        category,
        date: date ?? undefined,
        rawGeminiResponse: cleanText,
        imageMimeType: mimeType,
        imageSizeBytes,
        parsedAt,
        geminiModel: "gemini-2.5-flash",
      });

      return {
        receiptId,
        amount,
        merchant,
        category,
        date: date ?? null,
      };
    } catch (error) {
      console.error("Error in parseReceipt action:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new ConvexError(`Failed to parse receipt: ${message}`);
    }
  },
});

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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("receipts", args);
  },
});

// Query: List receipts for user (paginated, newest first)
export const listReceipts = query({
  args: {
    accountId: v.optional(v.string()),
    cursor: v.optional(v.string()), // ISO timestamp string for parsedAt
    limit: v.optional(v.number()), // Max 50
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { receipts: [], nextCursor: null };

    const limit = Math.min(args.limit || 20, 50);
    
    // Query using the by_user_and_account index, ordered by parsedAt desc
    let queryBuilder = ctx.db
      .query("receipts")
      .withIndex("by_user_and_account", (q) => 
        q.eq("userId", userId).eq("accountId", args.accountId || "")
      )
      .order("desc");

    // Fetch one extra to check if there are more
    const receipts = await queryBuilder.take(limit + 1);

    // Filter by cursor if provided
    let filtered = receipts;
    if (args.cursor) {
      const cursorTime = parseInt(args.cursor);
      if (!isNaN(cursorTime)) {
        filtered = receipts.filter(r => r.parsedAt < cursorTime);
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