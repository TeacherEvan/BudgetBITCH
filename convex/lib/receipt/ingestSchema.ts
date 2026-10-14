import { z } from "zod";

/**
 * Validation schema for the TeacherBOY → Budget Boss receipt-ingest webhook
 * body (convex/receipts.ts `ingestReceipt`).
 *
 * The channel is server-to-server (authenticated with CONVEX_SYNC_SECRET), but
 * a malformed or partially-present `payload` previously flowed straight into
 * `scrapeEngine(payload)` and `payload.lines?.map(...)`. Hardening the shape
 * here means a bad body is rejected with a 400 + actionable message instead of
 * throwing deep inside the scraper.
 *
 * Optional payload hints use `.nullish()`, not `.optional()`: the bot's adapter
 * (`receipt_bridge.gemini_text_to_ocr_payload`) serialises absent hints as JSON
 * `null` rather than omitting the key — `"currencyHint": None` is emitted on
 * every single scan. Under `.optional()` that rejected the whole body with a
 * 400, so no bot receipt could ever reach the scraper. Accept both spellings of
 * "not provided" and let the scraper detect the currency from the text.
 */
const nullableString = z.string().nullish();

export const ingestRequestBodySchema = z.object({
  lineUserId: z.string().min(1, "lineUserId is required"),
  idempotencyKey: z.string().min(1, "idempotencyKey is required"),
  payload: z.object({
    lines: z
      .array(
        z.object({
          text: z.string(),
          conf: z.number().nullish(),
          y: z.number().nullish(),
          words: z.array(z.any()).nullish(),
        }),
      )
      .min(1, "payload.lines must contain at least one line"),
    width: z.number().nullish(),
    height: z.number().nullish(),
    lang: nullableString,
    engine: nullableString,
    capturedAt: z.number().nullish(),
    countryHint: nullableString,
    currencyHint: nullableString,
  }),
});

export type IngestRequestBody = z.infer<typeof ingestRequestBodySchema>;
