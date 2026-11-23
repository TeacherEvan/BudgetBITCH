/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "../../schema";
import { sumLedgerMinor } from "./boardShards";

const modules = import.meta.glob("../../**/*.ts");

// P3-N3 regression guard: a ledger larger than the old .take(500) window must
// still be summed completely (BigInt) instead of producing a false mismatch.
test("sumLedgerMinor accumulates every entry past the old 500-row cap", async () => {
  const t = convexTest(schema, modules);
  const boardId = "board-large-ledger";
  const userId = await t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: "ledger@example.com" }),
  );

  const entries = 600;
  for (let i = 0; i < entries; i++) {
    await t.run(async (ctx: any) => {
      await ctx.db.insert("ledgerEntries", {
        boardId,
        transactionId: `tx-${i}`,
        memberId: userId,
        amountMinor: BigInt(100 + i),
        store: "expenses",
        itemId: `item-${i}`,
        createdAt: Date.now() + i,
      });
    });
  }

  const total = await t.run(async (ctx: any) => sumLedgerMinor(ctx, boardId));
  const expected = Array.from({ length: entries }, (_, i) => BigInt(100 + i))
    .reduce((a, b) => a + b, BigInt(0));
  expect(total).toBe(expected);
});
