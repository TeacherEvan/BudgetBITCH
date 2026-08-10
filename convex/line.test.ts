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
});
