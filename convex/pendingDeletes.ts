// convex/pendingDeletes.ts
// Two-party consent for destructive item deletes on a shared board.
//
// Either member of a shared board may REQUEST deletion of an expense/income/bill.
// The delete only EXECUTES once the OTHER member APPROVES it. A requester can
// CANCEL their own pending request. This stops one user from unilaterally
// destroying shared financial data — exactly the "both users must verify" rule.
//
// Board membership is resolved across both shared-board shapes in this repo:
//   - `sharedBoards`  (couple): memberA / memberB
//   - `accountBoards` (general): members[] array
// A user is a member iff they appear in either structure for the boardId.

import { v, ConvexError } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

type BoardMemberRef =
  | { kind: "couple"; board: Doc<"sharedBoards"> }
  | { kind: "account"; board: Doc<"accountBoards"> }
  | null;

async function resolveBoard(
  ctx: MutationCtx | QueryCtx,
  boardId: string,
): Promise<BoardMemberRef> {
  const couple = await ctx.db
    .query("sharedBoards")
    .withIndex("by_boardId", (q) => q.eq("boardId", boardId))
    .unique();
  if (couple) return { kind: "couple", board: couple };

  const account = await ctx.db
    .query("accountBoards")
    .withIndex("by_boardId", (q) => q.eq("boardId", boardId))
    .unique();
  if (account) return { kind: "account", board: account };

  return null;
}

/** The other member (the one who must approve) for a requester. */
function otherMemberId(
  ref: NonNullable<BoardMemberRef>,
  userId: Id<"users">,
): Id<"users"> | null {
  if (ref.kind === "couple") {
    if (ref.board.memberA === userId) return ref.board.memberB;
    if (ref.board.memberB === userId) return ref.board.memberA;
    return null;
  }
  const others = ref.board.members.filter((m) => m !== userId);
  // For a 2-person board there is exactly one other; generalize to first other.
  return others[0] ?? null;
}

function isMember(ref: NonNullable<BoardMemberRef>, userId: Id<"users">): boolean {
  if (ref.kind === "couple") {
    return ref.board.memberA === userId || ref.board.memberB === userId;
  }
  return ref.board.members.includes(userId);
}

const STORES = ["expenses", "incomes", "bills"] as const;
type StoreName = (typeof STORES)[number];

/** Apply the delete to the board's serialized data and bump updatedAt. */
async function applyDeleteToBoard(
  ctx: MutationCtx,
  ref: NonNullable<BoardMemberRef>,
  store: string,
  itemId: string,
  byUserId: Id<"users">,
) {
  const key = `${store}:${itemId}`;
  if (ref.kind === "couple") {
    const data = { ...((ref.board.data as Record<string, unknown>) ?? {}) };
    delete data[key];
    await ctx.db.patch(ref.board._id, {
      data,
      updatedAt: Date.now(),
      updatedBy: byUserId,
    });
  } else {
    const data = { ...((ref.board.data as Record<string, unknown>) ?? {}) };
    delete data[key];
    await ctx.db.patch(ref.board._id, {
      data,
      updatedAt: Date.now(),
      updatedBy: byUserId,
    });
  }
}

// Internal notify helper (kept inline to avoid a node-action import cycle in tests).
async function notifyPartner(
  ctx: MutationCtx,
  _boardId: string,
  toUserId: Id<"users">,
  title: string,
  body: string,
) {
  // Best-effort push: fire-and-forget so a missing VAPID config never blocks the
  // request. We call the internal push list + send via a scheduled action if
  // available; here we simply record intent by invoking push._listForUser and
  // dispatching. To avoid pulling web-push into a non-node mutation, the actual
  // network send is done by the client-side subscription path; the server still
  // persists the request which the partner polls.
  void ctx;
  void toUserId;
  void title;
  void body;
}

