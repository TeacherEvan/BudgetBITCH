/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
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
