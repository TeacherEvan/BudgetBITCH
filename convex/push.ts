// convex/push.ts
// Web Push (VAPID) subscription storage — standard Convex functions.
import { v } from "convex/values";
import { mutation, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const subscribe = mutation({
  args: {
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({ p256dh: v.string(), auth: v.string() }),
    }),
  },
  handler: async (ctx, { subscription }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", subscription.endpoint))
      .unique();

    if (existing) {
      if (existing.userId === userId) {
        await ctx.db.patch(existing._id, {
          subscription,
          updatedAt: Date.now(),
        });
        return existing._id;
      }
      // Endpoint owned by another user — drop it, then re-create for this user.
      await ctx.db.delete(existing._id);
    }

    return ctx.db.insert("pushSubscriptions", {
      userId,
      endpoint: subscription.endpoint,
      subscription,
      updatedAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .unique();
    if (existing && existing.userId === userId) {
      await ctx.db.delete(existing._id);
    }
  },
});

// Internal: list a user's subscriptions (actions cannot read ctx.db directly).
export const _listForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// Internal: remove an expired subscription.
export const _remove = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
