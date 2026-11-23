// convex/accounts/accountInvites.ts
import { v, ConvexError } from "convex/values";
import { query, mutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";
import type { Doc } from "../_generated/dataModel";
import {
  MAX_MEMBERS,
} from "./types";
import {
  ensureProfileDoc,
} from "./helpers";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// Bound the by_board scan. schema.ts (owned by W4) has no by_board_and_status
// index yet; newest-first keeps live pending rows inside the bound even when
// old accepted/declined rows accumulate. Desired index is documented in the W3 report.
const INVITE_SCAN_LIMIT = 250;

/** Newest-first bounded scan of a board's invites. Expires stale pending rows
 * and returns only those still live. */
async function loadPendingBoardInvites(
  ctx: MutationCtx,
  boardId: string,
): Promise<Doc<"invites">[]> {
  const now = Date.now();
  const rows = await ctx.db
    .query("invites")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .order("desc")
    .take(INVITE_SCAN_LIMIT);
  const pending: Doc<"invites">[] = [];
  for (const row of rows) {
    if (row.status !== "pending") continue;
    if (now - row.createdAt > SEVEN_DAYS_MS) {
      await ctx.db.patch(row._id, { status: "expired" });
    } else {
      pending.push(row);
    }
  }
  return pending;
}

/** Equivalent of a board epoch without a schema change: on every removal we
 * invalidate all still-pending invites for the board that a departing member
 * could hold — targeted invites to them and every bearer-token invite. */
async function revokeInvitesForDepartingMember(
  ctx: MutationCtx,
  boardId: string,
  departingUserId: Id<"users">,
): Promise<void> {
  const rows = await ctx.db
    .query("invites")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .order("desc")
    .take(INVITE_SCAN_LIMIT);
  for (const row of rows) {
    if (row.status !== "pending") continue;
    if (row.toUserId === departingUserId || row.toUserId === undefined) {
      await ctx.db.patch(row._id, { status: "expired" });
    }
  }
}

export const inviteByCode = mutation({
  args: { accountId: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId !== userId) throw new ConvexError("Only the owner can invite");
    if (!acc.boardId) throw new ConvexError("Account has no shared board");

    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .take(MAX_MEMBERS + 1);
    // N10: scan the most recent INVITE_SCAN_LIMIT rows (not just the oldest
    // MAX_MEMBERS*2) so stale terminal rows cannot hide live pending invites.
    const pendingInvites = await loadPendingBoardInvites(ctx, acc.boardId!);
    const totalOccupied = memberRows.length + pendingInvites.length;
    if (totalOccupied >= MAX_MEMBERS) {
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    const code = args.code.trim().toUpperCase();
    const inviteeMatches = await ctx.db
      .query("userProfiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", code))
      .take(2);
    if (inviteeMatches.length > 1) {
      throw new ConvexError("Share code ambiguous — contact support");
    }
    const invitee = inviteeMatches[0] ?? null;
    if (!invitee) throw new ConvexError("Share code not found");
    if (invitee.userId === userId) {
      throw new ConvexError("Cannot invite yourself");
    }

    if (memberRows.some((r) => r.userId === invitee.userId)) {
      return { alreadyMember: true };
    }

    if (pendingInvites.some((r) => r.toUserId === invitee.userId)) {
      return { alreadyInvited: true };
    }

    await ctx.db.insert("invites", {
      boardId: acc.boardId,
      fromUserId: userId,
      toUserId: invitee.userId,
      status: "pending",
      createdAt: Date.now(),
      accountId: acc.accountId,
    });
    return { success: true };
  },
});

export const createInviteToken = mutation({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId !== userId) throw new ConvexError("Only the owner can invite");
    if (!acc.boardId) throw new ConvexError("Account has no shared board");

    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .take(MAX_MEMBERS + 1);

    // N10: sweep expired pending rows and count all still-live pending invites
    // over a bounded newest-first window, not just the oldest 16 rows.
    const pendingInvites = await loadPendingBoardInvites(ctx, acc.boardId!);
    const activeOutstanding = pendingInvites.length;

    if (memberRows.length + activeOutstanding >= MAX_MEMBERS) {
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);

    await ctx.db.insert("invites", {
      boardId: acc.boardId,
      fromUserId: userId,
      toUserId: undefined,
      status: "pending",
      createdAt: Date.now(),
      accountId: acc.accountId,
      token,
    });
    return { token };
  },
});

