import { v } from "convex/values";
import { query } from "./_generated/server";
import { getViewerRecord, requireIdentity } from "./lib/auth";

const DEFAULT_WORKSPACE_LIMIT = 10;
const MAX_WORKSPACE_LIMIT = 25;

function clampWorkspaceLimit(limit: number) {
  return Math.max(1, Math.min(Math.floor(limit), MAX_WORKSPACE_LIMIT));
}

export const current = query({
  args: {
    workspaceLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const viewer = await getViewerRecord(ctx, identity.tokenIdentifier);

    if (!viewer) {
      return {
        projectionReady: false,
        identity: {
          tokenIdentifier: identity.tokenIdentifier,
          subject: identity.subject,
          issuer: identity.issuer,
          email: identity.email ?? null,
          name: identity.name ?? null,
        },
        user: null,
        workspaces: [],
      };
    }

    const workspaceLimit = clampWorkspaceLimit(
      args.workspaceLimit ?? DEFAULT_WORKSPACE_LIMIT,
    );
    const memberships = await ctx.db
      .query("workspaceMemberships")
      .withIndex("by_profileId_and_workspaceId", (q) =>
        q.eq("profileId", viewer.profileId),
      )
      .take(workspaceLimit);

    const workspaces = await Promise.all(
      memberships.map(async (membership) => {
        const workspace = await ctx.db
          .query("workspaces")
          .withIndex("by_workspaceId", (q) =>
            q.eq("workspaceId", membership.workspaceId),
          )
          .unique();

        return {
          workspaceId: membership.workspaceId,
          name: workspace?.name ?? null,
          type: workspace?.type ?? null,
          role: membership.role,
          isDefault: membership.isDefault,
          lastOpenedAt: membership.lastOpenedAt ?? null,
        };
      }),
    );

    workspaces.sort(
      (left, right) =>
        Number(right.isDefault) - Number(left.isDefault) ||
        (right.lastOpenedAt ?? 0) - (left.lastOpenedAt ?? 0) ||
        left.workspaceId.localeCompare(right.workspaceId),
    );

    return {
      projectionReady: true,
      identity: {
        tokenIdentifier: identity.tokenIdentifier,
        subject: identity.subject,
        issuer: identity.issuer,
        email: identity.email ?? null,
        name: identity.name ?? null,
      },
      user: {
        profileId: viewer.profileId,
        clerkUserId: viewer.clerkUserId,
        email: viewer.email ?? null,
        displayName: viewer.displayName ?? null,
        imageUrl: viewer.imageUrl ?? null,
      },
      workspaces,
    };
  },
});
