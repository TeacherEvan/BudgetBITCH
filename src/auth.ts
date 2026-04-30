import type { Session } from "next-auth";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getSessionUserFromToken,
  getTokenClaimsFromProfile,
  type SessionTokenClaims,
  type GoogleProfileClaims,
} from "./lib/auth/session-claims";

type SessionUser = NonNullable<Session["user"]> & {
  id: string;
  emailVerified: boolean;
};

type SessionWithAppUser = Session & {
  user?: SessionUser;
};

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, profile }) {
      const profileClaims = getTokenClaimsFromProfile(
        profile as GoogleProfileClaims | null | undefined,
      );

      token.sub = profileClaims.sub;
      token.emailVerified = profileClaims.emailVerified;

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const sessionWithAppUser = session as unknown as SessionWithAppUser;
        const tokenWithClaims = token as SessionTokenClaims;
        const sessionUser = sessionWithAppUser.user;

        if (sessionUser) {
          sessionWithAppUser.user = getSessionUserFromToken(sessionUser, tokenWithClaims);
        }
      }

      return session;
    },
  },
});
