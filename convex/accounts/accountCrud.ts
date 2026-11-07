// convex/accounts/accountCrud.ts
import { v, ConvexError } from "convex/values";
import { query, mutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
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

    // Helper cache to avoid redundant userProfiles lookups across multiple boards
    const profileCache = new Map<string, string | null>();
    const getProfileDisplayName = async (memberId: Id<"users">): Promise<string | null> => {
      if (profileCache.has(memberId)) return profileCache.get(memberId)!;
      const mp = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", memberId))
        .unique();
      const name = mp?.displayName ?? null;
      profileCache.set(memberId, name);
      return name;
    };

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
          // Fetch display names for all members with caching
          const memberProfiles = await Promise.all(
            members.map(async (memberId) => ({
              userId: memberId,
              displayName: await getProfileDisplayName(memberId),
            })),
          );
          const memberDisplayNames: Record<string, string> = {};
          for (const m of memberProfiles) {
            if (m.displayName) memberDisplayNames[m.userId] = m.displayName;
          }
          return {
            accountId: acc.accountId,
            umbrella: acc.umbrella,
            name: acc.name,
            role: "owner" as const,
            boardId: acc.boardId,
            memberCount: members.length,
            inviteCode: acc.inviteCode,
            memberDisplayNames,
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
                q.eq("accountId", board.accountId),
              )
              .unique();
            const memberIds = await getBoardMemberIds(ctx, board.boardId);
            const memberProfiles = await Promise.all(
              memberIds.map(async (memberId) => ({
                userId: memberId,
                displayName: await getProfileDisplayName(memberId),
              })),
            );
            const memberDisplayNames: Record<string, string> = {};
            for (const m of memberProfiles) {
              if (m.displayName) memberDisplayNames[m.userId] = m.displayName;
            }
            return {
              accountId: board.accountId,
              umbrella: board.umbrella,
              name: board.name,
              role: "member" as const,
              boardId: board.boardId,
              memberCount: memberProfiles.length,
              inviteCode: acc?.inviteCode ?? null,
              memberDisplayNames,
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
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId !== userId) throw new ConvexError("Only the owner can rename");
    const name = args.name.trim();
    if (name.length < 1 || name.length > 40) {
      throw new ConvexError("Account name must be 1–40 characters");
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
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId !== userId) throw new ConvexError("Only the owner can rotate");
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
    await ctx.db.patch(acc._id, { inviteCode });
    return { inviteCode };
  },
});

export const setDisplayName = mutation({
  args: { displayName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Authentication required");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new ConvexError("Profile not found");
    await ctx.db.patch(profile._id, { displayName: args.displayName });
    return { success: true };
  },
});

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
      displayName: profile.displayName ?? null,
      shareCode: profile.shareCode,
      linkedBoardId: profile.linkedBoardId ?? null,
    };
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
    if (!acc) throw new ConvexError("Account not found");
    if (acc.ownerId !== userId) throw new ConvexError("Only the owner can delete");

    const profile = await ensureProfileDoc(ctx, userId);
    const owned = (profile.accountIds ?? []).filter(
      (id) => id !== acc.accountId,
    );
    await ctx.db.patch(profile._id, { accountIds: owned });

    if (acc.boardId) {
      const members = await getBoardMemberIds(ctx, acc.boardId);
      // Batch delete invites
      while (true) {
        const batch = await ctx.db
          .query("invites")
          .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
          .take(250);
        for (const inv of batch) await ctx.db.delete(inv._id);
        if (batch.length < 250) break;
      }
      const board = await ctx.db
        .query("accountBoards")
        .withIndex("by_boardId", (q) => q.eq("boardId", acc.boardId!))
        .unique();
      if (board) await ctx.db.delete(board._id);
      // Batch delete boardMembers
      while (true) {
        const batch = await ctx.db
          .query("boardMembers")
          .withIndex("by_board", (q) => q.eq("boardId", acc.boardId!))
          .take(250);
        for (const m of batch) {
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
        if (batch.length < 250) break;
      }
      void members;
    }
    await ctx.db.delete(acc._id);
    return { success: true };
  },
});