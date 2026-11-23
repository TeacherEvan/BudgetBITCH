import { describe, expect, test } from "vitest";
import {
  geminiAuthHeaders,
  geminiGenerateUrlNoKey,
  isAllowedReceiptMimeType,
  sanitizeUpstreamError,
} from "./gemini";

describe("Gemini request hardening (P1-C9)", () => {
  test("credential-free URL never embeds the API key and headers carry it instead", () => {
    const url = geminiGenerateUrlNoKey();
    expect(url).not.toContain("?key=");
    expect(url).toContain(":generateContent");
    expect(geminiAuthHeaders("secret-123")).toEqual({ "x-goog-api-key": "secret-123" });
  });

  test("mime allow-list only accepts supported receipt image types", () => {
    for (const mime of ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]) {
      expect(isAllowedReceiptMimeType(mime)).toBe(true);
    }
    for (const mime of ["text/html", "application/pdf", "image/svg+xml", "image/gif", " IMAGE/JPEG "]) {
      expect(isAllowedReceiptMimeType(mime)).toBe(false);
    }
  });

  test("upstream URLs and error bodies are stripped from client-facing messages", () => {
    const raw =
      "Gemini API returned error status 429: https://generativelanguage.googleapis.com/v1beta/models/x?key=SECRET quota exceeded for project my-proj";
    const safe = sanitizeUpstreamError(new Error(raw), "Upstream request failed");
    expect(safe).not.toContain("http");
    expect(safe).not.toContain("SECRET");
    expect(safe).not.toContain("quota exceeded");
    expect(safe).toContain("429");
  });
});