export const redeemInviteToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");
    await ensureProfileDoc(ctx, userId);

    const token = args.token.trim();
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) {
      throw new ConvexError("Invite link is invalid or expired");
    }

    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", invite.accountId))
      .unique();
    if (!acc || !acc.boardId) throw new ConvexError("Account not found");

    const isMember = (await ctx.db
      .query("boardMembers")
      .withIndex("by_user_and_board", (q) =>
        q.eq("userId", userId).eq("boardId", acc.boardId!),
      )
      .first()) !== null;
    if (isMember) {
      // P0-C3: an existing member must NOT burn a token meant for someone else.
      return { accountId: acc.accountId, boardId: acc.boardId, alreadyMember: true };
    }

    if (invite.status === "expired") {
      throw new ConvexError("Invite link is invalid or expired");
    }
    if (invite.status !== "pending") {
      throw new ConvexError("Invite link has already been used");
    }

    // P0-C3: enforce the 7-day TTL at redemption, not only at token creation.
    // NOTE: a mutating patch here would be rolled back by the throw (Convex
    // transaction semantics). The TTL check is authoritative on every redeem;
    // loadPendingBoardInvites persists status:"expired" on the next invite op.
    if (Date.now() - invite.createdAt > SEVEN_DAYS_MS) {
      throw new ConvexError("Invite link is invalid or expired");
    }

    // Insert the boardMember first, then check if we exceeded the cap.
    // If over cap, delete the just-inserted row and throw.
    const memberRowId = await ctx.db.insert("boardMembers", {
      boardId: acc.boardId,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });

    // Re-check member count after insert (concurrent-safe)
    const membersAfter = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .take(MAX_MEMBERS + 1);
    if (membersAfter.length > MAX_MEMBERS) {
      // Over cap - roll back by deleting the row we just inserted
      await ctx.db.delete(memberRowId);
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
      .unique();
    if (board && !board.members.includes(userId)) {
      await ctx.db.patch(board._id, { members: [...board.members, userId] });
    }

    // Mirror to user profile so joinedBoardIds stays accurate across clients
    const profile = await ensureProfileDoc(ctx, userId);
    const joined = profile.joinedBoardIds ?? [];
    if (!joined.includes(acc.boardId)) {
      await ctx.db.patch(profile._id, {
        joinedBoardIds: [...joined, acc.boardId],
      });
    }

    await ctx.db.patch(invite._id, { status: "accepted", toUserId: userId });
    return { accountId: acc.accountId, boardId: acc.boardId, alreadyMember: false };
  },
});

export const listInvites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const rows = await ctx.db
      .query("invites")
      .withIndex("by_toUser_status", (q) =>
        q.eq("toUserId", userId).eq("status", "pending"),
      )
      .take(100);
    return rows.map((r) => ({
      inviteId: r._id,
      boardId: r.boardId,
      accountId: r.accountId,
      fromUserId: r.fromUserId,
      createdAt: r.createdAt,
    }));
  },
});

