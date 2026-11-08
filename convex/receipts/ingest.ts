import { httpAction } from "../_generated/server";
import { z } from "zod";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ingestRequestBodySchema } from "../lib/receipt/ingestSchema";
import { scrape as scrapeEngine } from "../lib/receipt/engine";
import type { OcrPayload } from "../lib/receipt/types";

// HMAC-SHA256 token validation for app:<userId> identity delegation
// Token format: "<userId>:<timestamp>:<hmac>"
// HMAC = HMAC-SHA256("<userId>:<timestamp>", CONVEX_SYNC_SECRET)
// Valid for 5 minutes to prevent replay
async function validateAppToken(lineUserId: string, token: string, syncSecret: string): Promise<Id<"users"> | null> {
  if (!lineUserId.startsWith("app:")) return null;
  
  const rawUserId = lineUserId.slice(4) as Id<"users">;
  const parts = token.split(":");
  if (parts.length !== 3) return null;
  
  const [tokenUserId, timestampStr, hmac] = parts;
  if (tokenUserId !== rawUserId) return null;
  
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return null;
  
  // Check timestamp is within 5 minutes
  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) return null;
  
  // Verify HMAC
  const message = `${rawUserId}:${timestamp}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(syncSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signature = new Uint8Array(Buffer.from(hmac, "hex"));
  const valid = await crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(message));
  if (!valid) return null;
  
  return rawUserId;
}

// Budget Boss: HTTP action for TeacherBOY receipt ingestion
// Authenticated via Bearer token (CONVEX_SYNC_SECRET) + HMAC token for app: identity
export const ingestReceipt = httpAction(async (ctx, req) => {
  // Verify Bearer token (CONVEX_SYNC_SECRET)
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
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const { lineUserId, payload, idempotencyKey, source: requestSource, appToken } = parsed.data;

  // Resolve user: "app:<userId>" requires valid HMAC token; everything else uses existing LINE path.
  let userId: Id<"users">;
  let accountId: string | undefined;

  if (lineUserId.startsWith("app:")) {
    const validatedUserId = await validateAppToken(lineUserId, appToken ?? "", expectedToken);
    if (!validatedUserId) {
      return new Response(JSON.stringify({ success: false, error: "Invalid or expired app token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const user = await ctx.runQuery(internal.receipts.getUserForIngest, { userId: validatedUserId });
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    userId = validatedUserId;
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

  // Extract fields: scrapeEngine returns minor units (cents/satang), convert to major currency units (e.g. 5398 -> 53.98)
  const rawTotal = typeof scraped.fields.total?.value === "number" ? scraped.fields.total.value : 0;
  const amount = rawTotal > 0 ? Math.round(rawTotal) / 100 : 0;
  const merchant = typeof scraped.fields.merchant?.value === "string" ? scraped.fields.merchant.value : "Unknown Merchant";
  const category = typeof scraped.fields.category?.value === "string" ? scraped.fields.category.value : "other";
  const date = typeof scraped.fields.date?.value === "string" ? scraped.fields.date.value : undefined;
  const currency = typeof scraped.fields.currency?.value === "string" ? scraped.fields.currency.value : undefined;
  const rawTax = typeof scraped.fields.tax?.value === "number" ? scraped.fields.tax.value : undefined;
  const tax = rawTax !== undefined ? Math.round(rawTax) / 100 : undefined;
  const lineItems = (scraped.lineItems ?? []).map((it) => ({
    ...it,
    amount: Math.round(it.amount) / 100,
    ...(typeof it.unitPrice === "number" ? { unitPrice: Math.round(it.unitPrice) / 100 } : {}),
  }));

  const normalizedFields = {
    ...scraped.fields,
    total: scraped.fields.total ? { ...scraped.fields.total, value: amount } : null,
    tax: scraped.fields.tax && tax !== undefined ? { ...scraped.fields.tax, value: tax } : null,
  };

  // Insert draft receipt via idempotent internal mutation (insert-then-read pattern)
  // Uses the by_user_and_clientDraftId index as the claim to prevent duplicate drafts
  const draftId = await ctx.runMutation(internal.receipts.saveReceiptIdempotent, {
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

  // Check if this was a duplicate by querying the draft
  const draft = await ctx.runQuery(internal.receipts.getReceiptByClientDraftId, {
    userId,
    clientDraftId: idempotencyKey,
  });

  const isDuplicate = draft && draft._id !== draftId;

  return new Response(JSON.stringify({
    success: true,
    draftId: draft?._id ?? draftId,
    alreadySynced: isDuplicate,
    fields: normalizedFields,
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
