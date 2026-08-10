import type { UserIdentity } from "convex/server";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { ConvexError } from "convex/values";

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
  let identity;
  try {
    identity = await ctx.auth.getUserIdentity();
  } catch (e) {
    // A rejected identity (e.g. an expired/revoked or environment-mismatched
    // JWT) would otherwise throw a plain Error that Convex redacts to an opaque
    // "Server Error" in production. Surface the real reason as a ConvexError so
    // the client and logs see it.
    throw new ConvexError(
      `Auth identity resolution failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!identity) return null;

  // The subject is the user ID in Convex Auth
  return identity.subject;
}
