// convex/accounts/accountCrud.ts
import { v, ConvexError } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  UMBRELLA_KEYS,
  type UmbrellaKey,
  MAX_OWNED_ACCOUNTS,
  type AccountSummary,
} from "./types";
import {
  generateInviteCode,
  ensureProfileDoc,
  getBoardMemberIds,
} from "./helpers";

export const createAccount = mutation({
  args: {
    umbrella: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");

    const umbrella = args.umbrella;
    if (!UMBRELLA_KEYS.includes(umbrella as UmbrellaKey)) {
      throw new ConvexError("Invalid umbrella type");
    }
    const name = args.name.trim();
    if (name.length < 1 || name.length > 40) {
      throw new ConvexError("Account name must be 1–40 characters");
    }

    const profile = await ensureProfileDoc(ctx, userId);
    const owned = profile.accountIds ?? [];
    if (owned.length >= MAX_OWNED_ACCOUNTS) {
      throw new ConvexError(
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
    if (!inviteCode) throw new ConvexError("Failed to allocate an invite code");

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
      .take(50);
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
    const isMember = await ctx.db
      .query("boardMembers")
      .withIndex("by_user_and_board", (q) =>
        q.eq("userId", userId).eq("boardId", acc.boardId!),
      )
      .first();
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
    if (!userId) throw new ConvexError("Authentication required");
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
    if (!userId) throw new ConvexError("Authentication required");
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
    if (!userId) throw new ConvexError("Authentication required");
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