/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

let t: ReturnType<typeof convexTest>;
const asUser = (userId: any) => t.withIdentity({ subject: userId });

beforeEach(() => {
  t = convexTest(schema, modules);
  vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");
});

test("parseReceipt rejects unauthenticated calls", async () => {
  await expect(
    t.action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Authentication required to parse receipts/);
});

test("parseReceipt handles successful response from Gemini for authenticated user", async () => {
  const userId = await seedUser(t, "receipt-user");
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
                  date: "2026-07-21",
                  lineItems: [
                    { description: "Latte", amount: 80.50 },
                    { description: "Sandwich", amount: 70.00 },
                  ]
                })
              }
            ]
          }
        }
      ]
    })
  });
  vi.stubGlobal("fetch", mockFetch);

  const res = await asUser(userId).action(api.receipts.parseReceipt, {
    base64Image: "data:image/png;base64,abcdef"
  });

  expect(res).toEqual({
    receiptId: expect.any(String),
    amount: 150.50,
    merchant: "Test Coffee Shop",
    category: "food",
    date: "2026-07-21",
    lineItems: [
      { description: "Latte", amount: 80.50 },
      { description: "Sandwich", amount: 70.00 },
    ]
  });

  expect(mockFetch).toHaveBeenCalledTimes(1);
  const fetchUrl = mockFetch.mock.calls[0][0];
  expect(fetchUrl).toContain("mock-gemini-key");
  
  vi.unstubAllGlobals();
});

test("parseReceipt throws error when GEMINI_API_KEY is missing", async () => {
  const userId = await seedUser(t, "receipt-user");
  vi.stubEnv("GEMINI_API_KEY", "");

  await expect(
    asUser(userId).action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Gemini API key is not configured/);
});

test("parseReceipt handles API error responses", async () => {
  const userId = await seedUser(t, "receipt-user");
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => "Internal Server Error"
  });
  vi.stubGlobal("fetch", mockFetch);

  await expect(
    asUser(userId).action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Gemini API returned error status 500/);

  vi.unstubAllGlobals();
});

test("parseMessage handles successful response from Gemini for financial notification text", async () => {
  const userId = await seedUser(t, "message-user");
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  amount: 89.99,
                  merchant: "Amazon",
                  category: "shopping",
                  date: "2026-07-25",
                  type: "expense"
                })
              }
            ]
          }
        }
      ]
    })
  });
  vi.stubGlobal("fetch", mockFetch);

  const res = await asUser(userId).action(api.receipts.parseMessage, {
    messageText: "FNB :-): Paid R89.99 at Amazon on 25Jul26."
  });

  expect(res).toEqual({
    amount: 89.99,
    merchant: "Amazon",
    category: "other",
    date: "2026-07-25",
    type: "expense"
  });

  vi.unstubAllGlobals();
});

test("listReceipts filters by source and status", async () => {
  const userId = await seedUser(t, "filter-user");

  // Insert receipts directly with explicit source/status (mirrors what the
  // TeacherBOY / LINE bot ingest and the app scrape produce).
  const insert = (source: string | undefined, status: string | undefined) =>
    t.run(async (ctx: any) =>
      ctx.db.insert("receipts", {
        userId,
        amount: 10,
        merchant: "M",
        category: "food",
        parsedAt: Date.now(),
        geminiModel: "scraper-bot",
        imageMimeType: "application/json",
        imageSizeBytes: 0,
        engine: "scraper-bot",
        status: status ?? "draft",
        source,
      }),
    );

  await insert("app", "confirmed");
  await insert("app", "draft");
  await insert("line", "draft");
  await insert("line", "confirmed");

  // Filtering source=line, status=draft should return ONLY the line draft.
  const res = await asUser(userId).query(api.receipts.listReceipts, {
    source: "line",
    status: "draft",
  });
  expect(res.receipts.length).toBe(1);
  expect(res.receipts[0].source).toBe("line");
  expect(res.receipts[0].status).toBe("draft");

  // No filter returns all four.
  const all = await asUser(userId).query(api.receipts.listReceipts, {});
  expect(all.receipts.length).toBe(4);
});

