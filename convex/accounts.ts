// convex/accounts.ts
import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";
import { mergeRecords, StoredRecord } from "./boardMerge";
import {
  UMBRELLA_KEYS,
  type UmbrellaKey,
  MAX_OWNED_ACCOUNTS,
  MAX_MEMBERS,
  type AccountSummary,
} from "./accounts/types";
import {
  generateInviteCode,
  ensureProfileDoc,
  getBoardMemberIds,
} from "./accounts/helpers";

export { UMBRELLA_KEYS, type UmbrellaKey };

export const createAccount = mutation({
  args: {
    umbrella: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const umbrella = args.umbrella;
    if (!UMBRELLA_KEYS.includes(umbrella as UmbrellaKey)) {
      throw new Error("Invalid umbrella type");
    }
    const name = args.name.trim();
    if (name.length < 1 || name.length > 40) {
      throw new Error("Account name must be 1–40 characters");
    }

    const profile = await ensureProfileDoc(ctx, userId);
    const owned = profile.accountIds ?? [];
    if (owned.length >= MAX_OWNED_ACCOUNTS) {
      throw new Error(
        `You can create at most ${MAX_OWNED_ACCOUNTS} accounts`,
      );
    }

    // Unique invite code (retry on collision).
    let inviteCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateInviteCode();
      const clash = await ctx.db
        .query("accounts")
        .withIndex("by_inviteCode", (q) =>
          q.eq("inviteCode", candidate),
        )
        .unique();
      if (!clash) {
        inviteCode = candidate;
        break;
      }
    }
    if (!inviteCode) throw new Error("Failed to allocate an invite code");

    const accountId = crypto.randomUUID();
    const boardId = crypto.randomUUID();
    const now = Date.now();

    await ctx.db.insert("accounts", {
      accountId,
      ownerId: userId,
      umbrella,
      name,
      inviteCode,
      createdAt: now,
      boardId,
    });
    await ctx.db.insert("accountBoards", {
      boardId,
      accountId,
      ownerId: userId,
      members: [userId],
      umbrella,
      name,
      data: null,
      updatedAt: now,
      updatedBy: userId,
    });
    await ctx.db.insert("boardMembers", {
      boardId,
      userId,
      role: "owner",
      joinedAt: now,
    });
    await ctx.db.patch(profile._id, {
      accountIds: [...owned, accountId],
    });

    return { accountId, boardId, inviteCode };
  },
});

export const listMyAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    const ownedIds = profile.accountIds ?? [];

    const owned = (
      await Promise.all(
        ownedIds.map(async (accountId) => {
          const acc = await ctx.db
            .query("accounts")
            .withIndex("by_accountId", (q) =>
              q.eq("accountId", accountId),
            )
            .unique();
          if (!acc || !acc.boardId) return null;
          const board = await ctx.db
            .query("accountBoards")
            .withIndex("by_boardId", (q) =>
              q.eq("boardId", acc.boardId!),
            )
            .unique();
          const members = board
            ? await getBoardMemberIds(ctx, board.boardId)
            : [];
          return {
            accountId: acc.accountId,
            umbrella: acc.umbrella,
            name: acc.name,
            role: "owner" as const,
            boardId: acc.boardId,
            memberCount: members.length,
            inviteCode: acc.inviteCode,
          };
        }),
      )
    ).filter((x): x is NonNullable<typeof x> => x !== null);

    // Invited (joined) boards.
    const joinedBoardRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const joined = (
      await Promise.all(
        joinedBoardRows
          .filter((r) => r.role !== "owner")
          .map(async (r) => {
            const board = await ctx.db
              .query("accountBoards")
              .withIndex("by_boardId", (q) =>
                q.eq("boardId", r.boardId),
              )
              .unique();
            if (!board) return null;
            const acc = await ctx.db
              .query("accounts")
              .withIndex("by_accountId", (q) =>
                q.eq("accountId", board.boardId),
              )
              .unique();
            const members = await getBoardMemberIds(ctx, board.boardId);
            return {
              accountId: board.accountId,
              umbrella: board.umbrella,
              name: board.name,
              role: "member" as const,
              boardId: board.boardId,
              memberCount: members.length,
              inviteCode: acc?.inviteCode ?? null,
            };
          }),
      )
    ).filter((x): x is NonNullable<typeof x> => x !== null);

    // Legacy couple board (backward compat) — surfaces as a 'couple' umbrella.
    let couple: AccountSummary | null = null;
    if (profile.linkedBoardId) {
      const board = await ctx.db
        .query("sharedBoards")
        .withIndex("by_boardId", (q) =>
          q.eq("boardId", profile.linkedBoardId!),
        )
        .unique();
      if (board) {
        const partnerId =
          board.memberA === userId ? board.memberB : board.memberA;
        couple = {
          accountId: profile.linkedBoardId,
          umbrella: "couple",
          name: "Couple Board",
          role: "owner",
          boardId: profile.linkedBoardId,
          memberCount: partnerId ? 2 : 1,
          inviteCode: null,
        };
      }
    }

    const byId = new Map<string, AccountSummary>();
    for (const a of [...owned, ...joined]) byId.set(a.accountId, a);
    const result = [...byId.values()];
    if (couple && !byId.has(couple.accountId)) result.push(couple);
    return result;
  },
});

