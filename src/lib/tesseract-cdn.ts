// Tesseract.js CDN Configuration
// This file documents the CDN URLs and SRI hashes for Tesseract WASM binaries.
// Actual hosting should be on a CDN (Cloudflare R2, AWS S3 + CloudFront, etc.)
// with Cache-Control: public, max-age=31536000, immutable

export const TESSERACT_CDN_CONFIG = {
  // Base CDN URL (replace with your CDN endpoint)
  baseUrl: "https://cdn.budgetboss.app/tesseract/v1",

  // SIMD WASM (required for fast OCR)
  simd: {
    url: "https://cdn.budgetboss.app/tesseract/v1/tesseract-core-simd.wasm.js",
    // SRI hash will be computed after upload: sha384-<base64>
    integrity: "sha384-PLACEHOLDER_REPLACE_WITH_ACTUAL_HASH",
  },

  // SIMD LSTM WASM (required for LSTM models)
  simdLstm: {
    url: "https://cdn.budgetboss.app/tesseract/v1/tesseract-core-simd-lstm.wasm.js",
    integrity: "sha384-PLACEHOLDER_REPLACE_WITH_ACTUAL_HASH",
  },

  // Language data (English)
  engTraineddata: {
    url: "https://cdn.budgetboss.app/tesseract/v1/eng.traineddata.gz",
    integrity: "sha384-PLACEHOLDER_REPLACE_WITH_ACTUAL_HASH",
  },

  // Worker script
  worker: {
    url: "https://cdn.budgetboss.app/tesseract/v1/worker.min.js",
    integrity: "sha384-PLACEHOLDER_REPLACE_WITH_ACTUAL_HASH",
  },
} as const;

/**
 * Compute SRI hash for a file (run locally before upload):
 *   npx sri-hash <file>
 * Or: openssl dgst -sha384 -binary <file> | openssl base64 -A
 */
export function generateSriHash(fileBuffer: Buffer): string {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha384").update(fileBuffer).digest("base64");
  return `sha384-${hash}`;
}