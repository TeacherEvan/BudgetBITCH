import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

export const currentIdentity = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    return {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      issuer: identity.issuer,
      email: identity.email ?? null,
      name: identity.name ?? null,
    };
  },
});

export const syncLocalProfile = mutation({
  args: {
    profileId: v.string(),
    displayName: v.union(v.string(), v.null()),
    syncSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const syncSecret = process.env.CONVEX_SYNC_SECRET?.trim();

    if (!syncSecret) {
      throw new Error("CONVEX_SYNC_SECRET is not configured for Convex profile sync.");
    }

    if (args.syncSecret !== syncSecret) {
      throw new Error("Profile sync secret is invalid.");
    }

    const identity = await requireIdentity(ctx);
    const authUserId = await getAuthUserId(ctx);
    const now = Date.now();

    if (!authUserId) {
      throw new Error("Authentication is required to sync the local profile.");
    }

    const authUser = await ctx.db.get(authUserId);

    if (!authUser) {
      throw new Error("Convex Auth user record is not ready yet.");
    }

    await ctx.db.patch(authUserId, {
      tokenIdentifier: identity.tokenIdentifier,
      clerkUserId: identity.tokenIdentifier,
      profileId: args.profileId,
      displayName: args.displayName ?? undefined,
      imageUrl: undefined,
      lastSyncedAt: now,
    });

    return { syncedAt: now };
  },
});