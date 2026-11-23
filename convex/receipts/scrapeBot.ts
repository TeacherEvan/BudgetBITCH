import { Doc } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { scrape as scrapeEngine } from "../lib/receipt/engine";
import { applyAnswers, generateQuestions } from "../lib/receipt/questions";
import type { FieldCandidate, FieldName, OcrPayload } from "../lib/receipt/types";
import { normalizeCategory, validateAmount, validateDate, validateMerchant } from "./constants";

// Shared payload validator (mirrors ingestSchema.ts caps)
const ocrPayloadValidator = v.object({
  lines: v.array(v.object({
    text: v.string(),
    conf: v.optional(v.number()),
    y: v.optional(v.number()),
    words: v.optional(v.array(v.any())),
  })),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  lang: v.optional(v.string()),
  engine: v.optional(v.string()),
  capturedAt: v.optional(v.number()),
  countryHint: v.optional(v.union(v.string(), v.null())),
  currencyHint: v.optional(v.union(v.string(), v.null())),
});

/**
 * P1-C3: receipts store extracted values in real columns (amount/merchant/
 * category/date/tax/currency) — there is no `fields` column. Rebuild the
 * field/confidence maps from those columns so `applyAnswers` folds into the
 * *current* extraction instead of an empty object that erases it.
 */
function fieldsFromReceipt(draft: Doc<"receipts">): {
  fields: Record<FieldName, FieldCandidate | null>;
  confidence: Record<FieldName, number>;
} {
  const candidate = (value: unknown): FieldCandidate | null =>
    value === undefined || value === null
      ? null
      : { value: value as string | number, conf: 1, ruleId: "stored" };

  const fields: Record<FieldName, FieldCandidate | null> = {
    total: candidate(draft.amount),
    date: candidate(draft.date),
    merchant: candidate(draft.merchant),
    category: candidate(draft.category),
    currency: candidate(draft.currency),
    tax: candidate(draft.tax),
  };
  const confidence: Record<FieldName, number> = {
    total: draft.amount !== undefined ? 1 : 0,
    date: draft.date !== undefined ? 1 : 0,
    merchant: draft.merchant ? 1 : 0,
    category: draft.category ? 1 : 0,
    currency: draft.currency !== undefined ? 1 : 0,
    tax: draft.tax !== undefined ? 1 : 0,
  };
  return { fields, confidence };
}

type ReceiptColumns = Pick<
  Doc<"receipts">,
  "amount" | "merchant" | "category" | "date" | "tax" | "currency"
>;

function columnsFromFields(
  fields: Record<FieldName, FieldCandidate | null>,
  draft: ReceiptColumns,
) {
  const num = (value: unknown, fallback: number | undefined): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return fallback;
  };
  const str = (value: unknown, fallback: string | undefined): string | undefined => {
    if (value === undefined || value === null) return fallback;
    return String(value);
  };
  return {
    amount: num(fields.total?.value, draft.amount) ?? 0,
    merchant: str(fields.merchant?.value, draft.merchant) ?? "Unknown Merchant",
    category: str(fields.category?.value, draft.category) ?? "other",
    date: str(fields.date?.value, draft.date),
    tax: num(fields.tax?.value, draft.tax),
    currency: str(fields.currency?.value, draft.currency),
  };
}

