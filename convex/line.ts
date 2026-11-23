import { httpAction, internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { GEMINI_MODEL, geminiGenerateUrl } from "./lib/gemini";
import { verifyLineSignature } from "./lib/line/verify";
import { clog, clogError, clogMetric, genTraceId } from "./lib/log";
import {
  normalizeCategory,
  validateAmount,
  validateDate,
  validateMerchant,
} from "./receipts";
import { VALID_CATEGORIES } from "./receipts/constants";

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// W3: LINE link challenges. Stored in `processedWebhooks` under a reserved,
// namespaced key so no schema change is required (schema.ts is owned by W4).
// A dedicated `lineLinkChallenges` table is documented in the W3 report.
const LINE_LINK_CHALLENGE_PREFIX = "linkchallenge:";
const LINE_LINK_CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function challengeCodeHash(code: string): string {
  // Deterministic non-cryptographic hash: the code is 24 random hex chars and
  // the hash only avoids persisting the code verbatim in the database key.
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

function challengeKey(lineUserId: string, codeHash: string): string {
  return `${LINE_LINK_CHALLENGE_PREFIX}${lineUserId}:${codeHash}`;
}

async function findLineLinkChallenges(
  ctx: MutationCtx,
  lineUserId: string,
) {
  const prefix = `${LINE_LINK_CHALLENGE_PREFIX}${lineUserId}:`;
  return await ctx.db
    .query("processedWebhooks")
    .withIndex("by_webhookEventId", (q) =>
      q.gte("webhookEventId", prefix).lt("webhookEventId", `${prefix}\uffff`),
    )
    .take(10);
}

/** Bot-callable challenge issuer. The bot must deliver `code` to the LINE
 * user out-of-band before the user submits it to `linkLineAccount`. */
export const issueLineLinkChallenge = internalMutation({
  args: { lineUserId: v.string() },
  handler: async (ctx, args) => {
    const lineUserId = args.lineUserId.trim();
    if (!lineUserId) throw new ConvexError("lineUserId is required");
    if (lineUserId.startsWith("app:")) {
      throw new ConvexError("app: LINE user IDs are internal and cannot be linked");
    }

    // A new challenge invalidates any earlier outstanding one for this LINE id.
    for (const existing of await findLineLinkChallenges(ctx, lineUserId)) {
      await ctx.db.delete(existing._id);
    }

    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const issuedAt = Date.now();
    await ctx.db.insert("processedWebhooks", {
      webhookEventId: challengeKey(lineUserId, challengeCodeHash(code)),
      createdAt: issuedAt,
    });
    return { code, lineUserId, expiresAt: issuedAt + LINE_LINK_CHALLENGE_TTL_MS };
  },
});

/** Atomically consume a single-use, 10-minute challenge bound to lineUserId. */
async function consumeLineLinkChallenge(
  ctx: MutationCtx,
  lineUserId: string,
  code: string,
): Promise<void> {
  const key = challengeKey(lineUserId, challengeCodeHash(code.trim()));
  const row = await ctx.db
    .query("processedWebhooks")
    .withIndex("by_webhookEventId", (q) => q.eq("webhookEventId", key))
    .unique();
  if (!row) throw new ConvexError("Invalid or expired LINE link code");
  if (Date.now() - row.createdAt > LINE_LINK_CHALLENGE_TTL_MS) {
    // Any write here would be rolled back by the throw; cleanupProcessedWebhooks
    // reclaims expired challenge rows with the rest of the 24h TTL sweep.
    throw new ConvexError("Invalid or expired LINE link code");
  }
  // Deleting inside the mutation makes the consume single-use: a later reuse
  // fails the lookup above (and rolls back with the transaction on any error).
  await ctx.db.delete(row._id);
}

/** Check webhook event idempotency (read-only query). Returns true if already processed. */
export const isWebhookEventProcessed = internalQuery({
  args: { webhookEventId: v.string() },
  handler: async (ctx, { webhookEventId }): Promise<boolean> => {
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_webhookEventId", (q) => q.eq("webhookEventId", webhookEventId))
      .unique();
    return !!existing;
  },
});

/** Record processed webhook event after successful ingestion. */
export const recordWebhookEvent = internalMutation({
  args: { webhookEventId: v.string() },
  handler: async (ctx, { webhookEventId }) => {
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_webhookEventId", (q) => q.eq("webhookEventId", webhookEventId))
      .unique();
    if (!existing) {
      await ctx.db.insert("processedWebhooks", {
        webhookEventId,
        createdAt: Date.now(),
      });
    }
  },
});

/** Check and record webhook event idempotency in a mutation transaction.
 * Uses atomic insert-then-read with index order("asc") to guarantee exactly one winner
 * under concurrent duplicate deliveries. Returns true if already processed. */
export const checkAndRecordWebhookEvent = internalMutation({
  args: { webhookEventId: v.string() },
  handler: async (ctx, { webhookEventId }): Promise<boolean> => {
    // INSERT: Insert our attempt record
    const insertedId = await ctx.db.insert("processedWebhooks", {
      webhookEventId,
      createdAt: Date.now(),
    });

    // READ: Find the earliest row for this webhookEventId
    const first = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_webhookEventId", (q) => q.eq("webhookEventId", webhookEventId))
      .order("asc")
      .first();

    if (!first || first._id !== insertedId) {
      // We lost the race: delete our inserted duplicate and declare already processed
      await ctx.db.delete(insertedId);
      return true;
    }

    // We won the race: claim is secured
    return false;
  },
});

/** Release an idempotency claim row if processing failed transiently (allowing retries). */
export const releaseWebhookEvent = internalMutation({
  args: { webhookEventId: v.string() },
  handler: async (ctx, { webhookEventId }) => {
    const existing = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_webhookEventId", (q) => q.eq("webhookEventId", webhookEventId))
      .take(20);
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }
  },
});

/** Delete expired webhook idempotency records in batches. */
export const deleteExpiredWebhookEvents = internalMutation({
  args: { cutoff: v.number(), limit: v.number() },
  handler: async (ctx, { cutoff, limit }) => {
    const batch = await ctx.db
      .query("processedWebhooks")
      .withIndex("by_createdAt", (q) => q.lte("createdAt", cutoff))
      .take(limit);
    for (const row of batch) {
      await ctx.db.delete(row._id);
    }
    return batch.length;
  },
});

/** Clean up expired idempotency records (call from cron). */
export const cleanupProcessedWebhooks = internalAction({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    let deleted = 0;
    while (true) {
      const count: number = await ctx.runMutation(internal.line.deleteExpiredWebhookEvents, {
        cutoff,
        limit: 250,
      });
      deleted += count;
      if (count < 250) break;
    }
    return { deleted };
  },
});