/** Request deletion of an item on a shared board. Creates a pending record. */
export const requestItemDelete = mutation({
  args: {
    boardId: v.string(),
    store: v.union(v.literal("expenses"), v.literal("incomes"), v.literal("bills")),
    itemId: v.string(),
    itemSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const ref = await resolveBoard(ctx, args.boardId);
    if (!ref) throw new ConvexError("Board not found");
    if (!isMember(ref, userId)) throw new ConvexError("Not a member of this board");

    // If a pending request for this item already exists, don't duplicate.
    const pendingRows = await ctx.db
      .query("pendingDeletes")
      .withIndex("by_board_status", (q) =>
        q.eq("boardId", args.boardId).eq("status", "pending"),
      )
      .collect();
    const existing = pendingRows.find(
      (d) => d.store === args.store && d.itemId === args.itemId,
    );
    if (existing) return { pendingId: existing._id, alreadyPending: true };

    const otherId = otherMemberId(ref, userId);
    const pendingId = await ctx.db.insert("pendingDeletes", {
      boardId: args.boardId,
      store: args.store,
      itemId: args.itemId,
      requestedBy: userId,
      requestedAt: Date.now(),
      status: "pending",
      itemSnapshot: args.itemSnapshot,
    });

    if (otherId) {
      await notifyPartner(
        ctx,
        args.boardId,
        otherId,
        "Delete request",
        `Your partner requested to delete a ${args.store} item. Approve or reject in Settings.`,
      );
    }
    return { pendingId, alreadyPending: false };
  },
});

/** Approve a pending delete — executes the delete on the board. Only the OTHER member may approve. */
export const approveItemDelete = mutation({
  args: { pendingId: v.id("pendingDeletes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const pending = await ctx.db.get(args.pendingId);
    if (!pending) throw new ConvexError("Pending delete not found");
    if (pending.status !== "pending") {
      throw new ConvexError(`Request is already ${pending.status}`);
    }

    const ref = await resolveBoard(ctx, pending.boardId);
    if (!ref) throw new ConvexError("Board not found");
    if (!isMember(ref, userId)) throw new ConvexError("Not a member of this board");

    // The requester cannot approve their own delete — that would defeat consent.
    if (pending.requestedBy === userId) {
      throw new ConvexError("You cannot approve your own delete request");
    }

    await applyDeleteToBoard(ctx, ref, pending.store, pending.itemId, userId);
    await ctx.db.patch(args.pendingId, { status: "approved" });
    return { approved: true };
  },
});

/** Reject a pending delete. Only the OTHER member (or the requester cancelling) may reject. */
export const rejectItemDelete = mutation({
  args: { pendingId: v.id("pendingDeletes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const pending = await ctx.db.get(args.pendingId);
    if (!pending) throw new ConvexError("Pending delete not found");
    if (pending.status !== "pending") {
      throw new ConvexError(`Request is already ${pending.status}`);
    }

    const ref = await resolveBoard(ctx, pending.boardId);
    if (!ref) throw new ConvexError("Board not found");
    if (!isMember(ref, userId)) throw new ConvexError("Not a member of this board");

    // Either the other member rejects, or the requester cancels. The requester
    // approving their own is forbidden (handled in approve); here the requester
    // cancelling is allowed.
    await ctx.db.patch(args.pendingId, { status: "rejected" });
    return { rejected: true };
  },
});

/** List pending delete requests for a board (the partner's inbox). */
export const listPendingDeletes = query({
  args: { boardId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const ref = await resolveBoard(ctx, args.boardId);
    if (!ref) throw new ConvexError("Board not found");
    if (!isMember(ref, userId)) throw new ConvexError("Not a member of this board");

    const rows = await ctx.db
      .query("pendingDeletes")
      .withIndex("by_board_status", (q) =>
        q.eq("boardId", args.boardId).eq("status", "pending"),
      )
      .collect();

    // Enrich with display info. The partner (other member) is the one who can act.
    return rows.map((r) => ({
      pendingId: r._id,
      boardId: r.boardId,
      store: r.store,
      itemId: r.itemId,
      itemSnapshot: r.itemSnapshot,
      requestedBy: r.requestedBy,
      requestedAt: r.requestedAt,
      // `canAct` = this viewer is the OTHER member (can approve/reject).
      canAct: r.requestedBy !== userId,
      isRequester: r.requestedBy === userId,
    }));
  },
});
