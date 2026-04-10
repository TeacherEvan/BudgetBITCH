import type { UserIdentity } from "convex/server";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export type AuthContext = QueryCtx | MutationCtx;

export type WorkspaceAccess = {
  identity: UserIdentity;
  viewer: Doc<"users">;
  membership: Doc<"workspaceMemberships">;
};

export async function requireIdentity(
  ctx: AuthContext,
): Promise<UserIdentity> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity;
}

export async function getViewerRecord(
  ctx: AuthContext,
  tokenIdentifier: string,
): Promise<Doc<"users"> | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", tokenIdentifier),
    )
    .unique();
}

export async function requireWorkspaceAccess(
  ctx: AuthContext,
  workspaceId: string,
): Promise<WorkspaceAccess> {
  const identity = await requireIdentity(ctx);
  const viewer = await getViewerRecord(ctx, identity.tokenIdentifier);

  if (!viewer) {
    throw new Error("Viewer is not ready in Convex yet.");
  }

  const membership = await ctx.db
    .query("workspaceMemberships")
    .withIndex("by_profileId_and_workspaceId", (q) =>
      q.eq("profileId", viewer.profileId).eq("workspaceId", workspaceId),
    )
    .unique();

  if (!membership) {
    throw new Error("Not authorized for this workspace");
  }

  return {
    identity,
    viewer,
    membership,
  };
}

export async function getWorkspaceAccess(
  ctx: AuthContext,
  workspaceId: string,
): Promise<WorkspaceAccess | null> {
  try {
    return await requireWorkspaceAccess(ctx, workspaceId);
  } catch {
    return null;
  }
}
