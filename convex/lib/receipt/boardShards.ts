// convex/lib/receipt/boardShards.ts
// Sharded delta counters for shared boards — eliminates OCC contention

import { internal } from "../../_generated/api";
import { MutationCtx, QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import type { MinorUnits } from "./ledgerMath";

export const SHARD_COUNT = 16;

/** Get the shard index for a transaction ID. */
export function getShardIndex(transactionId: string): number {
  // Simple FNV-1a hash modulo 16
  let h = 0x811c9dc5;
  for (let i = 0; i < transactionId.length; i++) {
    h ^= transactionId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % SHARD_COUNT;
}

/** Increment a shard for a board by amountMinor (signed). */
export async function incrementShard(
  ctx: MutationCtx,
  boardId: string,
  transactionId: string,
  amountMinor: MinorUnits
): Promise<void> {
  const shardIndex = getShardIndex(transactionId);
  const existing = await ctx.db
    .query("boardShards")
    .withIndex("by_board_and_shard", (q) => q.eq("boardId", boardId).eq("shardIndex", shardIndex))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      totalMinor: (existing.totalMinor as bigint) + BigInt(amountMinor),
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("boardShards", {
      boardId,
      shardIndex,
      totalMinor: BigInt(amountMinor),
      updatedAt: Date.now(),
    });
  }
}

/** Get the total balance for a board by summing all shards. */
export async function getBoardTotal(
  ctx: QueryCtx,
  boardId: string
): Promise<number> {
  let total = 0;
  for (let i = 0; i < SHARD_COUNT; i++) {
    const shard = await ctx.db
      .query("boardShards")
      .withIndex("by_board_and_shard", (q) => q.eq("boardId", boardId).eq("shardIndex", i))
      .unique();
    if (shard) {
      total += Number(shard.totalMinor);
    }
  }
  return total;
}

/** Get shard totals for a board (for debugging/inspection). */
export async function getBoardShardTotals(
  ctx: QueryCtx,
  boardId: string
): Promise<Array<{ shardIndex: number; totalMinor: number }>> {
  const shards: Array<{ shardIndex: number; totalMinor: number }> = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    const shard = await ctx.db
      .query("boardShards")
      .withIndex("by_board_and_shard", (q) => q.eq("boardId", boardId).eq("shardIndex", i))
      .unique();
    if (shard) {
      shards.push({ shardIndex: i, totalMinor: Number(shard.totalMinor) });
    } else {
      shards.push({ shardIndex: i, totalMinor: 0 });
    }
  }
  return shards;
}

/** Insert a ledger entry for audit trail. */
export async function insertLedgerEntry(
  ctx: MutationCtx,
  boardId: string,
  transactionId: string,
  memberId: Id<"users">,
  amountMinor: MinorUnits,
  store: string,
  itemId: string
): Promise<void> {
  await ctx.db.insert("ledgerEntries", {
    boardId,
    transactionId,
    memberId,
    amountMinor: BigInt(amountMinor),
    store,
    itemId,
    createdAt: Date.now(),
  });
}

/** Verify board total matches ledger entries (for consistency checks). */
export async function verifyBoardTotal(
  ctx: QueryCtx,
  boardId: string
): Promise<{ shardTotal: number; ledgerTotal: number; matches: boolean }> {
  const shardTotal = await getBoardTotal(ctx, boardId);
  
  const ledgerEntries = await ctx.db
    .query("ledgerEntries")
    .withIndex("by_board_and_transaction", (q) => q.eq("boardId", boardId))
    .collect();
  
  const ledgerTotal = ledgerEntries.reduce(
    (sum: number, entry: { amountMinor: bigint }) => sum + Number(entry.amountMinor),
    0
  );
  
  return {
    shardTotal,
    ledgerTotal,
    matches: shardTotal === ledgerTotal,
  };
}