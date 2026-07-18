// convex/sharedBoards.ts
import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

const SHARE_CODE_LEN = 8;

function generateShareCode(): string {
  // Short, human-shareable, uppercase. Collision handled by caller retry.
  return (
    Math.random().toString(36).slice(2, 2 + SHARE_CODE_LEN).toUpperCase() +
    Math.random().toString(36).slice(2, 2 + SHARE_CODE_LEN).toUpperCase()
  ).slice(0, SHARE_CODE_LEN);
}

async function ensureProfileDoc(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"userProfiles">> {
  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
  if (existing) return existing;

  // Create with a unique shareCode (retry on collision).
  for (let attempt = 0; attempt < 10; attempt++) {
    const shareCode = generateShareCode();
    try {
      const id = await ctx.db.insert("userProfiles", { userId, shareCode });
      const created = await ctx.db.get(id);
      if (created) return created;
    } catch {
      // Unique index collision on shareCode — try again.
      continue;
    }
  }
  throw new Error("Failed to allocate a unique share code");
}

/** Create the caller's sharing profile (with a shareCode) if it doesn't exist yet. */
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const profile = await ensureProfileDoc(ctx, userId);
    return {
      shareCode: profile.shareCode,
      displayName: profile.displayName ?? null,
      linkedBoardId: profile.linkedBoardId ?? null,
    };
  },
});

/**
 * Returns the caller's sharing profile, or null if not authenticated or not yet
 * created. Read-only.
 *
 * Returning null (rather than throwing) on missing auth is intentional: this
 * query is subscribed to app-wide (SharedBoardSync) on every authenticated page,
 * so during the brief auth-token hydration window getAuthUserId can be null.
 * Throwing there surfaced as an uncaught Convex Server Error in the console.
 * The client hook already treats `myProfile === null` as a valid "needs profile"
 * state and creates one via ensureProfile.
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return { shareCode: null, displayName: null, linkedBoardId: null };
    return {
      shareCode: profile.shareCode,
      displayName: profile.displayName ?? null,
      linkedBoardId: profile.linkedBoardId ?? null,
    };
  },
});

/** Validate a partner's share code before linking. */
export const resolveShareCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const code = args.code.trim().toUpperCase();
    const partner = await ctx.db
      .query("userProfiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", code))
      .unique();

    if (!partner) return { exists: false, displayName: null };
    if (partner.userId === userId) return { exists: false, displayName: null };
    return { exists: true, displayName: partner.displayName ?? null };
  },
});

/** Link the caller to a partner by their share code. Returns the boardId. */
export const linkByCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const code = args.code.trim().toUpperCase();
    const partner = await ctx.db
      .query("userProfiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", code))
      .unique();

    if (!partner) throw new Error("Share code not found");
    if (partner.userId === userId) throw new Error("Cannot link to yourself");

    const myProfile = await ensureProfileDoc(ctx, userId);

    // Reuse an existing board if either party is already linked (1:1 couple, single board).
    const existingBoardId =
      myProfile.linkedBoardId ?? partner.linkedBoardId ?? null;

    let boardId: string;
    if (existingBoardId) {
      const board = await ctx.db
        .query("sharedBoards")
        .withIndex("by_boardId", (q) => q.eq("boardId", existingBoardId))
        .unique();
      if (!board) {
        // Stale reference — create a fresh board below.
        boardId = crypto.randomUUID();
        await ctx.db.insert("sharedBoards", {
          boardId,
          memberA: userId,
          memberB: partner.userId,
          data: null,
          updatedAt: Date.now(),
          updatedBy: userId,
        });
      } else {
        boardId = existingBoardId;
        await ctx.db.patch(board._id, { memberA: userId, memberB: partner.userId });
      }
    } else {
      boardId = crypto.randomUUID();
      await ctx.db.insert("sharedBoards", {
        boardId,
        memberA: userId,
        memberB: partner.userId,
        data: null,
        updatedAt: Date.now(),
        updatedBy: userId,
      });
    }

    await ctx.db.patch(myProfile._id, { linkedBoardId: boardId });
    await ctx.db.patch(partner._id, { linkedBoardId: boardId });

    return boardId;
  },
});

/** Read the shared board if the caller is a member. */
export const getBoard = query({
  args: { boardId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const board = await ctx.db
      .query("sharedBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    if (!board) throw new Error("Board not found");
    if (board.memberA !== userId && board.memberB !== userId) {
      throw new Error("Not a member of this board");
    }
    return board;
  },
});

/** Push a local board edit. Last-write-wins by updatedAt. */
export const pushBoard = mutation({
  args: {
    boardId: v.string(),
    data: v.any(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const board = await ctx.db
      .query("sharedBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    if (!board) throw new Error("Board not found");
    if (board.memberA !== userId && board.memberB !== userId) {
      throw new Error("Not a member of this board");
    }

    // Last-write-wins: ignore stale updates.
    if (args.updatedAt <= board.updatedAt) {
      return { success: true, applied: false, updatedAt: board.updatedAt };
    }

    await ctx.db.patch(board._id, {
      data: args.data,
      updatedAt: args.updatedAt,
      updatedBy: userId,
    });
    return { success: true, applied: true, updatedAt: args.updatedAt };
  },
});

/** Unlink the caller from their shared board. Deletes the board if now orphaned. */
export const unlink = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const myProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile) return { success: true, unlinked: false };

    const boardId = myProfile.linkedBoardId;
    await ctx.db.patch(myProfile._id, { linkedBoardId: undefined });

    if (!boardId) return { success: true, unlinked: false };

    const board = await ctx.db
      .query("sharedBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", boardId))
      .unique();
    if (!board) return { success: true, unlinked: true };

    // If the partner is still linked, keep the board for them.
    const partner = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", board.memberA === userId ? board.memberB : board.memberA))
      .unique();
    const partnerStillLinked = partner?.linkedBoardId === boardId;

    if (!partnerStillLinked) {
      await ctx.db.delete(board._id);
    }
    return { success: true, unlinked: true };
  },
});
