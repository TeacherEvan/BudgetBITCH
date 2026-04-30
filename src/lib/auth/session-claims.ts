import type { Session } from "next-auth";
import type { Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";

export type GoogleProfileClaims = Profile;

export function getSessionUserFromToken(
  sessionUser: NonNullable<Session["user"]>,
  token: JWT,
) {
  return {
    ...sessionUser,
    id: token.sub ?? "",
    emailVerified: Boolean(token.emailVerified),
  };
}

export function getTokenClaimsFromProfile(profile: GoogleProfileClaims | null | undefined) {
  return {
    sub: profile?.sub,
    emailVerified: profile?.email_verified ?? undefined,
  };
}

export function applyTokenClaimsFromProfile(
  token: JWT,
  profile: GoogleProfileClaims | null | undefined,
) {
  const profileClaims = getTokenClaimsFromProfile(profile);

  if (profileClaims.sub != null) {
    token.sub = profileClaims.sub;
  }

  if (profileClaims.emailVerified != null) {
    token.emailVerified = profileClaims.emailVerified;
  }

  return token;
}
