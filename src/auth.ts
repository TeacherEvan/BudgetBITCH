import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getGoogleOAuthCredentials } from "@/lib/auth/oauth-config";

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? "budgetbitch-local-auth-secret"
    : undefined);
const googleOAuthCredentials = getGoogleOAuthCredentials();
const googleProvider = googleOAuthCredentials
  ? Google({
      ...googleOAuthCredentials,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers: googleProvider ? [googleProvider] : [],
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, profile }) {
      if (profile && typeof profile === "object" && "sub" in profile && typeof profile.sub === "string") {
        token.sub = profile.sub;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.emailVerified = session.user.email ? new Date() : null;
      }

      return session;
    },
  },
});