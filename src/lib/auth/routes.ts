export const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  continue: "/auth/continue",
  convexAuthApi: "/api/convex-auth",
} as const;

export const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/settings",
  AUTH_ROUTES.continue,
] as const;

export const PROTECTED_API_PREFIXES = [
  "/api/v1/auth/bootstrap",
  "/api/v1/check-ins",
  "/api/v1/integrations",
] as const;

export const PUBLIC_API_PREFIXES = [
  "/api/v1/health",
] as const;

export function isProtectedPath(pathname: string): boolean {
  const protectedPrefixes = [...PROTECTED_PAGE_PREFIXES, ...PROTECTED_API_PREFIXES];
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api/v1" || pathname.startsWith("/api/v1/");
}
