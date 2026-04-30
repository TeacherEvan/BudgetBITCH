export type AuthenticatedSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    emailVerified?: Date | boolean | null;
  } | null;
} | null;

export function getAuthenticatedUserId(session: AuthenticatedSession) {
  return session?.user?.id?.trim() ?? "";
}

export function getAuthenticatedUserEmail(session: AuthenticatedSession) {
  if (!session?.user?.emailVerified) {
    return "";
  }

  return session.user.email?.trim().toLowerCase() ?? "";
}

export function getAuthenticatedUserDisplayName(session: AuthenticatedSession) {
  const name = session?.user?.name?.trim();

  return name || null;
}