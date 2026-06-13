import type { UserIdentity } from "convex/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export type AuthContext = QueryCtx | MutationCtx;

export async function requireIdentity(
  ctx: AuthContext,
): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity;
}

export async function getAuthUserId(ctx: AuthContext): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // The subject is the user ID in Convex Auth
  return identity.subject;
}
