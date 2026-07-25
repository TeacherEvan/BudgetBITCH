// convex/accounts/purchaseNotes.ts
// Shared purchase notes visible to all members of a board.
// Stored in accountBoards.data under the "__purchaseNotes__" key.

import { v, ConvexError } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mergeRecords } from "../boardMerge";

const PURCHASE_NOTES_KEY = "__purchaseNotes__";

interface PurchaseNote {
  note: string;
  updatedBy: string; // userId
  updatedAt: number;
}

type BoardData = Record<string, { value: unknown; updatedAt: number }> | null;

export const setPurchaseNote = mutation({
  args: {
    boardId: v.string(),
    expenseId: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    if (!board) throw new ConvexError("Board not found");

    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    const isMember = members.some((r) => r.userId === userId);
    if (!isMember) throw new ConvexError("Not a member of this board");

    const now = Date.now();
    const existingNotes = (board.data as BoardData)?.[PURCHASE_NOTES_KEY]?.value as Record<string, PurchaseNote> | undefined;
    const incomingNotes: Record<string, { value: PurchaseNote; updatedAt: number }> = {
      [PURCHASE_NOTES_KEY]: {
        value: {
          ...existingNotes?.[args.expenseId] ?? { note: "", updatedBy: "", updatedAt: 0 },
          note: args.note,
          updatedBy: userId,
          updatedAt: now,
        },
        updatedAt: now,
      },
    };

    const { merged } = await mergeRecords(board.data as BoardData, incomingNotes);
    await ctx.db.patch(board._id, {
      data: merged,
      updatedAt: Math.max(board.updatedAt, now + 1),
      updatedBy: userId,
    });
    return { success: true };
  },
});

export const getPurchaseNotes = query({
  args: { boardId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    if (!board) return null;

    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    const isMember = members.some((r) => r.userId === userId);
    if (!isMember) return null;

    const notesData = (board.data as BoardData)?.[PURCHASE_NOTES_KEY]?.value as Record<string, PurchaseNote> | undefined ?? {};
    return notesData;
  },
});

export const deletePurchaseNote = mutation({
  args: { boardId: v.string(), expenseId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    if (!board) throw new ConvexError("Board not found");

    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    const isMember = members.some((r) => r.userId === userId);
    if (!isMember) throw new ConvexError("Not a member of this board");

    const existingNotes = (board.data as BoardData)?.[PURCHASE_NOTES_KEY]?.value as Record<string, PurchaseNote> | undefined ?? {};
    if (!existingNotes[args.expenseId]) return { success: true };

    const now = Date.now();
    const { [args.expenseId]: _removed, ...remainingNotes } = existingNotes;

    const incomingNotes: Record<string, { value: Record<string, PurchaseNote>; updatedAt: number }> = {
      [PURCHASE_NOTES_KEY]: {
        value: remainingNotes,
        updatedAt: now,
      },
    };

    const { merged } = await mergeRecords(board.data as BoardData, incomingNotes);
    await ctx.db.patch(board._id, {
      data: merged,
      updatedAt: Math.max(board.updatedAt, now + 1),
      updatedBy: userId,
    });
    return { success: true };
  },
});