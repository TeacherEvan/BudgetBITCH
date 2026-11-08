/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

describe("schema: LINE receipt-bot (Task 1)", () => {
  it("has lineUsers table with by_lineUserId index and receipts.source field", () => {
    const t = convexTest(schema, modules);
    // Schema compiles ⇒ types valid. Real read/write roundtrips below.
    expect(t).toBeDefined();
  });

  it("roundtrips a lineUsers mapping via by_lineUserId index", async () => {
    const t = convexTest(schema, modules);
    const lineUserId = "Uabc123";
    const seededId = await seedUser(t, "line-map-user");
    const convexUserId = seededId as unknown as string;

    const id = await t.run(async (ctx: any) =>
      ctx.db.insert("lineUsers", {
        lineUserId,
        userId: seededId,
        accountId: undefined,
        linkedAt: 1_700_000_000_000,
      }),
    );
    expect(id).toBeDefined();

    const found = await t.run(async (ctx: any) =>
      ctx.db
        .query("lineUsers")
        .withIndex("by_lineUserId", (q: any) =>
          q.eq("lineUserId", lineUserId),
        )
        .unique(),
    );
    expect(found).not.toBeNull();
    expect(found.lineUserId).toBe(lineUserId);
    expect(found.userId).toBe(convexUserId);
    expect(found.accountId).toBeUndefined();
    void convexUserId;
  });

  it("roundtrips a receipt with the source field", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t, "line-source-user");

    const receiptId = await t.run(async (ctx: any) =>
      ctx.db.insert("receipts", {
        userId,
        amount: 12.5,
        merchant: "LINE Test Mart",
        category: "food",
        imageMimeType: "image/jpeg",
        imageSizeBytes: 1234,
        parsedAt: 1_700_000_000_000,
        geminiModel: "gemini-2.5-flash",
        source: "line",
      }),
    );
    expect(receiptId).toBeDefined();

    const receipt = await t.run(async (ctx: any) =>
      ctx.db.get(receiptId),
    );
    expect(receipt?.source).toBe("line");
  });
});

// Identity-mapping layer (Task 2): linkLineAccount mutation + getConvexUserByLineId resolver.
describe("line identity mapping (Task 2)", () => {
  const newTest = () => convexTest(schema, import.meta.glob("./**/*.ts"));
  const asUser = (userId: any) => (t: ReturnType<typeof convexTest>) =>
    t.withIdentity({ subject: userId });

  it("Test A: authed user can link and resolver returns the mapped userId", async () => {
    const t = newTest();
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "x@y.z" }),
    );

    const lineDocId = await asUser(userId)(t).mutation(
      api.line.linkLineAccount,
      { lineUserId: "U1" },
    );
    expect(typeof lineDocId).toBe("string");

    const resolved = await t.query(internal.line.getConvexUserByLineId, {
      lineUserId: "U1",
    });
    expect(resolved).toBe(userId);
  });

  it("Test B: unauthenticated linkLineAccount rejects with Authentication required", async () => {
    const t = newTest();
    await expect(
      t.mutation(api.line.linkLineAccount, { lineUserId: "U1" }),
    ).rejects.toThrow(/Authentication required/);
  });

  it("Test C: re-linking the same lineUserId upserts instead of duplicating", async () => {
    const t = newTest();
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "x@y.z" }),
    );

    await asUser(userId)(t).mutation(api.line.linkLineAccount, {
      lineUserId: "U1",
      accountId: "acc-1",
    });
    await asUser(userId)(t).mutation(api.line.linkLineAccount, {
      lineUserId: "U1",
      accountId: "acc-2",
    });

    const rows = await t.run(async (ctx: any) =>
      ctx.db.query("lineUsers").collect(),
    );
    const forU1 = rows.filter((r: any) => r.lineUserId === "U1");
    expect(forU1).toHaveLength(1);
    expect(forU1[0].accountId).toBe("acc-2");
  });

  it("Test D: linking an already-linked lineUserId by another user is rejected (anti-hijack)", async () => {
    const t = newTest();
    const aliceId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "alice@y.z" }),
    );
    const bobId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "bob@y.z" }),
    );

    // Alice links her LINE account
    await asUser(aliceId)(t).mutation(api.line.linkLineAccount, {
      lineUserId: "LINE_ALICE",
      accountId: "acc-alice",
    });

    // Bob tries to link Alice's LINE account -> must throw
    await expect(
      asUser(bobId)(t).mutation(api.line.linkLineAccount, {
        lineUserId: "LINE_ALICE",
        accountId: "acc-bob",
      }),
    ).rejects.toThrow("already linked to another user");

    // Verify mapping is still owned by Alice
    const resolvedOwner = await t.query(internal.line.getConvexUserByLineId, {
      lineUserId: "LINE_ALICE",
    });
    expect(resolvedOwner).toBe(aliceId);
  });
});