// Links a LINE user ID to the authenticated Convex user (and optional account).
// The userId is resolved server-side from auth — never taken from client args.
// W3: linking now requires a bot-issued, single-use challenge code proving
// control of the LINE identity, and any accountId must be owned/joined by the caller.
export const linkLineAccount = mutation({
  args: {
    lineUserId: v.string(),
    // Optional at the validator level so the current client (src/hooks/use-line-link.ts,
    // owned by another worker) still typechecks; required at runtime below.
    code: v.optional(v.string()),
    accountId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userIdStr = await getAuthUserId(ctx);
    if (!userIdStr) {
      throw new ConvexError("Authentication required");
    }
    if (!args.code || !args.code.trim()) {
      throw new ConvexError("LINE link code is required");
    }
    const userId = userIdStr as Id<"users">;
    const lineUserId = args.lineUserId.trim();
    if (!lineUserId) {
      throw new ConvexError("lineUserId is required");
    }
    if (lineUserId.startsWith("app:")) {
      throw new ConvexError("app: LINE user IDs are internal and cannot be linked");
    }

    // N9: never persist a client-supplied accountId without an ownership check.
    const accountId = args.accountId?.trim() || undefined;
    if (accountId) {
      const acc = await ctx.db
        .query("accounts")
        .withIndex("by_accountId", (q) => q.eq("accountId", accountId))
        .unique();
      if (!acc) throw new ConvexError("Account not found");
      let authorized = acc.ownerId === userId;
      if (!authorized && acc.boardId) {
        authorized =
          (await ctx.db
            .query("boardMembers")
            .withIndex("by_user_and_board", (q) =>
              q.eq("userId", userId).eq("boardId", acc.boardId!),
            )
            .first()) !== null;
      }
      if (!authorized) {
        throw new ConvexError("You are not authorized for this account");
      }
    }

    // Consume before touching the mapping: an attacker without the code cannot
    // pre-claim (or re-point) any LINE identity.
    await consumeLineLinkChallenge(ctx, lineUserId, args.code);

    const existing = await ctx.db
      .query("lineUsers")
      .withIndex("by_lineUserId", (q) => q.eq("lineUserId", lineUserId))
      .unique();

    // Prevent hijacking: if this LINE account is already linked to a DIFFERENT user, reject.
    if (existing && existing.userId !== userId) {
      throw new ConvexError("This LINE account is already linked to another user");
    }

    // Upsert: patch the existing mapping if this LINE user was already linked by the same user.
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId,
        accountId: accountId ?? existing.accountId,
        linkedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("lineUsers", {
      lineUserId,
      userId,
      accountId,
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

// W3: keep the prompt vocabulary in lockstep with the canonical category set
// used by normalizeCategory so both receipt-ingest paths agree.
export const LINE_RECEIPT_PROMPT = `Analyze the receipt in the image. You must extract:
1. Total amount spent (as a number, do not include currency symbols).
2. Merchant/Store name.
3. A suggested category. Choose ONLY from this canonical vocabulary: ${VALID_CATEGORIES.join(", ")}. Use "other" when unsure.
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
    clientDraftId: v.optional(v.string()),
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
          signal: AbortSignal.timeout(25_000),
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

      const receiptId = await ctx.runMutation(internal.receipts.saveReceiptIdempotent, {
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
        clientDraftId: args.clientDraftId,
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
 * Includes idempotency protection via processedWebhooks table (24h TTL).
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
  let parseFailed = 0;

  for (const event of events) {
    const e = event as {
      type?: string;
      message?: { type?: string; id?: string };
      source?: { userId?: string };
    };
    if (e.type !== "message" || e.message?.type !== "image" || !e.message.id) {
      continue;
    }

    // Upfront atomic claim: insert-then-read to prevent concurrent duplicate processing
    const messageEventId = `msg:${e.message.id}`;
    const alreadyProcessed = await ctx.runMutation(internal.line.checkAndRecordWebhookEvent, {
      webhookEventId: messageEventId,
    });
    if (alreadyProcessed) {
      clog("info", "line_webhook_deduplicated", { traceId, webhookEventId: messageEventId });
      continue;
    }

    let committed = false;
    try {
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
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              signal: AbortSignal.timeout(15_000),
            },
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
          clientDraftId: `line:${e.message.id}`,
        });
        committed = true;
        ingested++;
      } catch (err) {
        parseFailed++;
        clogError("line_webhook_ingest_failed", err, { traceId, lineUserId });
      }
    } finally {
      if (!committed) {
        await ctx.runMutation(internal.line.releaseWebhookEvent, {
          webhookEventId: messageEventId,
        });
      }
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
