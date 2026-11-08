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

    // One query for ALL owned accounts (by_owner index) — no per-account
    // `accounts` fetch. Dedupe by accountId since the profile list can repeat.
    const ownedAccs = await ctx.db
      .query("accounts")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .take(MAX_OWNED_ACCOUNTS + 16);
    const ownedAccById = new Map<string, (typeof ownedAccs)[number]>();
    for (const acc of ownedAccs) {
      if (ownedIds.includes(acc.accountId) && !ownedAccById.has(acc.accountId)) {
        ownedAccById.set(acc.accountId, acc);
      }
    }

    // Board lookup cache: each accountBoard is fetched at most once.
    // (Explicit `await ... | null` type — typeof self-reference is circular.)
    const boardCache = new Map<
      string,
      { boardId: string; accountId: string; umbrella: string; name: string } | null
    >();
    async function getBoardByIdOnce(
      boardId: string,
    ): Promise<{ boardId: string; accountId: string; umbrella: string; name: string } | null> {
      if (boardCache.has(boardId)) return boardCache.get(boardId) ?? null;
      const board = await ctx.db
        .query("accountBoards")
        .withIndex("by_boardId", (q) => q.eq("boardId", boardId))
        .unique();
      boardCache.set(boardId, board);
      return board;
    }

    // Member-ids cache: each board's members are fetched at most once.
    const memberIdsCache = new Map<string, Id<"users">[]>();
    async function getMemberIdsOnce(boardId: string) {
      if (memberIdsCache.has(boardId)) return memberIdsCache.get(boardId)!;
      const ids = await getBoardMemberIds(ctx, boardId);
      memberIdsCache.set(boardId, ids);
      return ids;
    }

    // Hoisted display-name lookup: one userProfiles query per UNIQUE member
    // across every board, resolved in a single Promise.all batch BEFORE
    // building the account list (no per-account profile fan-out).
    const allMemberIds = new Set<Id<"users">>();
    for (const acc of ownedAccById.values()) {
      if (!acc.boardId) continue;
      const ids = await getMemberIdsOnce(acc.boardId);
      for (const id of ids) allMemberIds.add(id);
    }
    const joinedBoardRows = await ctx.db
      .query("boardMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    for (const r of joinedBoardRows) {
      if (r.role === "owner") continue;
      const ids = await getMemberIdsOnce(r.boardId);
      for (const id of ids) allMemberIds.add(id);
    }
    const profileEntries = await Promise.all(
      Array.from(allMemberIds).map(async (memberId) => {
        const mp = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", memberId))
          .unique();
        return [memberId, mp?.displayName ?? null] as const;
      }),
    );
    const profileCache = new Map<Id<"users">, string | null>(profileEntries);

    const owned = (
      await Promise.all(
        Array.from(ownedAccById.values()).map(async (acc) => {
          if (!acc.boardId) return null;
          const board = await getBoardByIdOnce(acc.boardId);
          const members = board ? await getMemberIdsOnce(board.boardId) : [];
          const memberDisplayNames: Record<string, string> = {};
          for (const memberId of members) {
            const displayName = profileCache.get(memberId);
            if (displayName) memberDisplayNames[memberId] = displayName;
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

    // Invited (joined) boards — reuses hoisted caches above.
    const joined = (
      await Promise.all(
        joinedBoardRows
          .filter((r) => r.role !== "owner")
          .map(async (r) => {
            const board = await getBoardByIdOnce(r.boardId);
            if (!board) return null;
            const acc = await ctx.db
              .query("accounts")
              .withIndex("by_accountId", (q) =>
                q.eq("accountId", board.accountId),
              )
              .unique();
            const memberIds = await getMemberIdsOnce(board.boardId);
            const memberDisplayNames: Record<string, string> = {};
            for (const memberId of memberIds) {
              const displayName = profileCache.get(memberId);
              if (displayName) memberDisplayNames[memberId] = displayName;
            }
            return {
              accountId: board.accountId,
              umbrella: board.umbrella,
              name: board.name,
              role: "member" as const,
              boardId: board.boardId,
              memberCount: memberIds.length,
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