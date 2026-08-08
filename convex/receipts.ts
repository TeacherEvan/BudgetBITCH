import { action, mutation, query, internalMutation, internalQuery, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { v, ConvexError } from "convex/values";
import { z } from "zod";
import { getAuthUserId } from "@convex-dev/auth/server";
import { GEMINI_MODEL, geminiGenerateUrl } from "./lib/gemini";
import { scrape as scrapeEngine } from "./lib/receipt/engine";
import { ingestRequestBodySchema } from "./lib/receipt/ingestSchema";
import { applyAnswers, generateQuestions } from "./lib/receipt/questions";
import type { OcrPayload } from "./lib/receipt/types";

const VALID_CATEGORIES = [
  "food", "transport", "utilities", "entertainment",
  "housing", "phone_internet", "subscriptions", "healthcare",
  "insurance", "debt", "savings", "other"
] as const;

export function normalizeCategory(category: string): string {
  const normalized = category.toLowerCase().trim();
  return VALID_CATEGORIES.includes(normalized as typeof VALID_CATEGORIES[number])
    ? normalized
    : "other";
}

export function validateAmount(amount: unknown): number {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount || "0"));
  if (!Number.isFinite(num) || num < 0) return 0;
  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

export function validateDate(date: unknown): string | null {
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

export function validateMerchant(merchant: unknown): string {
  const str = String(merchant || "Unknown Merchant").trim();
  return str.length > 0 ? str.slice(0, 200) : "Unknown Merchant";
}

/**
 * Proxy a receipt image to the TeacherBOY HuggingFace bot for Gemini scraping.
 *
 * The app camera flow calls this instead of hitting the bot directly, so
 * CONVEX_SYNC_SECRET never ships in the client bundle. The user is derived
 * server-side from the Convex Auth session — never from a client argument.
 *
 * The bot runs Gemini vision, converts the text to an OcrPayload, and POSTs
 * it back to this deployment's /receipts/ingest with lineUserId="app:<userId>"
 * and source="app-camera". The draft is then visible to the app.
 */
export const proxyReceiptScan = action({
  args: {
    base64Image: v.string(),
    countryHint: v.optional(v.string()),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    draftId: string;
    fields?: Record<string, { value?: unknown } | null>;
    confidence?: Record<string, number>;
    evidence?: Record<string, unknown>;
    questions?: unknown[];
    lineItems?: Array<{ description?: string; amount?: number; qty?: number; unit_price?: number }>;
    source?: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required to scan receipts");
    }

    const botUrl = process.env.BUDGETBOSS_BOT_URL;
    const syncSecret = process.env.CONVEX_SYNC_SECRET;
    if (!botUrl || !syncSecret) {
      throw new ConvexError("Receipt bot is not configured");
    }

    // Upload the image to Convex storage for audit trail
    let imageStorageId: Id<"_storage"> | undefined;
    try {
      const match = args.base64Image.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = "image/jpeg";
      let data = args.base64Image;
      if (match) {
        mimeType = match[1];
        data = match[2];
      }
      const buffer = Buffer.from(data, "base64");
      imageStorageId = await ctx.storage.store(new Blob([buffer], { type: mimeType }));
    } catch (storageError) {
      console.warn("Failed to store receipt image in Convex storage:", storageError);
      // Continue without storage ID - receipt still created
    }

    const res = await fetch(`${botUrl.replace(/\/$/, "")}/receipt/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${syncSecret}`,
      },
      body: JSON.stringify({
        base64Image: args.base64Image,
        userId,
        idempotencyKey: args.idempotencyKey,
        countryHint: args.countryHint,
      }),
    });

    if (!res.ok) {
      const status = res.status;
      throw new ConvexError(`Receipt bot scan failed (${status})`);
    }

    const data = (await res.json()) as { 
      success?: boolean; 
      draftId?: string;
      fields?: Record<string, { value?: unknown } | null>;
      confidence?: Record<string, number>;
      evidence?: Record<string, unknown>;
      questions?: unknown[];
      lineItems?: Array<{ description?: string; amount?: number; qty?: number; unit_price?: number }>;
      source?: string;
    };
    return {
      success: data.success ?? true,
      draftId: data.draftId ?? "",
      fields: data.fields,
      confidence: data.confidence,
      evidence: data.evidence,
      questions: data.questions,
      lineItems: data.lineItems,
      source: data.source,
    };
  },
});