// Webhook ingestion (Task 4): verifies signature, fetches the image, resolves
// the owner, and persists a receipt tagged source:"line".
describe("line webhook (Task 4)", () => {
  const newTest = () => convexTest(schema, import.meta.glob("./**/*.ts"));

  it("verifies signature, ingests image for a linked user, and tags source:'line'", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "secret");
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "token");
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");

    const t = newTest();
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "hook@y.z" }),
    );
    await t.run(async (ctx: any) =>
      ctx.db.insert("lineUsers", {
        lineUserId: "Uhook",
        userId,
        accountId: undefined,
        linkedAt: 1_700_000_000_000,
      }),
    );

    const body = JSON.stringify({
      events: [
        {
          type: "message",
          message: { type: "image", id: "MSG1" },
          source: { userId: "Uhook" },
        },
      ],
    });
    const sig = crypto
      .createHmac("sha256", "secret")
      .update(body)
      .digest("base64");

    const fakeImage = Buffer.from("fakebytes").toString("base64");
    vi.stubGlobal("fetch", (async (url: any, init?: any) => {
      const u = String(url);
      if (u.includes("api-data.line.me") && u.includes("content")) {
        return new Response(Buffer.from(fakeImage, "base64"), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        });
      }
      if (u.includes("generativelanguage.googleapis.com")) {
        return new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: JSON.stringify({
                amount: 42.0, merchant: "Hook Mart", category: "food", date: "2026-07-21",
              }) }] } },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    }) as any);

    const res = await t.fetch("/line/webhook", {
      method: "POST",
      headers: { "x-line-signature": sig },
      body,
    });
    expect(res.status).toBe(200);

    const receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].source).toBe("line");
    expect(receipts[0].merchant).toBe("Hook Mart");
    expect(receipts[0].userId).toBe(userId);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("rejects a webhook with an invalid signature without ingesting", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "secret");
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "");
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");

    const t = newTest();
    const body = JSON.stringify({ events: [] });
    const res = await t.fetch("/line/webhook", {
      method: "POST",
      headers: { "x-line-signature": "totally-wrong=" },
      body,
    });
    expect(res.status).toBe(200);

    const receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(0);

    vi.unstubAllEnvs();
  });

  it("does not commit idempotency on upstream 500 error, allowing retry to succeed, then deduplicates", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "secret");
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "token");
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");

    const t = newTest();
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "retry-user@test.org" }),
    );
    await t.run(async (ctx: any) =>
      ctx.db.insert("lineUsers", {
        lineUserId: "Uretry",
        userId,
        accountId: undefined,
        linkedAt: 1_700_000_000_000,
      }),
    );

    const body = JSON.stringify({
      events: [
        {
          type: "message",
          message: { type: "image", id: "MSG-RETRY-1" },
          source: { userId: "Uretry" },
        },
      ],
    });
    const sig = crypto
      .createHmac("sha256", "secret")
      .update(body)
      .digest("base64");

    const fakeImage = Buffer.from("fakebytes").toString("base64");
    let callCount = 0;
    let failFirstAttempt = true;

    vi.stubGlobal("fetch", (async (url: any) => {
      const u = String(url);
      callCount++;
      if (u.includes("api-data.line.me") && u.includes("content")) {
        if (failFirstAttempt) {
          // Upstream transient 500 error on first try
          return new Response("LINE internal error", { status: 500 });
        }
        return new Response(Buffer.from(fakeImage, "base64"), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        });
      }
      if (u.includes("generativelanguage.googleapis.com")) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        amount: 99.0,
                        merchant: "Retry Cafe",
                        category: "food",
                        date: "2026-08-01",
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
      return new Response("{}", { status: 200 });
    }) as any);

    // Delivery 1: upstream failure
    const headers = {
      "x-line-signature": sig,
      "x-line-delivery-id": "DELIV-RETRY-123",
    };
    const res1 = await t.fetch("/line/webhook", {
      method: "POST",
      headers,
      body,
    });
    expect(res1.status).toBe(200);

    // Assert 0 receipts were ingested on failure
    let receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(0);

    // Delivery 2: retry after upstream recovers
    failFirstAttempt = false;
    const res2 = await t.fetch("/line/webhook", {
      method: "POST",
      headers,
      body,
    });
    expect(res2.status).toBe(200);

    // Assert receipt ingested on successful retry
    receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].merchant).toBe("Retry Cafe");

    // Delivery 3: exact duplicate delivery with same delivery ID
    const countBeforeDup = callCount;
    const res3 = await t.fetch("/line/webhook", {
      method: "POST",
      headers,
      body,
    });
    expect(res3.status).toBe(200);

    // Assert duplicate was suppressed (no new receipts, no additional upstream fetch calls)
    receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(1);
    expect(callCount).toBe(countBeforeDup);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

