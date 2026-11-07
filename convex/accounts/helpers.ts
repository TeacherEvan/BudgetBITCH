// convex/accounts/helpers.ts
import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";
import { INVITE_CODE_LEN, MAX_MEMBERS } from "./types";

// Unambiguous 32-character alphabet (no 0/O or 1/I confusion)
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateSecureRandomCode(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < len; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function generateInviteCode(): string {
  return generateSecureRandomCode(INVITE_CODE_LEN);
}

export async function ensureProfileDoc(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"userProfiles">> {
  const existing = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) return existing;
  for (let attempt = 0; attempt < 10; attempt++) {
    const shareCode = generateSecureRandomCode(INVITE_CODE_LEN);
    try {
      const id = await ctx.db.insert("userProfiles", {
        userId,
        shareCode,
        accountIds: [],
        joinedBoardIds: [],
      });
      const created = await ctx.db.get(id);
      if (created) return created;
    } catch {
      continue;
    }
  }
  throw new ConvexError("Failed to allocate a user sharing profile");
}

export async function getBoardMemberIds(
  ctx: QueryCtx,
  boardId: string,
): Promise<Id<"users">[]> {
  const rows = await ctx.db
    .query("boardMembers")
    .withIndex("by_board", (q) => q.eq("boardId", boardId))
    .take(MAX_MEMBERS);
  return rows
    .map((r) => r.userId)
    .filter((id): id is Id<"users"> => id !== undefined);
}
