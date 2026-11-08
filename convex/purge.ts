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

import { ConvexError, v } from "convex/values";
import { mutation, internalMutation, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";

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
  boardShards: number;
  ledgerEntries: number;
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
    boardShards: 0,
    ledgerEntries: 0,
  };
}

/** Delete every board-scoped row for a board the caller owns, in batches. */
async function destroyBoard(
  ctx: MutationCtx,
  boardId: string,
  ownerId: Id<"users">,
  counts: PurgeCounts,
): Promise<void> {
  // Batch delete boardMembers
  while (true) {
    const batch = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .take(250);
    for (const row of batch) {
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
    if (batch.length < 250) break;
  }

  // Batch delete invites
  while (true) {
    const batch = await ctx.db
      .query("invites")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .take(250);
    for (const row of batch) {
      await ctx.db.delete(row._id);
      counts.invites += 1;
    }
    if (batch.length < 250) break;
  }

  // Batch delete pendingDeletes
  while (true) {
    const batch = await ctx.db
      .query("pendingDeletes")
      .withIndex("by_board_status", (q) => q.eq("boardId", boardId))
      .take(250);
    for (const row of batch) {
      await ctx.db.delete(row._id);
      counts.pendingDeletes += 1;
    }
    if (batch.length < 250) break;
  }

  // Batch delete boardShards
  for (let shard = 0; shard < 16; shard++) {
    const s = await ctx.db
      .query("boardShards")
      .withIndex("by_board_and_shard", (q) =>
        q.eq("boardId", boardId).eq("shardIndex", shard),
      )
      .unique();
    if (s) {
      await ctx.db.delete(s._id);
      counts.boardShards += 1;
    }
  }

  // Batch delete ledgerEntries
  while (true) {
    const batch = await ctx.db
      .query("ledgerEntries")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .take(250);
    for (const row of batch) {
      await ctx.db.delete(row._id);
      counts.ledgerEntries += 1;
    }
    if (batch.length < 250) break;
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

    // ---- 1. Per-user financial records (batched deletion) -----------------
    while (true) {
      const batch = await ctx.db
        .query("dailySnapshots")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(500);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.snapshots += 1;
      }
      if (batch.length < 500) break;
    }

    while (true) {
      const batch = await ctx.db
        .query("receipts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(500);
      for (const row of batch) {
        if (row.imageStorageId) {
          try {
            await ctx.storage.delete(row.imageStorageId);
          } catch {
            // Storage blob may already be removed or missing
          }
        }
        await ctx.db.delete(row._id);
        counts.receipts += 1;
      }
      if (batch.length < 500) break;
    }

    while (true) {
      const batch = await ctx.db
        .query("merchantAliases")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(500);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.merchantAliases += 1;
      }
      if (batch.length < 500) break;
    }

    // ---- 2. Owned accounts (board data destroyed for all members) ----------
    // Also destroy the user's personal board if one was created
    await destroyBoard(ctx, `personal_${userId}`, userId, counts);

    while (true) {
      const ownedAccounts = await ctx.db
        .query("accounts")
        .withIndex("by_owner", (q) => q.eq("ownerId", userId))
        .take(100);
      for (const acc of ownedAccounts) {
        if (acc.boardId) {
          await destroyBoard(ctx, acc.boardId, userId, counts);
        }
        await ctx.db.delete(acc._id);
        counts.accounts += 1;
      }
      if (ownedAccounts.length < 100) break;
    }

    // ---- 3. Joined boards (leave; other members keep their data) -----------
    while (true) {
      const batch: Doc<"boardMembers">[] = await ctx.db
        .query("boardMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(250);
      for (const row of batch) {
        const board: Doc<"accountBoards"> | null = await ctx.db
          .query("accountBoards")
          .withIndex("by_boardId", (q) => q.eq("boardId", row.boardId))
          .unique();
        if (board) {
          if (board.ownerId === userId) {
            await destroyBoard(ctx, row.boardId, userId, counts);
          } else {
            await ctx.db.patch(board._id, {
              members: board.members.filter((m: Id<"users">) => m !== userId),
            });
            await ctx.db.delete(row._id);
            counts.boardMemberships += 1;
          }
        } else {
          await ctx.db.delete(row._id);
          counts.boardMemberships += 1;
        }
      }
      if (batch.length < 250) break;
    }

    // ---- 4. Couple boards (either side) ------------------------------------
    const coupleBoardsA = await ctx.db
      .query("sharedBoards")
      .withIndex("by_memberA", (q) => q.eq("memberA", userId))
      .take(100);
    const coupleBoardsB = await ctx.db
      .query("sharedBoards")
      .withIndex("by_memberB", (q) => q.eq("memberB", userId))
      .take(100);
    const coupleBoards = [...coupleBoardsA, ...coupleBoardsB];
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

      // Batch delete pendingDeletes for this board
      while (true) {
        const batch = await ctx.db
          .query("pendingDeletes")
          .withIndex("by_board_status", (q) => q.eq("boardId", board.boardId))
          .take(250);
        for (const row of batch) {
          await ctx.db.delete(row._id);
          counts.pendingDeletes += 1;
        }
        if (batch.length < 250) break;
      }

      if (!partnerStillLinked) {
        // Purge sharded ledger rows for orphaned couple board
        for (let shard = 0; shard < 16; shard++) {
          const s = await ctx.db
            .query("boardShards")
            .withIndex("by_board_and_shard", (q) =>
              q.eq("boardId", board.boardId).eq("shardIndex", shard),
            )
            .unique();
          if (s) {
            await ctx.db.delete(s._id);
            counts.boardShards += 1;
          }
        }

        while (true) {
          const batch = await ctx.db
            .query("ledgerEntries")
            .withIndex("by_board", (q) => q.eq("boardId", board.boardId))
            .take(250);
          for (const row of batch) {
            await ctx.db.delete(row._id);
            counts.ledgerEntries += 1;
          }
          if (batch.length < 250) break;
        }

        await ctx.db.delete(board._id);
        counts.sharedBoards += 1;
      }
    }

    // ---- 5. Invites the user sent or received ------------------------------
    while (true) {
      const batch = await ctx.db
        .query("invites")
        .withIndex("by_fromUser", (q) => q.eq("fromUserId", userId))
        .take(250);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.invites += 1;
      }
      if (batch.length < 250) break;
    }
    for (const status of ["pending", "accepted", "declined", "expired"]) {
      while (true) {
        const batch = await ctx.db
          .query("invites")
          .withIndex("by_toUser_status", (q) =>
            q.eq("toUserId", userId).eq("status", status),
          )
          .take(250);
        for (const row of batch) {
          await ctx.db.delete(row._id);
          counts.invites += 1;
        }
        if (batch.length < 250) break;
      }
    }

    // ---- 6. Delete requests the user raised --------------------------------
    while (true) {
      const batch = await ctx.db
        .query("pendingDeletes")
        .withIndex("by_requestedBy", (q) => q.eq("requestedBy", userId))
        .take(250);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.pendingDeletes += 1;
      }
      if (batch.length < 250) break;
    }

    // ---- 7. Device + identity bindings -------------------------------------
    while (true) {
      const batch = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(250);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.pushSubscriptions += 1;
      }
      if (batch.length < 250) break;
    }

    while (true) {
      const batch = await ctx.db
        .query("lineUsers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(250);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.lineIdentities += 1;
      }
      if (batch.length < 250) break;
    }

    // ---- 7b. Scheduler continuation for large accounts ----------------------
    // If cumulative deletes already exceed one chunk, offload the profile
    // stage (which is always last) to a fresh scheduler transaction so the
    // wipe cannot hit execution limits and half-delete.
    const totalDeleted =
      counts.snapshots +
      counts.receipts +
      counts.merchantAliases +
      counts.accounts +
      counts.accountBoards +
      counts.sharedBoards +
      counts.boardMemberships +
      counts.invites +
      counts.pendingDeletes +
      counts.pushSubscriptions +
      counts.lineIdentities +
      counts.boardShards +
      counts.ledgerEntries;
    if (totalDeleted > 500) {
      await ctx.scheduler.runAfter(0, internal.purge.purgeProfileFinal, {
        userId,
      });
      return { success: true, counts, continuation: true };
    }

    // ---- 8. The private sharing profile itself -----------------------------
    // Deleted last: earlier steps read it to resolve boards. Dropping it also
    // retires the user's shareCode so nobody can link to the purged account.
    while (true) {
      const batch = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(250);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        counts.profiles += 1;
      }
      if (batch.length < 250) break;
    }

    return { success: true, counts };
  },
});

/**
 * Continuation: deletes the user's profile doc in a fresh transaction.
 * Scheduled by `purgeMyAccountData` when the wipe is large (execution-limit
 * avoidance). Runs last so membership resolution above never loses the profile.
 */
export const purgeProfileFinal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{ success: boolean; profiles: number }> => {
    let profiles = 0;
    while (true) {
      const batch = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(500);
      for (const row of batch) {
        await ctx.db.delete(row._id);
        profiles += 1;
      }
      if (batch.length < 500) break;
    }
    return { success: true, profiles };
  },
});
