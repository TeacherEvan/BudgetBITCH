// convex/accounts/helpers.ts
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";
import { INVITE_CODE_LEN } from "./types";

export function generateInviteCode(): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + INVITE_CODE_LEN)
    .toUpperCase()
    .padEnd(INVITE_CODE_LEN, "0");
}

export async function ensureProfileDoc(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"userProfiles">> {
  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (existing) return existing;
  for (let attempt = 0; attempt < 10; attempt++) {
    const shareCode = Math.random()
      .toString(36)
      .slice(2, 2 + INVITE_CODE_LEN)
      .toUpperCase()
      .padEnd(INVITE_CODE_LEN, "0");
    try {
      const id = await ctx.db.insert("userProfiles", {
        userId,
        shareCode,
        accountIds: [],
        joinedBoardIds: [],
      });
      const created = await ctx.db.get(id);
      if (created) return created;
    } catch {
      continue;
    }
  }
  throw new ConvexError("Failed to allocate a user sharing profile");
}

export async function getBoardMemberIds(
  ctx: QueryCtx,
  boardId: string,
): Promise<Id<"users">[]> {
  const rows = await ctx.db
    .query("boardMembers")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .collect();
  return rows
    .map((r) => r.userId)
    .filter((id): id is Id<"users"> => id !== undefined);
}
