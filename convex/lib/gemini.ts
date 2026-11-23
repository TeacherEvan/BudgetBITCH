/**
 * Shared Gemini model configuration for the receipt-parsing backend.
 *
 * The model name and the generateContent endpoint URL were previously
 * hard-coded in three places (receipts.ts x2, line.ts x1). Centralising them
 * here prevents version drift and keeps the only mutable model knob in one
 * spot.
 */
export const GEMINI_MODEL = "gemini-2.5-flash";

const GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

const RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

/**
 * Credential-free `generateContent` URL. The API key belongs in the
 * `x-goog-api-key` header (see `geminiAuthHeaders`) — putting it in the query
 * string leaks it into proxy logs, error reports and browser history.
 */
export function geminiGenerateUrlNoKey(): string {
  return `${GEMINI_ENDPOINT_BASE}/${GEMINI_MODEL}:generateContent`;
}

/** Auth headers for Gemini. Never interpolate the key into a URL. */
export function geminiAuthHeaders(apiKey: string): Record<string, string> {
  return { "x-goog-api-key": apiKey };
}

/** Only these image MIME types are accepted from client receipt uploads. */
export function isAllowedReceiptMimeType(mimeType: string): boolean {
  const normalised = mimeType.toLowerCase();
  return (RECEIPT_MIME_TYPES as readonly string[]).includes(normalised);
}

/**
 * Upstream response bodies / URLs must never reach a client-facing
 * `ConvexError`: they can carry the API key (in a `?key=` URL) and internal
 * project details. Keep the status code for diagnostics, drop the rest.
 */
export function sanitizeUpstreamError(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const sanitised = raw
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/(error status\s*\d+)\s*:[\s\S]*/i, "$1")
    .replace(/[\w./-]*googleapis\.com\S*/gi, "[endpoint]")
    .replace(/key=[^\s&]+/gi, "key=[redacted]")
    .trim();
  const result = sanitised || fallback;
  return result.length > 200 ? `${result.slice(0, 200)}…` : result;
}

/**
 * @deprecated Kept ONLY for the W3-owned `convex/line.ts` caller, which still
 * passes the key in the URL. All code in the W4 scope must use
 * `geminiGenerateUrlNoKey()` + `geminiAuthHeaders()` instead. Once line.ts has
 * been migrated this function can be removed.
 */
export function geminiGenerateUrl(apiKey: string): string {
  return `${geminiGenerateUrlNoKey()}?key=${apiKey}`;
}
