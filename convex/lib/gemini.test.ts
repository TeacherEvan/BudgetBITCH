/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";
import * as geminiModule from "./gemini";
import {
  geminiAuthHeaders,
  geminiGenerateUrlNoKey,
  isAllowedReceiptMimeType,
  sanitizeUpstreamError,
} from "./gemini";

const modules = import.meta.glob("../**/*.ts");

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

describe("W8 residual: LINE receipt parse uses header auth (P1-C9)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function setupLineParse() {
    vi.stubEnv("GEMINI_API_KEY", "super-secret-key");
    const t = convexTest(schema, modules);
    const captured: { url?: string; headers?: Record<string, string> } = {};
    vi.stubGlobal("fetch", (async (url: any, init?: any) => {
      const u = String(url);
      if (u.includes("generativelanguage.googleapis.com")) {
        captured.url = u;
        captured.headers = { ...(init?.headers ?? {}) };
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        amount: 12.5,
                        merchant: "Gemini Mart",
                        category: "food",
                        date: "2026-01-02",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch: ${u}`);
    }) as any);
    return { t, captured };
  }

  async function seedUser(t: ReturnType<typeof convexTest>) {
    return await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "line-gemini@example.com" }),
    );
  }

  test("deprecated key-in-URL Gemini helper is removed", () => {
    expect("geminiGenerateUrl" in geminiModule).toBe(false);
  });

  test("LINE receipt parse sends the key in x-goog-api-key, never in the URL", async () => {
    const { t, captured } = setupLineParse();
    const userId = await seedUser(t);

    await t.action(internal.line.parseLineReceipt, {
      userId,
      base64Image: `data:image/png;base64,${btoa("receipt")}`,
    });

    expect(captured.url).toBeDefined();
    expect(captured.url).not.toContain("?key=");
    expect(captured.url).not.toContain("super-secret-key");
    expect(captured.headers?.["x-goog-api-key"]).toBe("super-secret-key");
  });

  test("LINE receipt parse rejects unsupported image MIME types", async () => {
    const { t } = setupLineParse();
    const userId = await seedUser(t);

    await expect(
      t.action(internal.line.parseLineReceipt, {
        userId,
        base64Image: `data:text/html;base64,${btoa("<html/>")}`,
      }),
    ).rejects.toThrow(/Unsupported receipt image type/);
  });

  test("LINE receipt parse rejects oversized payloads before scanning the data URL", async () => {
    const { t } = setupLineParse();
    const userId = await seedUser(t);

    await expect(
      t.action(internal.line.parseLineReceipt, {
        userId,
        base64Image: "x".repeat(8_000_001),
      }),
    ).rejects.toThrow(/too large/);
  });
});
