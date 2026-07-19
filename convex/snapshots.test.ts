/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach } from "vitest";
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

const sampleArgs = {
  wizardProfile: { completed: true, locale: "en" },
  totals: { income: 50000, expenses: 10000, savings: 40000, netWorth: 100000 },
  criticalExpenseCommitment: {
    expenseKey: "coffee",
    estimatedMonthlyCost: 3000,
    status: "active",
    compoundProjection: { oneYear: 36000, fiveYears: 180000, tenYears: 360000 },
  },
};

beforeEach(() => {
  t = convexTest(schema, modules);
});

test("upsertDailySnapshot inserts a new snapshot", async () => {
  const aliceId = await seedUser(t, "alice");
  const res = await asUser(aliceId).mutation(api.snapshots.upsertDailySnapshot, sampleArgs);
  expect(res.success).toBe(true);
  expect((res as any).created).toBe(true);

  const rows = await t.run(async (ctx: any) => ctx.db.query("dailySnapshots").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].userId).toBe(aliceId);
  expect(rows[0].totals.savings).toBe(40000);
});

test("upsertDailySnapshot updates an existing snapshot for the same day", async () => {
  const aliceId = await seedUser(t, "alice");
  await asUser(aliceId).mutation(api.snapshots.upsertDailySnapshot, sampleArgs);
  const res = await asUser(aliceId).mutation(api.snapshots.upsertDailySnapshot, {
    ...sampleArgs,
    totals: { income: 50000, expenses: 20000, savings: 30000, netWorth: 100000 },
  });
  expect((res as any).updated).toBe(true);

  const rows = await t.run(async (ctx: any) => ctx.db.query("dailySnapshots").collect());
  expect(rows).toHaveLength(1);
  expect(rows[0].totals.savings).toBe(30000);
});

test("upsertDailySnapshot requires authentication", async () => {
  await expect(t.mutation(api.snapshots.upsertDailySnapshot, sampleArgs)).rejects.toThrow(
    /Authentication required/,
  );
});

test("upsertDailySnapshot isolates snapshots per user", async () => {
  const aliceId = await seedUser(t, "alice");
  const bobId = await seedUser(t, "bob");
  await asUser(aliceId).mutation(api.snapshots.upsertDailySnapshot, sampleArgs);
  await asUser(bobId).mutation(api.snapshots.upsertDailySnapshot, sampleArgs);

  const aliceRows = await t.run(async (ctx: any) =>
    ctx.db
      .query("dailySnapshots")
      .withIndex("by_user_and_date", (q: any) => q.eq("userId", aliceId))
      .collect(),
  );
  expect(aliceRows).toHaveLength(1);
  expect(aliceRows[0].userId).toBe(aliceId);
});
