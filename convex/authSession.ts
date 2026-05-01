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
    email: v.string(),
    displayName: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const email = args.email.trim().toLowerCase();
    const now = Date.now();

    if (!email) {
      throw new Error("An email address is required to sync the local profile.");
    }

    const authUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .unique();

    if (!authUser) {
      throw new Error("Convex Auth user record is not ready yet.");
    }

    await ctx.db.patch(authUser._id, {
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