export const parseReceipt = action({
  args: {
    base64Image: v.string(), // Base64 encoded receipt image
    accountId: v.optional(v.string()), // Optional: which account/board this belongs to
  },
  handler: async (ctx, args): Promise<{ receiptId: string; amount: number; merchant: string; category: string; date: string | null; lineItems?: Array<{ description: string; amount: number }> }> => {
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

    // Upload the image to Convex storage for audit trail
    let imageStorageId: Id<"_storage"> | undefined;
    try {
      const buffer = Buffer.from(data, "base64");
      imageStorageId = await ctx.storage.store(new Blob([buffer], { type: mimeType }));
    } catch (storageError) {
      console.warn("Failed to store receipt image in Convex storage:", storageError);
      // Continue without storage ID - receipt still created
    }

    const prompt = `Analyze the receipt in the image. You must extract:
1. Total amount spent (as a number, do not include currency symbols).
2. Merchant/Store name.
3. A suggested category (one of: food, transport, utilities, entertainment, housing, phone_internet, subscriptions, healthcare, insurance, debt, savings, other).
4. Date (formatted as YYYY-MM-DD or null if not clear).
5. An array of line items. Each line item has a "description" (the item name as printed on the receipt) and an "amount" (the line total as a number). If the receipt is too blurry to read individual items, return an empty array.

Return a JSON object matching this schema exactly:
{
  "amount": number,
  "merchant": string,
  "category": string,
  "date": string | null,
  "lineItems": Array<{ "description": string, "amount": number }>
}
Do not include any formatting, markdown wrappers, or extra text. Output ONLY the raw JSON string.`;

    try {
      const response = await fetch(
        geminiGenerateUrl(apiKey),
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

      // Extract and validate line items (Gemini may return them)
      const rawLineItems = Array.isArray(parsed.lineItems) ? parsed.lineItems : [];
      const lineItems = rawLineItems
        .map((li: { description?: unknown; amount?: unknown }) => ({
          description: String(li.description ?? '').trim(),
          amount: validateAmount(li.amount),
        }))
        .filter((li: { description: string; amount: number }) => li.description.length > 0 && li.amount > 0);

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
        imageStorageId,
        parsedAt,
        geminiModel: GEMINI_MODEL,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
      });

      return {
        receiptId,
        amount,
        merchant,
        category,
        date: date ?? null,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
      };
    } catch (error) {
      console.error("Error in parseReceipt action:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new ConvexError(`Failed to parse receipt: ${message}`);
    }
  },
});

/**
 * Parses financial SMS or Email notification text using Gemini 2.5 Flash AI.
 * Extracts amount, merchant, category, date, and transaction type.
 */