// Scraper Bot: Scrape receipt from OCR payload
export const scrape = mutation({
  args: {
    payload: ocrPayloadValidator,
    accountId: v.optional(v.string()),
    clientDraftId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    // 5000 lines cap (mirroring ingestSchema.ts)
    if (args.payload.lines.length < 1) {
      throw new ConvexError("Payload must contain at least one line");
    }
    if (args.payload.lines.length > 5000) {
      throw new ConvexError("Too many lines (max 5000)");
    }

    // 8 MB JSON ceiling (mirroring ingestReceipt)
    const payloadBytes = new TextEncoder().encode(JSON.stringify(args.payload)).length;
    if (payloadBytes > 8_000_000) {
      throw new ConvexError("Payload too large (max 8MB)");
    }

    const payload = args.payload as OcrPayload;
    const result = scrapeEngine(payload);

    const rawTotal = typeof result.fields.total?.value === "number" ? result.fields.total.value : 0;
    // scrapeEngine returns amounts in minor units (cents) — convert to major units
    const amount = rawTotal > 0 ? Math.round(rawTotal) / 100 : 0;
    const merchant = typeof result.fields.merchant?.value === "string" ? result.fields.merchant.value : "Unknown Merchant";
    const category = typeof result.fields.category?.value === "string" ? result.fields.category.value : "other";
    const date = typeof result.fields.date?.value === "string" ? result.fields.date.value : undefined;
    const rawTax = typeof result.fields.tax?.value === "number" ? result.fields.tax.value : undefined;
    const tax = rawTax !== undefined ? Math.round(rawTax) / 100 : undefined;
    const lineItems = ((result.lineItems ?? result.items) ?? []).map((it) => ({
      ...it,
      amount: Math.round(it.amount) / 100,
      ...(typeof it.unitPrice === "number" ? { unitPrice: Math.round(it.unitPrice) / 100 } : {}),
    }));

    const normalizedFields = {
      ...result.fields,
      total: result.fields.total ? { ...result.fields.total, value: amount } : null,
      tax: result.fields.tax && tax !== undefined ? { ...result.fields.tax, value: tax } : null,
    };

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
      lineItems,
      tax,
      currency: typeof result.fields.currency?.value === "string" ? result.fields.currency.value : undefined,
      questionsAsked: result.questions,
      status: "draft",
    });

    return {
      draftId,
      fields: normalizedFields,
      confidence: result.confidence,
      evidence: result.evidence,
      questions: result.questions,
      lineItems,
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

    const { fields: currentFields, confidence: currentConfidence } = fieldsFromReceipt(draft);

    const folded = applyAnswers(currentFields, currentConfidence, args.answers);
    const questions = generateQuestions(folded.updatedFields, folded.updatedConfidence);
    const columns = columnsFromFields(folded.updatedFields, draft);

    await ctx.db.patch(args.draftId, {
      ...columns,
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

    // P1-C3: overrides are edits to the receipt itself, not just an audit
    // note. Validate them and persist onto the row before learning aliases.
    const overrides = (args.overrides ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {
      status: "confirmed",
      corrections: args.overrides,
    };
    if (overrides.amount !== undefined) patch.amount = validateAmount(overrides.amount);
    if (overrides.merchant !== undefined) patch.merchant = validateMerchant(overrides.merchant);
    if (overrides.category !== undefined) {
      patch.category = normalizeCategory(String(overrides.category));
    }
    if (overrides.date !== undefined) {
      const validatedDate = validateDate(overrides.date);
      if (validatedDate !== null) patch.date = validatedDate;
    }
    if (overrides.tax !== undefined) patch.tax = validateAmount(overrides.tax);
    if (overrides.currency !== undefined) patch.currency = String(overrides.currency).trim();
    if (overrides.lineItems !== undefined) patch.lineItems = overrides.lineItems;
    await ctx.db.patch(args.draftId, patch);

    const merchantName = String(patch.merchant ?? draft.merchant ?? "") || "Unknown";
    const normalised = merchantName.toLowerCase().trim();

    const existingAlias = await ctx.db
      .query("merchantAliases")
      .withIndex("by_user_and_normalised", (q) => q.eq("userId", userId).eq("normalised", normalised))
      .first();

    if (existingAlias) {
      await ctx.db.patch(existingAlias._id, {
        hits: existingAlias.hits + 1,
        category: String(patch.category ?? draft.category),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("merchantAliases", {
        userId,
        normalised,
        displayName: merchantName,
        category: String(patch.category ?? draft.category),
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
    payload: ocrPayloadValidator,
    answers: v.optional(v.any()),
    confirmed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    // Idempotent by clientDraftId: a retry (offline queue flush) must not
    // create a duplicate draft. Checked before engine work so a replay
    // short-circuits even if the payload would now exceed caps.
    const existing = await ctx.db
      .query("receipts")
      .withIndex("by_user_and_clientDraftId", (q) =>
        q.eq("userId", userId).eq("clientDraftId", args.clientDraftId)
      )
      .first();
    if (existing) {
      // P2-N2: an offline replay may carry the user's final answers and the
      // confirmed flag. The first insert created the row, but a retry that
      // adds those must still apply them (and report that it did).
      if (!args.answers && !args.confirmed) {
        return { receiptId: existing._id, alreadySynced: true };
      }

      const patch: Record<string, unknown> = {};
      let changed = false;

      if (args.answers) {
        const { fields: storedFields, confidence: storedConfidence } = fieldsFromReceipt(existing);
        const folded = applyAnswers(storedFields, storedConfidence, args.answers);
        Object.assign(patch, columnsFromFields(folded.updatedFields, existing), {
          confidence: folded.updatedConfidence,
          questionsAsked: generateQuestions(folded.updatedFields, folded.updatedConfidence),
        });
        changed = true;
      }
      if (args.confirmed && existing.status !== "confirmed") {
        patch.status = "confirmed";
        changed = true;
      }

      if (changed) await ctx.db.patch(existing._id, patch);
      return { receiptId: existing._id, alreadySynced: !changed };
    }

    // 5000 lines cap (mirroring ingestSchema.ts)
    if (args.payload.lines.length < 1) {
      throw new ConvexError("Payload must contain at least one line");
    }
    if (args.payload.lines.length > 5000) {
      throw new ConvexError("Too many lines (max 5000)");
    }

    // 8 MB JSON ceiling (mirroring ingestReceipt)
    const payloadBytes = new TextEncoder().encode(JSON.stringify(args.payload)).length;
    if (payloadBytes > 8_000_000) {
      throw new ConvexError("Payload too large (max 8MB)");
    }

    const payload = args.payload as OcrPayload;
    const result = scrapeEngine(payload);

    // The engine reports minor units. Normalise to major units BEFORE folding
    // answers so a user-entered total is not divided by 100 a second time.
    const rawTotal = typeof result.fields.total?.value === "number" ? result.fields.total.value : 0;
    const engineAmount = Math.round(rawTotal) / 100;
    const rawTax = typeof result.fields.tax?.value === "number" ? result.fields.tax.value : undefined;
    const engineTax = rawTax !== undefined ? Math.round(rawTax) / 100 : undefined;
    let fields: typeof result.fields = {
      ...result.fields,
      total: result.fields.total ? { ...result.fields.total, value: engineAmount } : null,
      tax: result.fields.tax && engineTax !== undefined
        ? { ...result.fields.tax, value: engineTax }
        : null,
    };
    let confidence = result.confidence;

    if (args.answers) {
      const folded = applyAnswers(fields, confidence, args.answers);
      fields = folded.updatedFields;
      confidence = folded.updatedConfidence;
    }

    const columns = columnsFromFields(fields, {
      amount: engineAmount,
      merchant: "Unknown Merchant",
      category: "other",
      date: undefined,
      tax: engineTax,
      currency: undefined,
    });
    const { amount, merchant, category, date, tax, currency } = columns;

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
      tax,
      currency,
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
    if (!userId) {
      return { templates: [], aliases: [] };
    }

    const templates = await ctx.db
      .query("receiptTemplates")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .take(100);

    let aliases: Doc<"merchantAliases">[] = [];
    if (userId) {
      aliases = await ctx.db
        .query("merchantAliases")
        .withIndex("by_user_and_normalised", (q) => q.eq("userId", userId))
        .take(100);
    }

    return { templates, aliases };
  },
});
