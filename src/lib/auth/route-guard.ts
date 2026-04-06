export type RouteGuardSession = { userId: string } | null;

export function canAccessAppRoute(session: RouteGuardSession) {
  if (!session?.userId) {
    return {
      allowed: false as const,
      reason: "unauthenticated" as const,
    };
  }

  return {
    allowed: true as const,
  };
}
