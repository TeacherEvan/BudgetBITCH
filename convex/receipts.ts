import { action, mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

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