export const getAccount = query({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc || !acc.boardId) return null;
    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    const isMember = memberRows.some((r) => r.userId === userId);
    if (!isMember) return null;
    return {
      accountId: acc.accountId,
      umbrella: acc.umbrella,
      name: acc.name,
      inviteCode: acc.inviteCode,
      boardId: acc.boardId,
    };
  },
});

export const renameAccount = mutation({
  args: { accountId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId !== userId) throw new Error("Only the owner can rename");
    const name = args.name.trim();
    if (name.length < 1 || name.length > 40) {
      throw new Error("Account name must be 1–40 characters");
    }
    await ctx.db.patch(acc._id, { name });
    if (acc.boardId) {
      const board = await ctx.db
        .query("accountBoards")
        .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
        .unique();
      if (board) await ctx.db.patch(board._id, { name });
    }
    return { success: true };
  },
});

export const rotateInviteCode = mutation({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId !== userId) throw new Error("Only the owner can rotate");
    let inviteCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateInviteCode();
      const clash = await ctx.db
        .query("accounts")
        .withIndex("by_inviteCode", (q) =>
          q.eq("inviteCode", candidate),
        )
        .unique();
      if (!clash) {
        inviteCode = candidate;
        break;
      }
    }
    if (!inviteCode) throw new Error("Failed to allocate an invite code");
    await ctx.db.patch(acc._id, { inviteCode });
    return { inviteCode };
  },
});

export const deleteAccount = mutation({
  args: { accountId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId !== userId) throw new Error("Only the owner can delete");

    const profile = await ensureProfileDoc(ctx, userId);
    const owned = (profile.accountIds ?? []).filter(
      (id) => id !== acc.accountId,
    );
    await ctx.db.patch(profile._id, { accountIds: owned });

    if (acc.boardId) {
      const members = await getBoardMemberIds(ctx, acc.boardId);
      const invites = await ctx.db
        .query("invites")
        .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
        .collect();
      for (const inv of invites) await ctx.db.delete(inv._id);
      const board = await ctx.db
        .query("accountBoards")
        .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
        .unique();
      if (board) await ctx.db.delete(board._id);
      const memberRows = await ctx.db
        .query("boardMembers")
        .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
        .collect();
      for (const m of memberRows) {
        await ctx.db.delete(m._id);
        if (m.userId !== userId) {
          const mp = await ctx.db
            .query("userProfiles")
            .withIndex("by_user", (q) => q.eq("userId", m.userId))
            .unique();
          if (mp && mp.joinedBoardIds) {
            await ctx.db.patch(mp._id, {
              joinedBoardIds: mp.joinedBoardIds.filter(
                (id) => id !== acc.boardId,
              ),
            });
          }
        }
      }
      void members;
    }
    await ctx.db.delete(acc._id);
    return { success: true };
  },
});

