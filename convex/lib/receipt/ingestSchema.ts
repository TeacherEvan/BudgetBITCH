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
 */
export const ingestRequestBodySchema = z.object({
  lineUserId: z.string().min(1, "lineUserId is required"),
  idempotencyKey: z.string().min(1, "idempotencyKey is required"),
  source: z.string().optional(),        // "line" (default) | "app-camera"
  payload: z.object({
    lines: z
      .array(
        z.object({
          text: z.string(),
          conf: z.number().optional(),
          y: z.number().optional(),
          words: z.array(z.any()).optional(),
        }),
      )
      .min(1, "payload.lines must contain at least one line"),
    width: z.number().optional(),
    height: z.number().optional(),
    lang: z.string().optional(),
    engine: z.string().optional(),
    capturedAt: z.number().optional(),
    // nullish (not optional) because the TeacherBOY bridge serializes
    // absent hints as JSON null (Python None) rather than omitting the key.
    countryHint: z.string().nullish(),
    currencyHint: z.string().nullish(),
  }),
});

export type IngestRequestBody = z.infer<typeof ingestRequestBodySchema>;
