/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach, vi } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob(["../**/*.ts", "../_generated/**/*.ts"]);

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

let t: ReturnType<typeof convexTest>;

beforeEach(() => {
  t = convexTest(schema, modules);
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");
});

/** Generate a valid HMAC token for app:<userId> testing. */
async function generateAppToken(userId: string, syncSecret: string, timestamp?: number): Promise<string> {
  const ts = timestamp ?? Date.now();
  const message = `${userId}:${ts}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(syncSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const hmac = Buffer.from(signature).toString("hex");
  return `${userId}:${ts}:${hmac}`;
}

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

async function postIngest(t: ReturnType<typeof convexTest>, body: unknown, token = "test-sync-secret") {
  return t.fetch("/receipts/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

test("ingestReceipt is idempotent: concurrent duplicate calls create exactly one draft", async () => {
  const userId = await seedUser(t, "idempotency-user");
  const appToken = await generateAppToken(userId, "test-sync-secret");
  const idempotencyKey = "concurrent_idempotency_test_1";

  const payload = ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]);

  // Fire two concurrent requests with the same idempotencyKey
  const startTime = Date.now();
  const [res1, res2] = await Promise.all([
    postIngest(t, {
      lineUserId: `app:${userId}`,
      idempotencyKey,
      source: "app-camera",
      appToken,
      payload,
    }),
    postIngest(t, {
      lineUserId: `app:${userId}`,
      idempotencyKey,
      source: "app-camera",
      appToken,
      payload,
    }),
  ]);
  const endTime = Date.now();
  console.log(`Concurrent requests completed in ${endTime - startTime}ms`);

  // Both should succeed
  expect(res1.status).toBe(200);
  expect(res2.status).toBe(200);

  const body1 = await res1.json();
  const body2 = await res2.json();

  console.log("body1.draftId:", body1.draftId);
  console.log("body2.draftId:", body2.draftId);

  // Both should return the same draftId (exactly one draft created)
  expect(body1.success).toBe(true);
  expect(body2.success).toBe(true);
  expect(body1.draftId).toBe(body2.draftId);

  // Verify only one draft exists in the database
  const drafts = await t.run(async (ctx: any) =>
    ctx.db
      .query("receipts")
      .withIndex("by_user_and_clientDraftId", (q: any) =>
        q.eq("userId", userId).eq("clientDraftId", idempotencyKey)
      )
      .collect(),
  );

  console.log("Total drafts in DB:", drafts.length);
  expect(drafts.length).toBe(1);
  expect(drafts[0]._id).toBe(body1.draftId);
});

// Test to demonstrate the race condition in saveReceipt mutation directly
test("saveReceipt race condition: concurrent calls with same clientDraftId create duplicate drafts", async () => {
  const userId = await seedUser(t, "race-condition-user");
  const idempotencyKey = "race_condition_test_1";

  // Call saveReceipt mutation directly twice concurrently
  const [draftId1, draftId2] = await Promise.all([
    t.mutation(internal.receipts.saveReceipt, {
      userId,
      amount: 100,
      merchant: "TEST MERCHANT",
      category: "food",
      parsedAt: Date.now(),
      geminiModel: "scraper-bot",
      imageMimeType: "application/json",
      imageSizeBytes: 0,
      clientDraftId: idempotencyKey,
      engine: "scraper-bot",
      confidence: 0.9,
      status: "draft",
      source: "app-camera",
    }),
    t.mutation(internal.receipts.saveReceipt, {
      userId,
      amount: 200,
      merchant: "TEST MERCHANT 2",
      category: "food",
      parsedAt: Date.now(),
      geminiModel: "scraper-bot",
      imageMimeType: "application/json",
      imageSizeBytes: 0,
      clientDraftId: idempotencyKey,
      engine: "scraper-bot",
      confidence: 0.9,
      status: "draft",
      source: "app-camera",
    }),
  ]);

  console.log("draftId1:", draftId1);
  console.log("draftId2:", draftId2);

  // Verify two drafts were created (demonstrating the race condition)
  const drafts = await t.run(async (ctx: any) =>
    ctx.db
      .query("receipts")
      .withIndex("by_user_and_clientDraftId", (q: any) =>
        q.eq("userId", userId).eq("clientDraftId", idempotencyKey)
      )
      .collect(),
  );

  console.log("Total drafts in DB:", drafts.length);
  // This should be 2 with the current buggy implementation
  expect(drafts.length).toBe(2);
  expect(draftId1).not.toBe(draftId2);
});

// Test that saveReceiptIdempotent prevents duplicate drafts under concurrency
test("saveReceiptIdempotent is idempotent: concurrent calls with same clientDraftId create exactly one draft", async () => {
  const userId = await seedUser(t, "idempotent-user");
  const idempotencyKey = "idempotent_test_1";

  // Call saveReceiptIdempotent mutation directly twice concurrently
  const [draftId1, draftId2] = await Promise.all([
    t.mutation(internal.receipts.saveReceiptIdempotent, {
      userId,
      amount: 100,
      merchant: "TEST MERCHANT",
      category: "food",
      parsedAt: Date.now(),
      geminiModel: "scraper-bot",
      imageMimeType: "application/json",
      imageSizeBytes: 0,
      clientDraftId: idempotencyKey,
      engine: "scraper-bot",
      confidence: 0.9,
      status: "draft",
      source: "app-camera",
    }),
    t.mutation(internal.receipts.saveReceiptIdempotent, {
      userId,
      amount: 200,
      merchant: "TEST MERCHANT 2",
      category: "food",
      parsedAt: Date.now(),
      geminiModel: "scraper-bot",
      imageMimeType: "application/json",
      imageSizeBytes: 0,
      clientDraftId: idempotencyKey,
      engine: "scraper-bot",
      confidence: 0.9,
      status: "draft",
      source: "app-camera",
    }),
  ]);

  console.log("draftId1:", draftId1);
  console.log("draftId2:", draftId2);

  // Verify only one draft was created (idempotent)
  const drafts = await t.run(async (ctx: any) =>
    ctx.db
      .query("receipts")
      .withIndex("by_user_and_clientDraftId", (q: any) =>
        q.eq("userId", userId).eq("clientDraftId", idempotencyKey)
      )
      .collect(),
  );

  console.log("Total drafts in DB:", drafts.length);
  expect(drafts.length).toBe(1);
  expect(draftId1).toBe(draftId2);
  expect(drafts[0]._id).toBe(draftId1);
});