// convex/accounts/accountInvites.ts
import { v, ConvexError } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";
import {
  MAX_MEMBERS,
} from "./types";
import {
  ensureProfileDoc,
} from "./helpers";

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
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId !== userId) throw new Error("Only the owner can invite");
    if (!acc.boardId) throw new Error("Account has no shared board");

    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    const pendingInviteRows = await ctx.db
      .query("invites")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    const pendingInvites = pendingInviteRows.filter(
      (r) => r.status === "pending",
    ).length;
    const totalOccupied = memberRows.length + pendingInvites;
    if (totalOccupied >= MAX_MEMBERS) {
      throw new Error(`An account can have at most ${MAX_MEMBERS} members`);
    }

    const code = args.code.trim().toUpperCase();
    const invitee = await ctx.db
      .query("userProfiles")
      .withIndex("by_shareCode", (q) => q.eq("shareCode", code))
      .unique();
    if (!invitee) throw new Error("Share code not found");
    if (invitee.userId === userId) {
      throw new Error("Cannot invite yourself");
    }

    const existingMember = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    if (existingMember.some((r) => r.userId === invitee.userId)) {
      return { alreadyMember: true };
    }

    const pending = await ctx.db
      .query("invites")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    if (
      pending.some(
        (r) => r.toUserId === invitee.userId && r.status === "pending",
      )
    ) {
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
      .collect();

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const tokenRows = await ctx.db
      .query("invites")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();

    for (const r of tokenRows) {
      if (r.status === "pending" && !r.toUserId && now - r.createdAt > SEVEN_DAYS_MS) {
        await ctx.db.patch(r._id, { status: "expired" });
      }
    }

    const activeOutstanding = tokenRows.filter(
      (r) => r.status === "pending" && !r.toUserId && (now - r.createdAt <= SEVEN_DAYS_MS),
    ).length;

    if (memberRows.length + activeOutstanding >= MAX_MEMBERS) {
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
        : Math.random().toString(36).slice(2, 18);

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

    const boardRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    if (boardRows.some((r) => r.userId === userId)) {
      await ctx.db.patch(invite._id, { status: "accepted", toUserId: userId });
      return { accountId: acc.accountId, boardId: acc.boardId, alreadyMember: true };
    }

    if (invite.status !== "pending") {
      throw new ConvexError("Invite link has already been used");
    }

    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    if (members.length >= MAX_MEMBERS) {
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    await ctx.db.insert("boardMembers", {
      boardId: acc.boardId,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });
    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
      .unique();
    if (board && !board.members.includes(userId)) {
      await ctx.db.patch(board._id, { members: [...board.members, userId] });
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
      .collect();
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
    if (board.members.length >= MAX_MEMBERS) {
      throw new ConvexError(`An account can have at most ${MAX_MEMBERS} members`);
    }

    await ctx.db.patch(invite._id, { status: "accepted" });
    await ctx.db.insert("boardMembers", {
      boardId: invite.boardId,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });
    await ctx.db.patch(board._id, {
      members: [...board.members, userId],
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
    await ctx.db.patch(invite._id, { status: "declined" });
    return { success: true };
  },
});

export const removeMember = mutation({
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
    const target = args.userId as Id<"users">;
    if (target === ownerId) {
      throw new ConvexError("Owner cannot be removed; transfer or delete the account");
    }
    if (!acc.boardId) throw new ConvexError("Account has no shared board");

    const memberRow = (
      await ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
        .collect()
    ).find((r) => r.userId === target);
    if (memberRow) await ctx.db.delete(memberRow._id);

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

    const memberRow = (
      await ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
        .collect()
    ).find((r) => r.userId === userId);
    if (memberRow) await ctx.db.delete(memberRow._id);

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