export const acceptInvite = mutation({
  args: { inviteId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");
    const invite = await ctx.db.get(args.inviteId as Id<"invites">);
    if (!invite) throw new ConvexError("Invite not found");
    if (invite.toUserId !== userId) {
      throw new ConvexError("Not your invite");
    }
    if (invite.status !== "pending") {
      throw new ConvexError("Invite already handled");
    }
    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", invite.boardId))
      .unique();
    if (!board) throw new ConvexError("Board not found");

    // Insert the boardMember first, then check if we exceeded the cap.
    // If over cap, delete the just-inserted row and throw.
    const memberRowId = await ctx.db.insert("boardMembers", {
      boardId: invite.boardId,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });

    // Re-check member count after insert (concurrent-safe)
    const membersAfter = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", invite.boardId))
      .take(MAX_MEMBERS + 1);
    if (membersAfter.length > MAX_MEMBERS) {
      // Over cap - roll back by deleting the row we just inserted
      await ctx.db.delete(memberRowId);
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    await ctx.db.patch(invite._id, { status: "accepted" });
    await ctx.db.patch(board._id, {
      members: Array.from(new Set([...board.members, userId])),
    });

    const profile = await ensureProfileDoc(ctx, userId);
    const joined = profile.joinedBoardIds ?? [];
    if (!joined.includes(invite.boardId)) {
      await ctx.db.patch(profile._id, {
        joinedBoardIds: [...joined, invite.boardId],
      });
    }
    return { success: true };
  },
});

export const declineInvite = mutation({
  args: { inviteId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");
    const invite = await ctx.db.get(args.inviteId as Id<"invites">);
    if (!invite) throw new ConvexError("Invite not found");
    if (invite.toUserId !== userId) {
      throw new ConvexError("Not your invite");
    }
    if (invite.status !== "pending") {
      throw new ConvexError("Invite already handled");
    }
    await ctx.db.patch(invite._id, { status: "declined" });
    return { success: true };
  },
});

export const removeMember = mutation({
  // P3-N3: runtime-validated as an Id below. Kept as v.string() at the validator
  // boundary because src/hooks/use-accounts.ts (another worker's scope) still
  // passes a plain string; see the W3 report for the one-line client fix that
  // allows tightening this to v.id("users").
  args: { accountId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new ConvexError("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId !== ownerId) {
      throw new ConvexError("Only the owner can remove members");
    }
    let target: Id<"users">;
    try {
      target = args.userId as Id<"users">;
      if (!target || !(await ctx.db.get(target))) {
        throw new ConvexError("Invalid user id");
      }
    } catch {
      throw new ConvexError("Invalid user id");
    }
    if (target === ownerId) {
      throw new ConvexError("Owner cannot be removed; transfer or delete the account");
    }
    if (!acc.boardId) throw new ConvexError("Account has no shared board");

    const memberRow = await ctx.db
      .query("boardMembers")
      .withIndex("by_user_and_board", (q) =>
        q.eq("userId", target).eq("boardId", acc.boardId!),
      )
      .first();
    if (memberRow) await ctx.db.delete(memberRow._id);

    // N11: revoke any outstanding invite the departing member could redeem.
    await revokeInvitesForDepartingMember(ctx, acc.boardId!, target);

    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
      .unique();
    if (board) {
      await ctx.db.patch(board._id, {
        members: board.members.filter((m) => m !== target),
      });
    }
    const targetProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", target))
      .unique();
    if (targetProfile?.joinedBoardIds) {
      await ctx.db.patch(targetProfile._id, {
        joinedBoardIds: targetProfile.joinedBoardIds.filter(
          (id) => id !== acc.boardId,
        ),
      });
    }
    return { success: true };
  },
});

export const leaveAccount = mutation({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId === userId) {
      throw new ConvexError("Owner cannot leave; transfer ownership or delete");
    }
    if (!acc.boardId) throw new ConvexError("Account has no shared board");

    const memberRow = await ctx.db
      .query("boardMembers")
      .withIndex("by_user_and_board", (q) =>
        q.eq("userId", userId).eq("boardId", acc.boardId!),
      )
      .first();
    if (memberRow) await ctx.db.delete(memberRow._id);

    // N11: revoke any outstanding invite the departing member could redeem.
    await revokeInvitesForDepartingMember(ctx, acc.boardId!, userId);

    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
      .unique();
    if (board) {
      await ctx.db.patch(board._id, {
        members: board.members.filter((m) => m !== userId),
      });
    }
    const profile = await ensureProfileDoc(ctx, userId);
    if (profile.joinedBoardIds) {
      await ctx.db.patch(profile._id, {
        joinedBoardIds: profile.joinedBoardIds.filter(
          (id) => id !== acc.boardId,
        ),
      });
    }
    return { success: true };
  },
});

export const resolveInviteCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { exists: false, accountId: null, name: null };
    }
    const code = args.code.trim().toUpperCase();
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", code))
      .unique();
    if (!acc) return { exists: false, accountId: null, name: null };
    return { exists: true, accountId: acc.accountId, name: acc.name };
  },
});

export const getCurrentUserEmail = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return user?.email ?? null;
  },
});