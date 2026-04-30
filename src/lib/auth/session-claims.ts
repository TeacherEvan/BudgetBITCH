import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

export type SessionTokenClaims = JWT & {
  sub?: string;
  emailVerified?: boolean;
};

export type GoogleProfileClaims = {
  sub?: string;
  email_verified?: boolean | null;
};

export function getSessionUserFromToken(
  sessionUser: NonNullable<Session["user"]>,
  token: SessionTokenClaims,
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
