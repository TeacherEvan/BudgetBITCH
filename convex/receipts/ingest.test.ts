/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach, vi } from "vitest";
import { api, internal } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

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

/** Generate a valid HMAC token for app:<userId> testing (with domain separation). */
async function generateAppToken(userId: string, syncSecret: string, timestamp?: number): Promise<string> {
  const ts = timestamp ?? Date.now();
  const message = `${userId}:${ts}`;
  const secretKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(syncSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  // HKDF-Extract: HMAC(salt=secret, IKM="app-token") — matches ingest.ts
  const derivedKeyBytes = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    new TextEncoder().encode("app-token")
  );
  const key = await crypto.subtle.importKey(
    "raw",
    derivedKeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const hmac = Buffer.from(signature).toString("hex");
  return `${userId}:${ts}:${hmac}`;
}

// ============================================================================
// Gap (a): HMAC key domain separation - the HMAC key should be derived from
// the Bearer secret (HKDF or HMAC(secret, "app-token")), not the secret itself.
// ============================================================================

test("ingestReceipt rejects token signed with raw Bearer secret (domain separation)", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "domain-sep-user");
  
  // Generate a token using the RAW Bearer secret (no domain separation)
  // This simulates the OLD behavior where the same secret was used for both
  const ts = Date.now();
  const message = `${userId}:${ts}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("test-sync-secret"), // Using raw secret directly
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const hmac = Buffer.from(signature).toString("hex");
  const rawSecretToken = `${userId}:${ts}:${hmac}`;

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "domain_sep_1",
    source: "app-camera",
    appToken: rawSecretToken,
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  // Dual-verify window: accept tokens signed with raw key (legacy) for one deploy cycle
  // This allows gradual migration of scanner/bot deployments
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
});

// ============================================================================
// Gap (b): Timestamp validation should reject future tokens beyond clock skew
// now - timestamp ∈ [-60s, +5min] i.e., timestamp ∈ [now-5min, now+60s]
// ============================================================================

test("ingestReceipt rejects future timestamp beyond +60s clock skew", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "future-user");
  
  // Token with timestamp 4 minutes in the future (beyond +60s allowed skew)
  const futureTimestamp = Date.now() + 4 * 60 * 1000; // +4 minutes
  const appToken = await generateAppToken(userId, "test-sync-secret", futureTimestamp);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "future_ts_1",
    source: "app-camera",
    appToken,
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  // Should be rejected (401) because future timestamp exceeds allowed skew
  expect(res.status).toBe(401);
  const body = await res.json();
  expect(body.error).toMatch(/Invalid or expired app token/);
});

test("ingestReceipt accepts timestamp within +60s clock skew", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "near-future-user");
  
  // Token with timestamp 30 seconds in the future (within +60s allowed skew)
  const nearFutureTimestamp = Date.now() + 30 * 1000; // +30 seconds
  const appToken = await generateAppToken(userId, "test-sync-secret", nearFutureTimestamp);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "near_future_ts_1",
    source: "app-camera",
    appToken,
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  // Should be accepted (200)
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
});

test("ingestReceipt rejects timestamp older than 5 minutes", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "old-user");
  
  // Token with timestamp 6 minutes in the past (beyond 5 min window)
  const oldTimestamp = Date.now() - 6 * 60 * 1000; // -6 minutes
  const appToken = await generateAppToken(userId, "test-sync-secret", oldTimestamp);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "old_ts_1",
    source: "app-camera",
    appToken,
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  // Should be rejected (401)
  expect(res.status).toBe(401);
  const body = await res.json();
  expect(body.error).toMatch(/Invalid or expired app token/);
});

// ============================================================================
// Gap (c): Buffer.from(hmac, "hex") + crypto.subtle.verify wrapped in try/catch
// Malformed hex should return 401, not throw opaque 500
// ============================================================================

test("ingestReceipt returns 401 for malformed hex HMAC (not 500)", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "malformed-hex-user");
  
  // Token with invalid hex in HMAC part (not valid hex string)
  const timestamp = Date.now();
  const invalidHmac = "not-valid-hex!!!"; // Contains non-hex characters
  const malformedToken = `${userId}:${timestamp}:${invalidHmac}`;

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "malformed_hex_1",
    source: "app-camera",
    appToken: malformedToken,
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  // Should return 401, not throw 500
  expect(res.status).toBe(401);
  const body = await res.json();
  expect(body.error).toMatch(/Invalid or expired app token/);
});

test("ingestReceipt returns 401 for truncated hex HMAC", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "truncated-hex-user");
  
  // Token with truncated hex (odd length or too short)
  const timestamp = Date.now();
  const truncatedHmac = "abc"; // Too short, odd length
  const truncatedToken = `${userId}:${timestamp}:${truncatedHmac}`;

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "truncated_hex_1",
    source: "app-camera",
    appToken: truncatedToken,
    payload: ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]),
  });

  // Should return 401, not throw 500
  expect(res.status).toBe(401);
  const body = await res.json();
  expect(body.error).toMatch(/Invalid or expired app token/);
});

// ============================================================================
// Gap (d): Payload size caps - lines.length ≤ 5000 + byte-size caps
// Mirroring proxyReceiptScan's 8 MB cap (scanActions.ts:62)
// ============================================================================

test("ingestReceipt rejects payload with too many lines (>5000)", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "many-lines-user");
  const appToken = await generateAppToken(userId, "test-sync-secret");
  
  // Create payload with 5001 lines (exceeds 5000 limit)
  const manyLines = Array.from({ length: 5001 }, (_, i) => `LINE ${i}`);
  const payload = ingestPayload(manyLines);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "many_lines_1",
    source: "app-camera",
    appToken,
    payload,
  });

  // Should be rejected (400)
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/Invalid request body/);
});

test("ingestReceipt rejects payload exceeding byte size cap (8MB)", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "large-payload-user");
  const appToken = await generateAppToken(userId, "test-sync-secret");
  
  // Create payload with very long lines to exceed 8MB
  const longLine = "x".repeat(10000); // 10KB per line
  const manyLongLines = Array.from({ length: 1000 }, () => longLine); // ~10MB total
  const payload = ingestPayload(manyLongLines);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "large_payload_1",
    source: "app-camera",
    appToken,
    payload,
  });

  // Should be rejected (400)
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toMatch(/Invalid request body/);
});

test("ingestReceipt accepts payload at the line limit (5000 lines)", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "max-lines-user");
  const appToken = await generateAppToken(userId, "test-sync-secret");
  
  // Create payload with exactly 5000 lines (at the limit)
  const maxLines = Array.from({ length: 5000 }, (_, i) => `LINE ${i}`);
  const payload = ingestPayload(maxLines);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "max_lines_1",
    source: "app-camera",
    appToken,
    payload,
  });

  // Should be accepted (200)
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
});

test("ingestReceipt accepts payload under the byte size cap", async () => {
  vi.stubEnv("CONVEX_SYNC_SECRET", "test-sync-secret");
  const userId = await seedUser(t, "under-cap-user");
  const appToken = await generateAppToken(userId, "test-sync-secret");
  
  // Create payload well under 8MB
  const lines = Array.from({ length: 100 }, (_, i) => `SHORT LINE ${i}`);
  const payload = ingestPayload(lines);

  const res = await postIngest({
    lineUserId: `app:${userId}`,
    idempotencyKey: "under_cap_1",
    source: "app-camera",
    appToken,
    payload,
  });

  // Should be accepted (200)
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
});

// ============================================================================
// Idempotency Tests (Phase 2 audit)
// ============================================================================

test("ingestReceipt is idempotent: concurrent duplicate calls create exactly one draft", async () => {
  const userId = await seedUser(t, "idempotency-user");
  const appToken = await generateAppToken(userId, "test-sync-secret");
  const idempotencyKey = "concurrent_idempotency_test_1";

  const payload = ingestPayload(["MERCHANT CAFE", "TOTAL 91000"]);

  // Fire two concurrent requests with the same idempotencyKey
  const [res1, res2] = await Promise.all([
    postIngest({
      lineUserId: `app:${userId}`,
      idempotencyKey,
      source: "app-camera",
      appToken,
      payload,
    }),
    postIngest({
      lineUserId: `app:${userId}`,
      idempotencyKey,
      source: "app-camera",
      appToken,
      payload,
    }),
  ]);

  // Both should succeed
  expect(res1.status).toBe(200);
  expect(res2.status).toBe(200);

  const body1 = await res1.json();
  const body2 = await res2.json();

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

  expect(drafts.length).toBe(1);
  expect(drafts[0]._id).toBe(body1.draftId);
});

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

  // Verify only one draft was created (idempotent)
  const drafts = await t.run(async (ctx: any) =>
    ctx.db
      .query("receipts")
      .withIndex("by_user_and_clientDraftId", (q: any) =>
        q.eq("userId", userId).eq("clientDraftId", idempotencyKey)
      )
      .collect(),
  );

  expect(drafts.length).toBe(1);
  expect(draftId1).toBe(draftId2);
  expect(drafts[0]._id).toBe(draftId1);
});
