import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

export const convexProfileSyncErrorMessage =
  "CONVEX_SYNC_SECRET is not configured for Convex profile sync.";

export type ConvexAuthenticatedIdentity = {
  tokenIdentifier: string;
  subject: string;
  issuer: string;
  email: string | null;
  name: string | null;
};

export async function getConvexAuthenticatedIdentity(): Promise<ConvexAuthenticatedIdentity | null> {
  const token = await convexAuthNextjsToken();

  if (!token) {
    return null;
  }

  return await fetchQuery(api.authSession.currentIdentity, {}, { token });
}

export async function syncConvexLocalProfile(input: {
  profileId: string;
  displayName: string | null;
}) {
  const token = await convexAuthNextjsToken();
  const syncSecret = process.env.CONVEX_SYNC_SECRET?.trim();

  if (!token) {
    throw new Error("Authentication is required.");
  }

  if (!syncSecret) {
    throw new Error(convexProfileSyncErrorMessage);
  }

  return await fetchMutation(
    api.authSession.syncLocalProfile,
    { ...input, syncSecret },
    { token },
  );
}
