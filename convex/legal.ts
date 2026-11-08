// convex/legal.ts
import { v, ConvexError } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_IP_LENGTH = 64;
const MAX_UA_LENGTH = 512;

function resolveTrustedRelayIp(
  ipAddress: string | undefined,
  relaySecret: string | undefined,
): string | undefined {
  if (!ipAddress) return undefined;
  const expectedSecret = process.env.CONVEX_SYNC_SECRET;
  // When CONVEX_SYNC_SECRET is configured on the deployment, only trust
  // `ipAddress` when the server relay supplies the matching secret. Direct
  // WebSocket callers cannot know `CONVEX_SYNC_SECRET`, preventing IP spoofing
  // in the legal audit trail.
  if (expectedSecret && relaySecret !== expectedSecret) {
    return undefined;
  }
  return ipAddress.slice(0, MAX_IP_LENGTH);
}

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
    relaySecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError("Authentication required");
    }

    // `ipAddress` is derived on the server by the relay route that calls this
    // mutation and verified via `relaySecret` when `CONVEX_SYNC_SECRET` is set.
    const id = await ctx.db.insert("legalAgreements", {
      userId,
      termsVersion: args.termsVersion.slice(0, 64),
      privacyVersion: args.privacyVersion.slice(0, 64),
      acceptedAt: Date.now(),
      ipAddress: resolveTrustedRelayIp(args.ipAddress, args.relaySecret),
      userAgent: args.userAgent ? args.userAgent.slice(0, MAX_UA_LENGTH) : undefined,
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
    // `ipAddress` is derived on the server by the relay route from the real
    // request header and gated by `relaySecret` when `CONVEX_SYNC_SECRET` is set.
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    relaySecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    const id = await ctx.db.insert("cookieConsents", {
      userId: userId ?? undefined,
      accepted: args.accepted,
      optionalAccepted: args.optionalAccepted,
      version: args.version.slice(0, 64),
      acceptedAt: Date.now(),
      ipAddress: resolveTrustedRelayIp(args.ipAddress, args.relaySecret),
      userAgent: args.userAgent ? args.userAgent.slice(0, MAX_UA_LENGTH) : undefined,
    });

    return { id: String(id) };
  },
});