export const inviteByCode = mutation({
  args: { accountId: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

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
    if (!userId) throw new Error("Authentication required");

    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", args.accountId))
      .unique();
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId !== userId) throw new Error("Only the owner can invite");
    if (!acc.boardId) throw new Error("Account has no shared board");

    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    const tokenRows = await ctx.db
      .query("invites")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    const outstanding = tokenRows.filter(
      (r) => r.status === "pending" && !r.toUserId,
    ).length;
    if (memberRows.length + outstanding >= MAX_MEMBERS) {
      throw new Error(`An account can have at most ${MAX_MEMBERS} members`);
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
    if (!userId) throw new Error("Authentication required");
    await ensureProfileDoc(ctx, userId);

    const token = args.token.trim();
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite) {
      throw new Error("Invite link is invalid or expired");
    }

    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) => q.eq("accountId", invite.accountId))
      .unique();
    if (!acc || !acc.boardId) throw new Error("Account not found");

    const boardRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    if (boardRows.some((r) => r.userId === userId)) {
      await ctx.db.patch(invite._id, { status: "accepted", toUserId: userId });
      return { accountId: acc.accountId, boardId: acc.boardId, alreadyMember: true };
    }

    if (invite.status !== "pending") {
      throw new Error("Invite link has already been used");
    }

    const members = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
      .collect();
    if (members.length >= MAX_MEMBERS) {
      throw new Error(`An account can have at most ${MAX_MEMBERS} members`);
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
    if (!userId) throw new Error("Authentication required");
    const invite = await ctx.db.get(args.inviteId as Id<"invites">);
    if (!invite) throw new Error("Invite not found");
    if (invite.toUserId !== userId) {
      throw new Error("Not your invite");
    }
    if (invite.status !== "pending") {
      throw new Error("Invite already handled");
    }
    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", invite.boardId))
      .unique();
    if (!board) throw new Error("Board not found");
    if (board.members.length >= MAX_MEMBERS) {
      throw new Error(`An account can have at most ${MAX_MEMBERS} members`);
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
    if (!userId) throw new Error("Authentication required");
    const invite = await ctx.db.get(args.inviteId as Id<"invites">);
    if (!invite) throw new Error("Invite not found");
    if (invite.toUserId !== userId) {
      throw new Error("Not your invite");
    }
    await ctx.db.patch(invite._id, { status: "declined" });
    return { success: true };
  },
});

export const removeMember = mutation({
  args: { accountId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId !== ownerId) {
      throw new Error("Only the owner can remove members");
    }
    const target = args.userId as Id<"users">;
    if (target === ownerId) {
      throw new Error("Owner cannot be removed; transfer or delete the account");
    }
    if (!acc.boardId) throw new Error("Account has no shared board");

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
    if (!userId) throw new Error("Authentication required");
    const acc = await ctx.db
      .query("accounts")
      .withIndex("by_accountId", (q) =>
        q.eq("accountId", args.accountId),
      )
      .unique();
    if (!acc) throw new Error("Account not found");
    if (acc.ownerId === userId) {
      throw new Error("Owner cannot leave; transfer ownership or delete");
    }
    if (!acc.boardId) throw new Error("Account has no shared board");

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

export const pushAccountBoard = mutation({
  args: {
    boardId: v.string(),
    data: v.any(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");
    const board = await ctx.db
      .query("accountBoards")
      .withIndex("by_boardId", (q) => q.eq("boardId", args.boardId))
      .unique();
    if (!board) throw new ConvexError("Board not found");
    const memberRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    const isMember = memberRows.some((r) => r.userId === userId);
    if (!isMember) throw new ConvexError("Not a member of this board");

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
    return board;
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
