/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
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
    const convexUserId = "user_xyz";

    const id = await t.run(async (ctx: any) =>
      ctx.db.insert("lineUsers", {
        lineUserId,
        userId: convexUserId,
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
