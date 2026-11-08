/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

describe("upsertDailySnapshot idempotency", () => {
  let t: ReturnType<typeof convexTest>;
  let userId: any;
  const asUser = (userId: any) => t.withIdentity({ subject: userId });

  beforeEach(async () => {
    t = convexTest(schema, modules);
    userId = await seedUser(t, "test-user");
  });

  it("creates exactly one snapshot when two concurrent upserts race for the same day", async () => {
    // Create two parallel mutation calls with the same user and date
    const args = {
      accountId: "test-account",
      wizardProfile: { version: 1 },
      totals: { income: 1000, expenses: 500, savings: 500 },
      criticalExpenseCommitment: {
        expenseKey: "rent",
        estimatedMonthlyCost: 1000,
        status: "active",
        compoundProjection: { oneYear: 12000, fiveYears: 60000, tenYears: 120000 },
      },
      fullBackupData: null,
      storeCounts: { expenses: 10, incomes: 5 },
    };

    // Fire two concurrent upserts
    const [result1, result2] = await Promise.all([
      asUser(userId).mutation(api.snapshots.upsertDailySnapshot, args),
      asUser(userId).mutation(api.snapshots.upsertDailySnapshot, args),
    ]);

    // Both should return success
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Query the database to count snapshots for this user/date
    const today = new Date().toISOString().split("T")[0];
    const snapshots = await asUser(userId).query(api.snapshots.listCloudSnapshots, {});

    // Should have exactly ONE snapshot for today
    const todaySnapshots = snapshots.filter((s: any) => s.date === today);
    expect(todaySnapshots.length).toBe(1);
    
    // One should be created, one should be updated
    const createdCount = [result1, result2].filter(r => r.created).length;
    const updatedCount = [result1, result2].filter(r => r.updated).length;
    expect(createdCount).toBe(1);
    expect(updatedCount).toBe(1);
  });

  it("returns updated=true for the second upsert when first already created", async () => {
    const args = {
      accountId: "test-account",
      wizardProfile: { version: 1 },
      totals: { income: 1000, expenses: 500, savings: 500 },
      criticalExpenseCommitment: {
        expenseKey: "rent",
        estimatedMonthlyCost: 1000,
        status: "active",
        compoundProjection: { oneYear: 12000, fiveYears: 60000, tenYears: 120000 },
      },
      fullBackupData: null,
      storeCounts: { expenses: 10, incomes: 5 },
    };

    // First upsert
    const result1 = await asUser(userId).mutation(api.snapshots.upsertDailySnapshot, args);
    expect(result1.success).toBe(true);
    expect(result1.created).toBe(true);
    expect(result1.updated).toBeUndefined();

    // Second upsert (sequential, not concurrent)
    const result2 = await asUser(userId).mutation(api.snapshots.upsertDailySnapshot, args);
    expect(result2.success).toBe(true);
    expect(result2.updated).toBe(true);
    expect(result2.created).toBeUndefined();

    // Verify only one snapshot exists
    const today = new Date().toISOString().split("T")[0];
    const snapshots = await asUser(userId).query(api.snapshots.listCloudSnapshots, {});
    const todaySnapshots = snapshots.filter((s: any) => s.date === today);
    expect(todaySnapshots.length).toBe(1);
  });

  it("deleteAllUserSnapshots chunks across snapshots, receipts and aliases and continues via scheduler", async () => {
    // Seed 550 dailySnapshots
    for (let i = 0; i < 550; i++) {
      await t.run(async (ctx: any) => {
        await ctx.db.insert("dailySnapshots", {
          userId,
          accountId: "acc-test",
          date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
          wizardProfile: {},
          totals: { income: 100, expenses: 50, savings: 50 },
          createdAt: Date.now() + i,
        });
      });
    }

    // Seed 5 receipts
    for (let i = 0; i < 5; i++) {
      await t.run(async (ctx: any) => {
        await ctx.db.insert("receipts", {
          userId,
          amount: 50 + i,
          merchant: `Shop ${i}`,
          category: "food",
          imageMimeType: "image/jpeg",
          imageSizeBytes: 512,
          parsedAt: Date.now() + i,
          geminiModel: "gemini-2.5-flash",
        });
      });
    }

    // Seed 5 merchantAliases
    for (let i = 0; i < 5; i++) {
      await t.run(async (ctx: any) => {
        await ctx.db.insert("merchantAliases", {
          userId,
          normalised: `shop${i}`,
          displayName: `Shop ${i}`,
          category: "food",
          hits: 1,
          updatedAt: Date.now() + i,
        });
      });
    }

    // Execute deleteAllUserSnapshots - should delete first 500 snapshots and schedule continuation
    const res = await asUser(userId).mutation(api.snapshots.deleteAllUserSnapshots, {});
    expect(res.success).toBe(true);
    expect(res.deletedSnapshots).toBe(500);
    expect(res.continuation).toBe(true);

    // Draining via scheduler continuation should delete remaining 50 snapshots, 5 receipts, and 5 aliases
    await t.finishAllScheduledFunctions(() => {});

    const remainingSnapshots = await t.run(async (ctx: any) =>
      ctx.db.query("dailySnapshots").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
    );
    const remainingReceipts = await t.run(async (ctx: any) =>
      ctx.db.query("receipts").withIndex("by_user", (q: any) => q.eq("userId", userId)).collect(),
    );
    const remainingAliases = await t.run(async (ctx: any) =>
      ctx.db.query("merchantAliases").withIndex("by_user_and_normalised", (q: any) => q.eq("userId", userId)).collect(),
    );

    expect(remainingSnapshots).toHaveLength(0);
    expect(remainingReceipts).toHaveLength(0);
    expect(remainingAliases).toHaveLength(0);
  });
});