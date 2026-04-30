import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

type SessionUser = NonNullable<Session["user"]> & {
  id: string;
  emailVerified: boolean;
};

type SessionWithAppUser = Session & {
  user?: SessionUser;
};

type TokenWithSubject = JWT & {
  sub?: string | null;
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
      if (profile?.sub) {
        token.sub = profile.sub;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const sessionWithAppUser = session as unknown as SessionWithAppUser;
        const tokenWithSubject = token as TokenWithSubject;

        sessionWithAppUser.user!.id = tokenWithSubject.sub ?? "";
        sessionWithAppUser.user!.emailVerified = Boolean(
          sessionWithAppUser.user!.email,
        );
      }

      return session;
    },
  },
});
