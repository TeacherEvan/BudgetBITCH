// convex/legal.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Records a user's acceptance of the Terms of Service and Privacy Policy at
 * sign-up. Requires an authenticated user. One record per acceptance event;
 * re-recording on version bump is expected and intentional (audit trail).
 */
export const recordAgreement = mutation({
  args: {
    termsVersion: v.string(),
    privacyVersion: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // `ipAddress` is derived on the server (never from a client-supplied arg)
    // by the relay route that calls this mutation. It is resolution-time only
    // and may be undefined in environments where no forwarding header is set.
    const id = await ctx.db.insert("legalAgreements", {
      userId,
      termsVersion: args.termsVersion,
      privacyVersion: args.privacyVersion,
      acceptedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return { id: String(id) };
  },
});

/**
 * Records optional cookie consent. Auth-optional so it can be captured before
 * or without sign-in. The server write is fire-and-forget from the client and
 * must never block the consent UI. `userId` is resolved server-side when the
 * caller is authenticated; otherwise it stays undefined (anonymous consent).
 */
export const recordCookieConsent = mutation({
  args: {
    accepted: v.boolean(),
    optionalAccepted: v.boolean(),
    version: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const id = await ctx.db.insert("cookieConsents", {
      userId: userId ?? undefined,
      accepted: args.accepted,
      optionalAccepted: args.optionalAccepted,
      version: args.version,
      acceptedAt: Date.now(),
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    });

    return { id: String(id) };
  },
});
