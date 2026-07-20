// convex/sharedBoards.ts
import { v } from "convex/values";
import { query, mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

const SHARE_CODE_LEN = 8;

export interface StoredRecord {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  updatedAt: number;
}

/**
 * Merge an incoming set of keyed records into the existing board map.
 * Per key, the incoming record wins only when its updatedAt is strictly newer
 * than the stored one; otherwise the stored record is kept. This gives true
 * 2-way couple sync — both partners' edits survive rather than last-push-wins.
 */
function mergeRecords(
  existing: Record<string, StoredRecord> | null,
  incoming: Record<string, StoredRecord>,
): { merged: Record<string, StoredRecord>; changed: boolean } {
  const base: Record<string, StoredRecord> = { ...(existing ?? {}) };
  let changed = false;
  for (const [key, rec] of Object.entries(incoming)) {
    const prev = base[key];
    // Incoming wins when newer; ties keep the incoming value (deterministic).
    if (!prev || rec.updatedAt >= prev.updatedAt) {
      if (prev && prev.updatedAt === rec.updatedAt && prev.value === rec.value) {
        continue; // identical — no change
      }
      base[key] = rec;
      changed = true;
    }
  }
  return { merged: base, changed };
}

function generateShareCode(): string {
  // Short, human-shareable, uppercase. Collision handled by caller retry.
  // Single random slice, zero-padded so the code is always SHARE_CODE_LEN chars.
  return Math.random().toString(36).slice(2, 2 + SHARE_CODE_LEN).toUpperCase().padEnd(SHARE_CODE_LEN, "0");
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
    if (!profile) return null;
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

    // 1:1 couple semantics: neither side may already be linked. Re-linking or
    // linking into a partner who is already in another couple would corrupt the
    // previous partner's linkedBoardId (review finding F3).
    if (myProfile.linkedBoardId) {
      throw new Error("You are already linked to a partner; unlink first");
    }
    if (partner.linkedBoardId) {
      throw new Error("That share code is already linked to someone else");
    }

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

/** Push a local board edit. Merges per-key (incoming wins when newer). */
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

    const incoming = (args.data ?? {}) as Record<string, StoredRecord>;
    const { merged, changed } = mergeRecords(
      board.data as Record<string, StoredRecord> | null,
      incoming,
    );

    // Always advance updatedAt when there was any change so subscribers repull.
    // Even when unchanged we return applied:true so the client queue drains
    // (a stale push must not be re-queued forever).
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

/** Read the partner's public profile (name/code) for the linked board. */
export const getPartner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const myProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!myProfile?.linkedBoardId) return null;

    const board = await ctx.db
      .query("sharedBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", myProfile.linkedBoardId!))
      .unique();
    if (!board) return null;

    const partnerId = board.memberA === userId ? board.memberB : board.memberA;
    if (!partnerId) return null;

    // displayName/shareCode live on the userProfiles table, keyed by userId.
    const partner = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", partnerId))
      .unique();
    if (!partner) return null;

    return {
      displayName: partner.displayName ?? null,
      shareCode: partner.shareCode,
    };
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
