import { httpAction, internalAction, internalQuery, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getAuthUserId } from "./lib/auth";
import { GEMINI_MODEL, geminiGenerateUrl } from "./lib/gemini";
import { verifyLineSignature } from "./lib/line/verify";
import { clog, clogError, clogMetric, genTraceId } from "./lib/log";
import {
  normalizeCategory,
  validateAmount,
  validateDate,
  validateMerchant,
} from "./receipts";

// Links a LINE user ID to the authenticated Convex user (and optional account).
// The userId is resolved server-side from auth — never taken from client args.
export const linkLineAccount = mutation({
  args: {
    lineUserId: v.string(),
    accountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userIdStr = await getAuthUserId(ctx);
    if (!userIdStr) {
      throw new ConvexError("Authentication required");
    }
    const userId = userIdStr as Id<"users">;

    const existing = await ctx.db
      .query("lineUsers")
      .withIndex("by_lineUserId", (q) => q.eq("lineUserId", args.lineUserId))
      .unique();

    // Upsert: patch the existing mapping if this LINE user was already linked.
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        accountId: args.accountId ?? existing.accountId,
        linkedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("lineUsers", {
      lineUserId: args.lineUserId,
      userId,
      accountId: args.accountId,
      linkedAt: Date.now(),
    });
  },
});

// Internal resolver: returns the Convex userId for a given LINE user id, or null.
// Used by the LINE receipt-bot webhook to resolve the upload owner.
export const getConvexUserByLineId = internalQuery({
  args: {
    lineUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("lineUsers")
      .withIndex("by_lineUserId", (q) => q.eq("lineUserId", args.lineUserId))
      .unique();
    return mapping ? mapping.userId : null;
  },
});

