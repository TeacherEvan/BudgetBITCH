// convex/accounts/accountBoardSync.ts
import { v, ConvexError } from "convex/values";
import { query, mutation, action } from "../_generated/server";
import { api } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mergeRecords, StoredRecord } from "../boardMerge";
import {
  retrieveAccount,
  modifyAccountCredentials,
} from "@convex-dev/auth/server";

export const pushAccountBoard = mutation({
  args: {
    boardId: v.string(),
    data: v.any(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, reason: "Authentication required" };
    }
    const targetBoardId = args.boardId === "personal" ? `personal_${userId}` : args.boardId;
    let board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", targetBoardId))
      .unique();
    if (!board) {
      if (args.boardId === "personal" || args.boardId === `personal_${userId}`) {
        const now = Date.now();
        const docId = await ctx.db.insert("accountBoards", {
          boardId: targetBoardId,
          accountId: "personal",
          ownerId: userId,
          members: [userId],
          umbrella: "family",
          name: "Personal Board",
          data: null,
          updatedAt: now,
          updatedBy: userId,
        });
        await ctx.db.insert("boardMembers", {
          boardId: targetBoardId,
          userId,
          role: "owner",
          joinedAt: now,
        });
        board = (await ctx.db.get(docId))!;
      } else {
        return { success: false, reason: "Board not found" };
      }
    }
    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", targetBoardId))
      .collect();
    const isMember = memberRows.some((r) => r.userId === userId);
    if (!isMember) {
      return { success: false, reason: "Not a member of this board" };
    }

    const incoming = (args.data ?? {}) as Record<string, StoredRecord>;
    const { merged, changed } = mergeRecords(
      board.data as Record<string, StoredRecord> | null,
      incoming,
    );
    const newUpdatedAt = changed
      ? Math.max(board.updatedAt, args.updatedAt + 1)
      : board.updatedAt;
    await ctx.db.patch(board._id, {
      data: merged,
      updatedAt: newUpdatedAt,
      updatedBy: userId,
    });
    return { success: true, applied: true, updatedAt: newUpdatedAt };
  },
});

export const getAccountBoard = query({
  args: { boardId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const targetBoardId = args.boardId === "personal" ? `personal_${userId}` : args.boardId;
    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", targetBoardId))
      .unique();
    if (!board) return null;
    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", targetBoardId))
      .collect();
    const isMember = members.some((r) => r.userId === userId);
    if (!isMember) return null;
    return board;
  },
});

export const changePassword = action({
  args: {
    oldPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const email = await ctx.runQuery(api.accounts.getCurrentUserEmail);
    if (!email) throw new ConvexError("User email not found");

    if (!args.newPassword || args.newPassword.length < 8) {
      throw new ConvexError("New password must be at least 8 characters");
    }

    const retrieved = await retrieveAccount(ctx, {
      provider: "password",
      account: { id: email, secret: args.oldPassword },
    });

    if (!retrieved) {
      throw new ConvexError("Incorrect old password");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: args.newPassword },
    });

    return { success: true };
  },
});