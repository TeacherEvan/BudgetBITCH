import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

function normalizePasswordEmail(email: unknown) {
  if (typeof email !== "string") {
    throw new Error("An email address is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("An email address is required.");
  }

  return normalizedEmail;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: normalizePasswordEmail(params.email),
        };
      },
    }),
  ],
});
