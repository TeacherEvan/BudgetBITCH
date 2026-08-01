// convex/purge.ts
//
// HARD DELETE of a user's private profile + financial data on the server.
//
// Settings -> "Reset All Data" used to call only `snapshots.deleteAllUserSnapshots`,
// which wiped three tables (dailySnapshots, receipts, merchantAliases). Everything
// else the user owns survived on Convex:
//
//   - userProfiles       (shareCode, displayName, account/board membership lists)
//   - accounts           (owned account metadata + invite codes)
//   - accountBoards      (the FULL serialized financial board — expenses, incomes,
//                         bills, budgets — for every account the user owned)
//   - sharedBoards       (the couple board, same full serialized financial data)
//   - boardMembers       (membership rows)
//   - invites            (sent + received)
//   - pendingDeletes     (itemSnapshot holds copies of deleted financial rows)
//   - pushSubscriptions  (device endpoints)
//   - lineUsers          (LINE identity mapping)
//   - legalAgreements / cookieConsents  (consent audit trail — retained by design)
//
// So a "reset" left a full copy of the user's finances in the cloud, and any
// re-login or account switch could surface it again. `purgeMyAccountData`
// deletes all of it in one transaction.
//
// Retention exception: legalAgreements and cookieConsents are deliberately NOT
// deleted. They are the consent audit trail (who accepted which ToS/Privacy
// version, when) and exist precisely so the record survives a data reset.
//
// Ownership rules applied when a shared structure is involved:
//   - Account the user OWNS      -> the account, its board, its members and its
//                                   invites are destroyed for everyone (same
//                                   semantics as accounts.deleteAccount).
//   - Account the user JOINED    -> only the user's own membership is removed;
//                                   the other members keep their board.
//   - Couple board               -> deleted when the partner is no longer linked
//                                   to it, otherwise left for the partner (same
//                                   semantics as sharedBoards.unlink).