export const parseMessage = action({
  args: {
    messageText: v.string(),
  },
  handler: async (ctx, args): Promise<{ amount: number; merchant: string; category: string; date: string | null; type: "expense" | "income" }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required to parse messages");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ConvexError(
        "Gemini API key is not configured in the backend environment. Please set GEMINI_API_KEY in your Convex dashboard."
      );
    }

    const prompt = `Analyze the financial notification email or SMS message text below:
"${args.messageText}"

Extract:
1. Total amount spent or received (as a positive number, do not include currency symbols).
2. Merchant/Store/Payee name (e.g. Amazon, Uber, Walmart, Salary, Chase, Starbucks).
3. A suggested category (food, transport, utilities, entertainment, housing, phone_internet, subscriptions, healthcare, insurance, debt, savings, other).
4. Date (formatted as YYYY-MM-DD or null if not clear).
5. Transaction type ("expense" or "income").

Return a JSON object matching this schema exactly:
{
  "amount": number,
  "merchant": string,
  "category": string,
  "date": string | null,
  "type": "expense" | "income"
}
Do not include any formatting, markdown wrappers, or extra text. Output ONLY the raw JSON string.`;

    try {
      const response = await fetch(
        geminiGenerateUrl(apiKey),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
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

      const amount = validateAmount(parsed.amount);
      const merchant = validateMerchant(parsed.merchant);
      const category = normalizeCategory(parsed.category);
      const date = validateDate(parsed.date);
      const type = parsed.type === "income" ? "income" : "expense";

      return {
        amount,
        merchant,
        category,
        date: date ?? null,
        type,
      };
    } catch (error) {
      console.error("Error in parseMessage action:", error);
      const message = error instanceof Error ? error.message : String(error);
      throw new ConvexError(`Failed to parse message: ${message}`);
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
    imageStorageId: v.optional(v.id("_storage")), // Convex storage ID for the original receipt photo
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

// Internal mutation to update receipt fields (called from ingestReceipt to preserve imageStorageId)
export const updateReceiptFields = internalMutation({
  args: {
    draftId: v.id("receipts"),
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
// The app flow sends "app:<userId>" instead of a LINE user ID, so there is
// no lineUsers mapping to resolve — we validate the user directly.
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
        filtered = filtered.filter(r => r.parsedAt < cursorTime);
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

// Budget Boss: HTTP action for TeacherBOY receipt ingestion
// Authenticated via Bearer token (CONVEX_SYNC_SECRET), not user session.
export const ingestReceipt = httpAction(async (ctx, req) => {
  // Verify Bearer token
  const authHeader = req.headers.get("Authorization") ?? "";
  const expectedToken = process.env.CONVEX_SYNC_SECRET ?? "";
  
  if (!expectedToken || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const providedToken = authHeader.slice(7);
  // Constant-time comparison
  if (providedToken.length !== expectedToken.length) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  let mismatch = 0;
  for (let i = 0; i < providedToken.length; i++) {
    if (providedToken.charCodeAt(i) !== expectedToken.charCodeAt(i)) mismatch++;
  }
  if (mismatch > 0) {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse + validate body (zod-hardened; see ingestSchema.ts)
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = ingestRequestBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid request body",
        details: parsed.error.issues.map((i: z.ZodIssue) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const { lineUserId, payload, idempotencyKey, source: requestSource } = parsed.data;

  // Resolve user: "app:<userId>" bypasses LINE mapping (app camera flow);
  // everything else uses the existing LINE path.
  let userId: Id<"users">;
  let accountId: string | undefined;

  if (lineUserId.startsWith("app:")) {
    const rawUserId = lineUserId.slice(4) as Id<"users">;
    const user = await ctx.runQuery(internal.receipts.getUserForIngest, { userId: rawUserId });
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    userId = rawUserId;
    accountId = undefined;
  } else {
    // Existing LINE flow.
    const mapping = await ctx.runQuery(internal.line.getLineMapping, { lineUserId });
    if (!mapping) {
      return new Response(JSON.stringify({ success: false, error: "User not linked to Budget Boss" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    userId = mapping.userId;
    accountId = mapping.accountId ?? undefined;
  }

  const resolvedSource = requestSource ?? "line";

  // Run the scraper engine (validated payload is structurally an OcrPayload)
  const scraped = scrapeEngine(payload as OcrPayload);

  // Extract fields
  const amount = typeof scraped.fields.total?.value === "number" ? scraped.fields.total.value : 0;
  const merchant = typeof scraped.fields.merchant?.value === "string" ? scraped.fields.merchant.value : "Unknown Merchant";
  const category = typeof scraped.fields.category?.value === "string" ? scraped.fields.category.value : "other";
  const date = typeof scraped.fields.date?.value === "string" ? scraped.fields.date.value : undefined;
  const currency = typeof scraped.fields.currency?.value === "string" ? scraped.fields.currency.value : undefined;
  const tax = typeof scraped.fields.tax?.value === "number" ? scraped.fields.tax.value : undefined;
  const lineItems = scraped.lineItems;

  // Check idempotency - look for existing draft with this clientDraftId
  const existing = await ctx.runQuery(internal.receipts.getReceiptByClientDraftId, { clientDraftId: idempotencyKey });

  if (existing) {
    // Update existing draft with scraped data (preserve imageStorageId from proxyReceiptScan)
    await ctx.runMutation(internal.receipts.updateReceiptFields, {
      draftId: existing._id,
      amount,
      merchant,
      category,
      date,
      geminiModel: "gemini-2.5-flash",
      confidence: scraped.confidence,
      evidence: scraped.evidence,
      ocrText: payload.lines?.map((l: any) => l.text).join("\n"),
      tax,
      currency,
      questionsAsked: scraped.questions,
      status: "draft",
      source: resolvedSource,
      lineItems,
    });
    return new Response(JSON.stringify({
      success: true,
      draftId: existing._id,
      alreadySynced: true,
      fields: scraped.fields,
      confidence: scraped.confidence,
      evidence: scraped.evidence,
      questions: scraped.questions,
      lineItems,
      source: resolvedSource,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Insert draft receipt via internal mutation
  const draftId = await ctx.runMutation(internal.receipts.saveReceipt, {
    userId,
    accountId,
    amount,
    merchant,
    category,
    date,
    parsedAt: Date.now(),
    geminiModel: "gemini-2.5-flash",
    imageMimeType: "application/json",
    imageSizeBytes: 0,
    clientDraftId: idempotencyKey,
    engine: "scraper-bot",
    confidence: scraped.confidence,
    evidence: scraped.evidence,
    ocrText: payload.lines?.map((l: any) => l.text).join("\n"),
    tax,
    currency,
    questionsAsked: scraped.questions,
    status: "draft",
    source: resolvedSource,
    lineItems,
  });

  return new Response(JSON.stringify({
    success: true,
    draftId,
    fields: scraped.fields,
    confidence: scraped.confidence,
    evidence: scraped.evidence,
    questions: scraped.questions,
    lineItems,
    source: resolvedSource,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});