type AuthenticatedSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  } | null;
} | null;

export function getAuthenticatedUserId(session: AuthenticatedSession) {
  return session?.user?.id?.trim() ?? "";
}

export function getAuthenticatedUserEmail(session: AuthenticatedSession) {
  if (!session?.user?.emailVerified) {
    return "";
  }

  return session.user.email?.trim() ?? "";
}
