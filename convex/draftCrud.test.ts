// convex/receipts/draftCrud.test.ts
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

let t: ReturnType<typeof convexTest>;

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

function insertReceipt(t: ReturnType<typeof convexTest>, args: any) {
  return t.run(async (ctx: any) => ctx.db.insert("receipts", args));
}

const asUser = (userId: any) => t.withIdentity({ subject: userId });

describe("listReceipts - index-safe windowed pagination", () => {
  beforeEach(() => {
    t = convexTest(schema, modules);
  });

  it("(a) 200 newer app rows + 1 line draft at position 201 with {source:'line',status:'draft',limit:1} returns the line draft", async () => {
    const userId = await seedUser(t, "test");

    // Insert 1 line draft FIRST (older _creationTime, so it will be at the END of the desc index scan)
    const lineDraft = await insertReceipt(t, {
      userId,
      amount: 999,
      merchant: "Line Merchant",
      category: "food",
      parsedAt: Date.now() - 5000, // Older parsedAt
      source: "line",
      status: "draft",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1000,
      geminiModel: "gemini-2.5-flash",
    });

    // Insert 200 newer app receipts AFTER (newer _creationTime, so they will be at the START of the desc index scan)
    for (let i = 0; i < 200; i++) {
      await insertReceipt(t, {
        userId,
        amount: 10 + i,
        merchant: `App Merchant ${i}`,
        category: "food",
        parsedAt: Date.now() + 10000 - i, // Newer parsedAt
        source: "app",
        status: "draft",
        imageMimeType: "image/jpeg",
        imageSizeBytes: 1000,
        geminiModel: "gemini-2.5-flash",
      });
    }

    // Query with source:'line', status:'draft', limit:1
    // The line draft is at position 201 in the index scan (after 200 app receipts)
    // The original 200-window scan would miss it
    const result = await asUser(userId).query(api.receipts.draftCrud.listReceipts, {
      source: "line",
      status: "draft",
      limit: 1,
    });

    expect(result.receipts).toHaveLength(1);
    expect(result.receipts[0]._id).toEqual(lineDraft);
    expect(result.receipts[0].source).toBe("line");
    expect(result.receipts[0].merchant).toBe("Line Merchant");
    expect(result.truncated).toBeUndefined(); // Not truncated, we found the match
  });

  it("(b) limit:1 cursor walks 3 rows in order with nextCursor", async () => {
    const userId = await seedUser(t, "test2");

    // Insert 3 receipts with different timestamps
    const r1 = await insertReceipt(t, {
      userId,
      amount: 100,
      merchant: "Receipt 1",
      category: "food",
      parsedAt: 1000,
      source: "app",
      status: "draft",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1000,
      geminiModel: "gemini-2.5-flash",
    });

    const r2 = await insertReceipt(t, {
      userId,
      amount: 200,
      merchant: "Receipt 2",
      category: "food",
      parsedAt: 2000,
      source: "app",
      status: "draft",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1000,
      geminiModel: "gemini-2.5-flash",
    });

    const r3 = await insertReceipt(t, {
      userId,
      amount: 300,
      merchant: "Receipt 3",
      category: "food",
      parsedAt: 3000,
      source: "app",
      status: "draft",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1000,
      geminiModel: "gemini-2.5-flash",
    });

    // First page - limit:1, no cursor (should get newest: r3)
    const page1 = await asUser(userId).query(api.receipts.draftCrud.listReceipts, {
      limit: 1,
    });
    expect(page1.receipts).toHaveLength(1);
    expect(page1.receipts[0]._id).toEqual(r3);
    expect(page1.nextCursor).toBe("3000");
    expect(page1.truncated).toBeUndefined();

    // Second page - cursor from page1 (should get r2)
    const page2 = await asUser(userId).query(api.receipts.draftCrud.listReceipts, {
      limit: 1,
      cursor: page1.nextCursor ?? undefined,
    });
    expect(page2.receipts).toHaveLength(1);
    expect(page2.receipts[0]._id).toEqual(r2);
    expect(page2.nextCursor).toBe("2000");
    expect(page2.truncated).toBeUndefined();

    // Third page - cursor from page2 (should get r1)
    const page3 = await asUser(userId).query(api.receipts.draftCrud.listReceipts, {
      limit: 1,
      cursor: page2.nextCursor ?? undefined,
    });
    expect(page3.receipts).toHaveLength(1);
    expect(page3.receipts[0]._id).toEqual(r1);
    expect(page3.nextCursor).toBeNull();
    expect(page3.truncated).toBeUndefined();
  });

  it("(c) a row with missing source matches source:'app'", async () => {
    const userId = await seedUser(t, "test3");

    // Insert receipt with NO source field (missing)
    const receiptNoSource = await insertReceipt(t, {
      userId,
      amount: 100,
      merchant: "No Source Merchant",
      category: "food",
      parsedAt: Date.now(),
      // source is omitted
      status: "draft",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1000,
      geminiModel: "gemini-2.5-flash",
    });

    // Insert receipt with explicit source: "app"
    const receiptApp = await insertReceipt(t, {
      userId,
      amount: 200,
      merchant: "App Merchant",
      category: "food",
      parsedAt: Date.now() - 1000,
      source: "app",
      status: "draft",
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1000,
      geminiModel: "gemini-2.5-flash",
    });

    // Query with source:'app' - should match both
    const result = await asUser(userId).query(api.receipts.draftCrud.listReceipts, {
      source: "app",
      limit: 10,
    });

    expect(result.receipts).toHaveLength(2);
    const merchantNames = result.receipts.map(r => r.merchant).sort();
    expect(merchantNames).toEqual(["App Merchant", "No Source Merchant"]);
    expect(result.truncated).toBeUndefined();
  });

  it("(d) 1100-row adversarial → truncated:true, not silently null", async () => {
    const userId = await seedUser(t, "test4");

    // Insert 50 matching receipts with source="app" FIRST (oldest _creationTime)
    // These will be at the END of the desc index scan
    for (let i = 0; i < 50; i++) {
      await insertReceipt(t, {
        userId,
        amount: 10000 + i,
        merchant: `Match ${i}`,
        category: "food",
        parsedAt: 5000 + i,
        source: "app", // Matches filter
        status: "draft",
        imageMimeType: "image/jpeg",
        imageSizeBytes: 1000,
        geminiModel: "gemini-2.5-flash",
      });
    }

    // Insert 950 "noise" receipts with source="line" (won't match source="app" filter)
    // These will be at the START of the desc index scan (newer _creationTime)
    // Total = 1000 items. We'll scan all 1000 to find the 50 matches at the end.
    for (let i = 0; i < 950; i++) {
      await insertReceipt(t, {
        userId,
        amount: i,
        merchant: `Noise ${i}`,
        category: "food",
        parsedAt: 1000 + i,
        source: "line", // Different source - won't match
        status: "draft",
        imageMimeType: "image/jpeg",
        imageSizeBytes: 1000,
        geminiModel: "gemini-2.5-flash",
      });
    }

    // Query with source:"app", limit:50 - must scan through 950 noise items to find 50 matches
    // This will hit maxTotalScan (1000) exactly after finding all 50 matches
    const result = await asUser(userId).query(api.receipts.draftCrud.listReceipts, {
      source: "app",
      limit: 50,
    });

    // Should return all 50 matches but indicate truncation because we hit scan limit
    expect(result.receipts.length).toBe(50);
    expect(result.nextCursor).toBeNull();
    expect(result.truncated).toBe(true);
    
    // All returned receipts should have source="app"
    for (const r of result.receipts) {
      expect(r.source).toBe("app");
    }
  });
});