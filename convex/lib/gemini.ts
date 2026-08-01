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

/**
 * Build the Gemini 2.5 Flash `generateContent` URL for a given API key.
 * The key is passed as a query parameter exactly as the upstream API expects.
 */
export function geminiGenerateUrl(apiKey: string): string {
  return `${GEMINI_ENDPOINT_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}