import { ConvexError } from "convex/values";
import { mutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export interface PurgeCounts {
  snapshots: number;
  receipts: number;
  merchantAliases: number;
  accounts: number;
  accountBoards: number;
  sharedBoards: number;
  boardMemberships: number;
  invites: number;
  pendingDeletes: number;
  pushSubscriptions: number;
  lineIdentities: number;
  profiles: number;
}

function emptyCounts(): PurgeCounts {
  return {
    snapshots: 0,
    receipts: 0,
    merchantAliases: 0,
    accounts: 0,
    accountBoards: 0,
    sharedBoards: 0,
    boardMemberships: 0,
    invites: 0,
    pendingDeletes: 0,
    pushSubscriptions: 0,
    lineIdentities: 0,
    profiles: 0,
  };
}

/** Delete every board-scoped row for a board the caller owns. */
async function destroyBoard(
  ctx: MutationCtx,
  boardId: string,
  ownerId: Id<"users">,
  counts: PurgeCounts,
): Promise<void> {
  const memberRows = await ctx.db
    .query("boardMembers")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .collect();
  for (const row of memberRows) {
    await ctx.db.delete(row._id);
    counts.boardMemberships += 1;
    if (row.userId !== ownerId) {
      // Detach the co-member's profile from a board that no longer exists.
      const memberProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", row.userId))
        .unique();
      if (memberProfile?.joinedBoardIds?.includes(boardId)) {
        await ctx.db.patch(memberProfile._id, {
          joinedBoardIds: memberProfile.joinedBoardIds.filter(
            (id) => id !== boardId,
          ),
        });
      }
    }
  }

  const inviteRows = await ctx.db
    .query("invites")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .collect();
  for (const row of inviteRows) {
    await ctx.db.delete(row._id);
    counts.invites += 1;
  }

  const deleteRows = await ctx.db
    .query("pendingDeletes")
    .withIndex("by_board_status", (q) => q.eq("boardId", boardId))
    .collect();
  for (const row of deleteRows) {
    await ctx.db.delete(row._id);
    counts.pendingDeletes += 1;
  }

  const board = await ctx.db
    .query("accountBoards")
    .withIndex("by_boardId", (q) => q.eq("boardId", boardId))
    .unique();
  if (board) {
    await ctx.db.delete(board._id);
    counts.accountBoards += 1;
  }
}

/**
 * Permanently deletes the authenticated user's private profile and ALL of their
 * financial data from Convex. Called by Settings -> Reset All Data.
 *
 * Idempotent: calling it twice on an already-purged account is a no-op that
 * still returns success with zero counts.
 */
export const purgeMyAccountData = mutation({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; counts: PurgeCounts }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }
    const counts = emptyCounts();

    // ---- 1. Per-user financial records -------------------------------------
    const snapshots = await ctx.db
      .query("dailySnapshots")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of snapshots) {
      await ctx.db.delete(row._id);
      counts.snapshots += 1;
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of receipts) {
      await ctx.db.delete(row._id);
      counts.receipts += 1;
    }

    const aliases = await ctx.db
      .query("merchantAliases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of aliases) {
      await ctx.db.delete(row._id);
      counts.merchantAliases += 1;
    }

    // ---- 2. Owned accounts (board data destroyed for all members) ----------
    const ownedAccounts = await ctx.db
      .query("accounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();
    for (const acc of ownedAccounts) {
      if (acc.boardId) {
        await destroyBoard(ctx, acc.boardId, userId, counts);
      }
      await ctx.db.delete(acc._id);
      counts.accounts += 1;
    }

    // ---- 3. Joined boards (leave; other members keep their data) -----------
    const myMemberships = await ctx.db
      .query("boardMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of myMemberships) {
      const board = await ctx.db
        .query("accountBoards")
        .withIndex("by_boardId", (q) => q.eq("boardId", row.boardId))
        .unique();
      if (board) {
        await ctx.db.patch(board._id, {
          members: board.members.filter((m) => m !== userId),
        });
      }
      await ctx.db.delete(row._id);
      counts.boardMemberships += 1;
    }

    // ---- 4. Couple boards (either side) ------------------------------------
    const coupleBoards = [
      ...(await ctx.db
        .query("sharedBoards")
        .withIndex("by_memberA", (q) => q.eq("memberA", userId))
        .collect()),
      ...(await ctx.db
        .query("sharedBoards")
        .withIndex("by_memberB", (q) => q.eq("memberB", userId))
        .collect()),
    ];
    for (const board of coupleBoards) {
      const partnerId =
        board.memberA === userId ? board.memberB : board.memberA;
      const partnerProfile = partnerId
        ? await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", partnerId))
            .unique()
        : null;
      const partnerStillLinked =
        partnerProfile?.linkedBoardId === board.boardId;

      const deleteRows = await ctx.db
        .query("pendingDeletes")
        .withIndex("by_board_status", (q) => q.eq("boardId", board.boardId))
        .collect();
      for (const row of deleteRows) {
        await ctx.db.delete(row._id);
        counts.pendingDeletes += 1;
      }

      if (!partnerStillLinked) {
        await ctx.db.delete(board._id);
        counts.sharedBoards += 1;
      }
    }

    // ---- 5. Invites the user sent or received ------------------------------
    const sentInvites = await ctx.db
      .query("invites")
      .withIndex("by_fromUser", (q) => q.eq("fromUserId", userId))
      .collect();
    for (const row of sentInvites) {
      await ctx.db.delete(row._id);
      counts.invites += 1;
    }
    for (const status of ["pending", "accepted", "declined", "expired"]) {
      const received = await ctx.db
        .query("invites")
        .withIndex("by_toUser_status", (q) =>
          q.eq("toUserId", userId).eq("status", status),
        )
        .collect();
      for (const row of received) {
        await ctx.db.delete(row._id);
        counts.invites += 1;
      }
    }

    // ---- 6. Delete requests the user raised --------------------------------
    const myDeleteRequests = await ctx.db
      .query("pendingDeletes")
      .withIndex("by_requestedBy", (q) => q.eq("requestedBy", userId))
      .collect();
    for (const row of myDeleteRequests) {
      await ctx.db.delete(row._id);
      counts.pendingDeletes += 1;
    }

    // ---- 7. Device + identity bindings -------------------------------------
    const subs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of subs) {
      await ctx.db.delete(row._id);
      counts.pushSubscriptions += 1;
    }

    const lineRows = await ctx.db
      .query("lineUsers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of lineRows) {
      await ctx.db.delete(row._id);
      counts.lineIdentities += 1;
    }

    // ---- 8. The private sharing profile itself -----------------------------
    // Deleted last: earlier steps read it to resolve boards. Dropping it also
    // retires the user's shareCode so nobody can link to the purged account.
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const row of profiles) {
      await ctx.db.delete(row._id);
      counts.profiles += 1;
    }

    return { success: true, counts };
  },
});
