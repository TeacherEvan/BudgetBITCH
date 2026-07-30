// convex/feedback.ts
// Lightweight bug-report / feedback sink. Free-tier: Resend emails admin on
// each report (no paid crash service). Reports are also persisted for triage.

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_EMAIL = process.env.FEEDBACK_ADMIN_EMAIL ?? "ewiebotha@gmail.com";
const RESEND_FROM =
  process.env.AUTH_EMAIL_FROM ?? "BudgetBITCH <onboarding@resend.dev>";

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

    // Email admin (best-effort; never block the user on email failure)
    const apiKey = process.env.RESEND_API_KEY ?? "";
    if (apiKey) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [ADMIN_EMAIL],
            subject: `[BudgetBITCH] ${args.type === "bug" ? "Bug" : "Feedback"} report`,
            text: [
              `Type: ${args.type}`,
              `From: ${args.email ?? "anonymous"}`,
              `Locale: ${args.locale ?? "unknown"}`,
              `User-Agent: ${args.userAgent ?? "unknown"}`,
              "",
              args.message,
              "",
              "--- User Action Logs (Last 20) ---",
              args.actionLogs && args.actionLogs.length > 0
                ? args.actionLogs.join("\n")
                : "(no logs captured)",
              "",
              "--- Context ---",
              args.context ?? "(none)",
            ].join("\n"),
          }),
        });
      } catch {
        // Swallow — report is persisted regardless
      }
    }

    return { reportId };
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("feedbackReports")
      .withIndex("by_createdAt")
      .order("desc")
      .take(args.limit ?? 20);
    return rows;
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
