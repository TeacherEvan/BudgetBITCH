import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { GEMINI_MODEL, geminiGenerateUrl } from "../lib/gemini";
import {
  normalizeCategory,
  validateAmount,
  validateDate,
  validateMerchant,
} from "./constants";

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
