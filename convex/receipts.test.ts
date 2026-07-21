/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, beforeEach, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

let t: ReturnType<typeof convexTest>;

beforeEach(() => {
  t = convexTest(schema, modules);
  vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");
});

test("parseReceipt handles successful response from Gemini", async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  amount: 150.50,
                  merchant: "Test Coffee Shop",
                  category: "food",
                  date: "2026-07-21"
                })
              }
            ]
          }
        }
      ]
    })
  });
  vi.stubGlobal("fetch", mockFetch);

  const res = await t.action(api.receipts.parseReceipt, {
    base64Image: "data:image/png;base64,abcdef"
  });

  expect(res).toEqual({
    amount: 150.50,
    merchant: "Test Coffee Shop",
    category: "food",
    date: "2026-07-21"
  });

  expect(mockFetch).toHaveBeenCalledTimes(1);
  const fetchUrl = mockFetch.mock.calls[0][0];
  expect(fetchUrl).toContain("mock-gemini-key");
  
  vi.unstubAllGlobals();
});

test("parseReceipt throws error when GEMINI_API_KEY is missing", async () => {
  vi.stubEnv("GEMINI_API_KEY", "");

  await expect(
    t.action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Gemini API key is not configured/);
});

test("parseReceipt handles API error responses", async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => "Internal Server Error"
  });
  vi.stubGlobal("fetch", mockFetch);

  await expect(
    t.action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Gemini API returned error status 500/);

  vi.unstubAllGlobals();
});
