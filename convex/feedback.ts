// convex/feedback.ts
// Lightweight bug-report / feedback sink. Free-tier: Resend emails admin on
// each report (no paid crash service). Reports are also persisted for triage.

import { v } from "convex/values";
import { mutation, query, type QueryCtx, type MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const ADMIN_EMAIL = process.env.FEEDBACK_ADMIN_EMAIL ?? "ewiebotha@gmail.com";

/**
 * The report mutation is intentionally open to anonymous users so anyone can
 * file a bug without an account. Reads and deletes, however, are admin-only —
 * a report row contains the submitter's userAgent and action logs, which must
 * never be readable by other users.
 */
async function assertAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email !== ADMIN_EMAIL) {
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
    // Persist for triage
    const reportId = await ctx.db.insert("feedbackReports", {
      type: args.type,
      message: args.message,
      email: args.email ?? undefined,
      context: args.context ?? undefined,
      actionLogs: args.actionLogs ?? undefined,
      userAgent: args.userAgent ?? undefined,
      locale: args.locale ?? undefined,
      createdAt: Date.now(),
    });
    return { reportId };
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const rows = await ctx.db
      .query("feedbackReports")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 20);
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
 */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return Boolean(identity && identity.email === ADMIN_EMAIL);
  },
});