const LINE_RECEIPT_PROMPT = `Analyze the receipt in the image. You must extract:
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

/**
 * Internal action: parse a base64 receipt image via Gemini and persist it as a
 * receipt tagged source:"line". Mirrors the public `parseReceipt` action but
 * takes the owner `userId` as an argument (resolved earlier by the webhook from
 * the LINE→Convex mapping). Never called directly from a client.
 */
export const parseLineReceipt = internalAction({
  args: {
    userId: v.id("users"),
    base64Image: v.string(),
    accountId: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    receiptId: string;
    amount: number;
    merchant: string;
    category: string;
    date: string | null;
  }> => {
    const traceId = genTraceId();
    const started = Date.now();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clogError("line_receipt_parse_failed", new Error("GEMINI_API_KEY missing"), {
        traceId,
        source: "line",
        reason: "missing_api_key",
      });
      throw new ConvexError(
        "Gemini API key is not configured in the backend environment. Please set GEMINI_API_KEY in your Convex dashboard.",
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
    const imageSizeBytes = Math.floor(data.length * 0.75);

    try {
      const response = await fetch(
        geminiGenerateUrl(apiKey),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: LINE_RECEIPT_PROMPT },
                  { inlineData: { mimeType, data } },
                ],
              },
            ],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        clogError("line_receipt_parse_failed", new Error(`Gemini ${response.status}`), {
          traceId,
          source: "line",
          geminiStatus: String(response.status),
        });
        throw new Error(
          `Gemini API returned error status ${response.status}: ${errorText}`,
        );
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        clogError("line_receipt_parse_failed", new Error("no_candidates"), { traceId, source: "line" });
        throw new Error("No parsing response candidates returned from Gemini API");
      }

      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "")
          .trim();
      }

      const parsed = JSON.parse(cleanText);

      const amount = validateAmount(parsed.amount);
      const merchant = validateMerchant(parsed.merchant);
      const category = normalizeCategory(parsed.category);
      const date = validateDate(parsed.date);
      const parsedAt = Date.now();

      const receiptId = await ctx.runMutation(internal.receipts.saveReceipt, {
        userId: args.userId,
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
        source: "line",
      });

      clog("info", "line_receipt_parsed", {
        traceId,
        source: "line",
        receiptId,
        category,
        hasDate: date ? "true" : "false",
        amount,
        durationMs: Date.now() - started,
      });
      clogMetric("line_receipt_parse_ms", Date.now() - started, "ms", { source: "line" });
      clogMetric("line_receipt_parse_total", amount, "count", { source: "line" });

      return {
        receiptId,
        amount,
        merchant,
        category,
        date: date ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      clogError("line_receipt_parse_failed", error, {
        traceId,
        source: "line",
        durationMs: Date.now() - started,
      });
      throw new ConvexError(`Failed to parse LINE receipt: ${message}`);
    }
  },
});

/**
 * HTTP action: LINE Messaging API webhook receiver for the receipt bot.
 *
 * Verifies the HMAC-SHA256 `x-line-signature` header, then for every image
 * message event fetches the original image from LINE, resolves the owning
 * Convex user from the LINE→Convex mapping, and ingests it via
 * `parseLineReceipt`. Always responds 200 so LINE does not retry endlessly.
 */
export const lineWebhook = httpAction(async (ctx, req) => {
  const traceId = genTraceId();
  const secret = process.env.LINE_CHANNEL_SECRET ?? "";
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";

  const body = await req.text();

  // Always 200 on a missing/invalid signature so LINE stops retrying a bad push.
  const signature = req.headers.get("x-line-signature") ?? "";
  if (!secret || !(await verifyLineSignature(body, signature, secret))) {
    clog("warn", "line_webhook_rejected", { traceId, reason: "bad_signature" });
    clogMetric("line_webhook_events", 0, "count", { status_class: "unauthorized" });
    return new Response("ignored", { status: 200 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    clog("warn", "line_webhook_rejected", { traceId, reason: "bad_json" });
    return new Response("ignored", { status: 200 });
  }

  const events = (payload as { events?: unknown[] }).events;
  if (!Array.isArray(events)) {
    clogMetric("line_webhook_events", 0, "count", { status_class: "no_events" });
    return new Response("ok", { status: 200 });
  }

  clogMetric("line_webhook_events", events.length, "count", { status_class: "received" });
  let imageMessages = 0;
  let ingested = 0;
  let contentFetchFailed = 0;

  for (const event of events) {
    const e = event as {
      type?: string;
      message?: { type?: string; id?: string };
      source?: { userId?: string };
    };
    if (e.type !== "message" || e.message?.type !== "image" || !e.message.id) {
      continue;
    }
    imageMessages++;
    const lineUserId = e.source?.userId;
    if (!lineUserId) continue;

    const mapping = (await ctx.runQuery(internal.line.getLineMapping, {
      lineUserId,
    })) as { userId: Id<"users">; accountId: string | null } | null;
    if (!mapping) {
      clog("warn", "line_webhook_skipped", { traceId, lineUserId, reason: "no_mapping" });
      continue;
    }
    const userId = mapping.userId;

    // Fetch the original image bytes from LINE's content API.
    let base64Image: string | null = null;
    if (accessToken) {
      try {
        const contentRes = await fetch(
          `https://api-data.line.me/v2/bot/message/${e.message.id}/content`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        if (contentRes.ok) {
          const buf = Buffer.from(await contentRes.arrayBuffer());
          const mime = contentRes.headers.get("content-type") ?? "image/jpeg";
          base64Image = `data:${mime};base64,${buf.toString("base64")}`;
        } else {
          contentFetchFailed++;
          clog("warn", "line_content_fetch_failed", {
            traceId,
            lineUserId,
            status: String(contentRes.status),
          });
        }
      } catch (err) {
        contentFetchFailed++;
        clogError("line_content_fetch_failed", err, { traceId, lineUserId });
      }
    }

    if (!base64Image) continue;

    try {
      await ctx.runAction(internal.line.parseLineReceipt, {
        userId,
        base64Image,
        accountId: mapping.accountId ?? undefined,
      });
      ingested++;
    } catch (err) {
      clogError("line_webhook_ingest_failed", err, { traceId, lineUserId });
    }
  }

  clogMetric("line_webhook_image_messages", imageMessages, "count", { source: "line" });
  clogMetric("line_webhook_ingested", ingested, "count", { source: "line" });
  if (contentFetchFailed > 0) {
    clogMetric("line_webhook_content_fetch_failed", contentFetchFailed, "count", { source: "line" });
  }
  clog("info", "line_webhook_processed", {
    traceId,
    events: events.length,
    imageMessages,
    ingested,
    contentFetchFailed,
  });

  return new Response("ok", { status: 200 });
});

// Internal resolver: returns the Convex userId + optional accountId for a given
// LINE user id, or null when no mapping exists. Used by the webhook to resolve
// both the upload owner and the target account in a single index lookup.
export const getLineMapping = internalQuery({
  args: {
    lineUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const mapping = await ctx.db
      .query("lineUsers")
      .withIndex("by_lineUserId", (q) => q.eq("lineUserId", args.lineUserId))
      .unique();
    return mapping
      ? { userId: mapping.userId, accountId: mapping.accountId ?? null }
      : null;
  },
});
