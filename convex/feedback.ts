// convex/feedback.ts
// Lightweight bug-report / feedback sink. Free-tier: Resend emails admin on
// each report (no paid crash service). Reports are also persisted for triage.

import { v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Admin authorization is driven entirely by the FEEDBACK_ADMIN_EMAIL Convex env
 * var. There is deliberately NO hardcoded fallback: if the var is unset, admin
 * access is refused rather than silently granted to a baked-in address. Set it
 * in the Convex dashboard (prod + preview) to the admin's verified email.
 */
function getAdminEmail(): string | undefined {
  return process.env.FEEDBACK_ADMIN_EMAIL;
}

/**
 * The report mutation is intentionally open to anonymous users so anyone can
 * file a bug without an account. Reads and deletes, however, are admin-only —
 * a report row contains the submitter's userAgent and action logs, which must
 * never be readable by other users.
 */
async function assertAdmin(ctx: QueryCtx | MutationCtx) {
  const adminEmail = getAdminEmail();
  const identity = await ctx.auth.getUserIdentity();
  if (!adminEmail || !identity || identity.email !== adminEmail) {
    throw new Error("Not authorized to access bug reports.");
  }
}

export const report = mutation({
  args: {
    type: v.union(v.literal("bug"), v.literal("feedback")),
    message: v.string(),
    email: v.optional(v.string()),
    context: v.optional(v.string()),
    actionLogs: v.optional(v.array(v.string())),
    userAgent: v.optional(v.string()),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Sanitize and enforce size boundaries
    const message = args.message.slice(0, 4000);
    const email = args.email ? args.email.slice(0, 320) : undefined;
    const context = args.context ? args.context.slice(0, 2000) : undefined;
    const userAgent = args.userAgent ? args.userAgent.slice(0, 512) : undefined;
    const locale = args.locale ? args.locale.slice(0, 32) : undefined;
    const actionLogs = args.actionLogs
      ? args.actionLogs.slice(-50).map((l) => l.slice(0, 500))
      : undefined;

    // Rate-limit: maximum 20 reports created globally in the last 60 seconds
    const oneMinuteAgo = Date.now() - 60_000;
    const recent = await ctx.db
      .query("feedbackReports")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", oneMinuteAgo))
      .take(21);
    if (recent.length >= 20) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // Persist for triage
    const reportId = await ctx.db.insert("feedbackReports", {
      type: args.type,
      message,
      email,
      context,
      actionLogs,
      userAgent,
      locale,
      createdAt: Date.now(),
    });
    return { reportId };
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const safeLimit = Math.min(Math.max(args.limit ?? 20, 1), 100);
    const rows = await ctx.db
      .query("feedbackReports")
      .withIndex("by_createdAt")
      .order("desc")
      .take(safeLimit);
    return rows;
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("feedbackReports") },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    await ctx.db.delete(args.reportId);
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      email: identity.email ?? null,
      name: identity.name ?? null,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

/**
 * Server-verified admin check. Replaces the previous client-side
 * `currentUser?.email === ADMIN_EMAIL` gate (which also had an `admin=1` URL
 * bypass) — authorization must live in the backend, not in a React prop.
 * Mirrors assertAdmin: admin-ness is derived purely from FEEDBACK_ADMIN_EMAIL.
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const adminEmail = getAdminEmail();
    const identity = await ctx.auth.getUserIdentity();
    return Boolean(adminEmail && identity && identity.email === adminEmail);
  },
});
