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


// ---------------------------------------------------------------------------
// App camera ingest path: "app:<userId>" prefix + source pass-through.
//
// Guards the fix that lets the Quick Add camera reach /receipts/ingest without
// a LINE mapping, and stops app-camera drafts being mislabelled source="line"
// (the source was previously hardcoded at three call sites).
// ---------------------------------------------------------------------------

const ingestPayload = (lines: string[]) => ({
  lines: lines.map((text, i) => ({ text, conf: 85, y: i, words: [] })),
  width: 1024,
  height: 400,
  lang: "en",
  engine: "gemini-vision@1",
  capturedAt: Date.now(),
  countryHint: "TH",
  currencyHint: null,
});

async function postIngest(body: unknown, token = "test-sync-secret") {
  return t.fetch("/receipts/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

test("ingestReceipt resolves an app: prefixed user without a LINE mapping", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "app-camera-user");

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "app_no_mapping_1",
    source: "app-camera",
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
  expect(body.draftId).toBeDefined();
});

test("ingestReceipt returns 404 for an app: prefixed user that does not exist", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const realUserId = await seedUser(t, "real-user");
  // Structurally valid Convex ID for the users table, but deleted.
  await t.run(async (ctx: any) => ctx.db.delete(realUserId));

  const res = await postIngest({
    lineUserId: `app:${realUserId}`,
    idempotencyKey: "app_missing_user_1",
    source: "app-camera",
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  expect(res.status).toBe(404);
  const body = await res.json();
  expect(body.error).toMatch(/User not found/);
});

test("ingestReceipt persists source=app-camera instead of hardcoding line", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "source-user");

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "app_source_1",
    source: "app-camera",
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });
  expect(res.status).toBe(200);

  const stored = await t.run(async (ctx: any) =>
    ctx.db
      .query("receipts")
      .withIndex("by_clientDraftId", (q: any) => q.eq("clientDraftId", "app_source_1"))
      .first(),
  );
  expect(stored.source).toBe("app-camera");
});

test("ingestReceipt defaults source to line when the field is omitted", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "default-source-user");

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "app_default_source_1",
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });
  expect(res.status).toBe(200);

  const stored = await t.run(async (ctx: any) =>
    ctx.db
      .query("receipts")
      .withIndex("by_clientDraftId", (q: any) => q.eq("clientDraftId", "app_default_source_1"))
      .first(),
  );
  expect(stored.source).toBe("line");
});

// ---------------------------------------------------------------------------
// proxyReceiptScan: the app never holds CONVEX_SYNC_SECRET.
// ---------------------------------------------------------------------------

test("proxyReceiptScan rejects unauthenticated calls", async () => {
  await expect(
    t.action(api.receipts.proxyReceiptScan, {
      base64Image: "data:image/png;base64,abc",
      idempotencyKey: "proxy_unauth_1",
    }),
  ).rejects.toThrow(/Authentication required to scan receipts/);
});

test("proxyReceiptScan fails clearly when the bot URL is not configured", async () => {
  const userId = await seedUser(t, "proxy-unconfigured");
  vi.stubEnv("BUDGETBOSS_BOT_URL", "");
  vi.stubEnv("CONVEX_SYNC_SECRET", "");

  await expect(
    asUser(userId).action(api.receipts.proxyReceiptScan, {
      base64Image: "data:image/png;base64,abc",
      idempotencyKey: "proxy_unconfigured_1",
    }),
  ).rejects.toThrow(/Receipt bot is not configured/);
});

test("proxyReceiptScan sends the server-derived userId and never a client one", async () => {
  const userId = await seedUser(t, "proxy-user");
  vi.stubEnv("BUDGETBOSS_BOT_URL", "https://bot.example");
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");

  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, draftId: "draft_1", fields: {}, confidence: {}, evidence: {}, questions: [], lineItems: [], source: "app-camera" }),
  });
  vi.stubGlobal("fetch", mockFetch);

  const result = await asUser(userId).action(api.receipts.proxyReceiptScan, {
    base64Image: "data:image/png;base64,abc",
    idempotencyKey: "proxy_ok_1",
    countryHint: "ID",
  });

  expect(result).toEqual({ success: true, draftId: "draft_1", fields: {}, confidence: {}, evidence: {}, questions: [], lineItems: [], source: "app-camera" });

  const [url, init] = mockFetch.mock.calls[0];
  expect(url).toBe("https://bot.example/receipt/scan");
  expect(init.headers.Authorization).toBe("Bearer test-sync-secret");

  const sent = JSON.parse(init.body);
  expect(sent.userId).toBe(userId);
  expect(sent.countryHint).toBe("ID");
  expect(sent.idempotencyKey).toBe("proxy_ok_1");
});

test("proxyReceiptScan surfaces a bot HTTP failure instead of returning junk", async () => {
  const userId = await seedUser(t, "proxy-fail-user");
  vi.stubEnv("BUDGETBOSS_BOT_URL", "https://bot.example");
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => "upstream gemini error",
    }),
  );

  await expect(
    asUser(userId).action(api.receipts.proxyReceiptScan, {
      base64Image: "data:image/png;base64,abc",
      idempotencyKey: "proxy_fail_1",
    }),
  ).rejects.toThrow(/Receipt bot scan failed \(502\)/);
});