// Idempotency per-message-id (Task 1): guards against concurrent retries
// re-ingesting the same message multiple times when multiple events are in a payload.
describe("line webhook per-message-id idempotency (Task 1)", () => {
  const newTest = () => convexTest(schema, import.meta.glob("./**/*.ts"));

  it("concurrent duplicate webhook calls with same messageId create exactly one receipt", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "secret");
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "token");
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");

    const t = newTest();
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "idempotent-user@test.org" }),
    );
    await t.run(async (ctx: any) =>
      ctx.db.insert("lineUsers", {
        lineUserId: "Uidempotent",
        userId,
        accountId: undefined,
        linkedAt: 1_700_000_000_000,
      }),
    );

    // Single event with a specific messageId
    const body = JSON.stringify({
      events: [
        {
          type: "message",
          message: { type: "image", id: "MSG-IDEMPOTENT-123" },
          source: { userId: "Uidempotent" },
        },
      ],
    });
    const sig = crypto
      .createHmac("sha256", "secret")
      .update(body)
      .digest("base64");

    const fakeImage = Buffer.from("fakebytes").toString("base64");
    let geminiCallCount = 0;

    vi.stubGlobal("fetch", (async (url: any) => {
      const u = String(url);
      if (u.includes("api-data.line.me") && u.includes("content")) {
        await new Promise((r) => setTimeout(r, 25));
        return new Response(Buffer.from(fakeImage, "base64"), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        });
      }
      if (u.includes("generativelanguage.googleapis.com")) {
        await new Promise((r) => setTimeout(r, 25));
        geminiCallCount++;
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        amount: 55.0,
                        merchant: "Idempotent Store",
                        category: "food",
                        date: "2026-09-01",
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
      return new Response("{}", { status: 200 });
    }) as any);

    // Fire two concurrent duplicate webhook calls with the same messageId
    // but different delivery IDs (simulating LINE retry with new delivery ID)
    const [res1, res2] = await Promise.all([
      t.fetch("/line/webhook", {
        method: "POST",
        headers: { "x-line-signature": sig, "x-line-delivery-id": "DELIV-1" },
        body,
      }),
      t.fetch("/line/webhook", {
        method: "POST",
        headers: { "x-line-signature": sig, "x-line-delivery-id": "DELIV-2" },
        body,
      }),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Assert exactly one receipt was created
    const receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].merchant).toBe("Idempotent Store");

    // Assert Gemini was only called once (no duplicate parsing)
    expect(geminiCallCount).toBe(1);

    // Assert processedWebhooks has exactly one entry for this messageId
    const processed = await t.run(async (ctx: any) =>
      ctx.db.query("processedWebhooks").collect(),
    );
    expect(processed).toHaveLength(1);
    expect(processed[0].webhookEventId).toBe("msg:MSG-IDEMPOTENT-123");

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("multiple events in one payload: failure of one event doesn't cause re-ingestion of siblings on retry", async () => {
    vi.stubEnv("LINE_CHANNEL_SECRET", "secret");
    vi.stubEnv("LINE_CHANNEL_ACCESS_TOKEN", "token");
    vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");

    const t = newTest();
    const userId = await t.run(async (ctx: any) =>
      ctx.db.insert("users", { email: "sibling-user@test.org" }),
    );
    await t.run(async (ctx: any) =>
      ctx.db.insert("lineUsers", {
        lineUserId: "Usibling",
        userId,
        accountId: undefined,
        linkedAt: 1_700_000_000_000,
      }),
    );

    // Two events in one payload
    const body = JSON.stringify({
      events: [
        {
          type: "message",
          message: { type: "image", id: "MSG-SIBLING-1" },
          source: { userId: "Usibling" },
        },
        {
          type: "message",
          message: { type: "image", id: "MSG-SIBLING-2" },
          source: { userId: "Usibling" },
        },
      ],
    });
    const sig = crypto
      .createHmac("sha256", "secret")
      .update(body)
      .digest("base64");

    const fakeImage = Buffer.from("fakebytes").toString("base64");
    let contentFetchCalls = 0;
    let geminiCalls = 0;
    let failSecondEvent = true;

    vi.stubGlobal("fetch", (async (url: any) => {
      const u = String(url);
      if (u.includes("api-data.line.me") && u.includes("content")) {
        contentFetchCalls++;
        return new Response(Buffer.from(fakeImage, "base64"), {
          status: 200,
          headers: { "content-type": "image/jpeg" },
        });
      }
      if (u.includes("generativelanguage.googleapis.com")) {
        geminiCalls++;
        if (failSecondEvent && geminiCalls === 2) {
          // Fail the second event's parsing on first attempt
          failSecondEvent = false;
          return new Response("Gemini internal error", { status: 500 });
        }
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        amount: geminiCalls === 1 ? 10.0 : 20.0,
                        merchant: geminiCalls === 1 ? "Sibling Store 1" : "Sibling Store 2",
                        category: "food",
                        date: "2026-09-01",
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
      return new Response("{}", { status: 200 });
    }) as any);

    // First delivery: second event fails during parsing
    const headers1 = {
      "x-line-signature": sig,
      "x-line-delivery-id": "DELIV-SIBLING-1",
    };
    const res1 = await t.fetch("/line/webhook", {
      method: "POST",
      headers: headers1,
      body,
    });
    expect(res1.status).toBe(200);

    // Check state after first delivery: only first event should be ingested
    let receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].merchant).toBe("Sibling Store 1");

    // Second delivery (retry): both events come again, but first should be deduplicated
    const headers2 = {
      "x-line-signature": sig,
      "x-line-delivery-id": "DELIV-SIBLING-2",
    };
    const res2 = await t.fetch("/line/webhook", {
      method: "POST",
      headers: headers2,
      body,
    });
    expect(res2.status).toBe(200);

    // Check state after retry: both events should now be ingested exactly once
    receipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").collect(),
    );
    expect(receipts).toHaveLength(2);
    const merchants = receipts.map((r: any) => r.merchant).sort();
    expect(merchants).toEqual(["Sibling Store 1", "Sibling Store 2"]);

    // Verify processedWebhooks has two entries (one per messageId)
    const processed = await t.run(async (ctx: any) =>
      ctx.db.query("processedWebhooks").collect(),
    );
    expect(processed).toHaveLength(2);
    const eventIds = processed.map((p: any) => p.webhookEventId).sort();
    expect(eventIds).toEqual(["msg:MSG-SIBLING-1", "msg:MSG-SIBLING-2"]);

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});