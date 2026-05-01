import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasNonProductionSignedInE2eOverrideFromHeaders } from "@/lib/auth/e2e-auth-override";

const protectedPathPrefixes = ["/dashboard", "/settings", "/auth/continue"];
const protectedApiPathPrefixes = [
  "/api/v1/auth/bootstrap",
  "/api/v1/check-ins",
  "/api/v1/integrations",
];
const missingSessionApiError = {
  error: {
    code: "missing-session",
    message: "Authentication is required.",
  },
};

function isProtectedPath(pathname: string) {
  return [...protectedPathPrefixes, ...protectedApiPathPrefixes].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isApiPath(pathname: string) {
  return pathname === "/api/v1" || pathname.startsWith("/api/v1/");
}

function getRequestPathname(request: NextRequest) {
  const nextUrlPathname = request.nextUrl?.pathname;

  if (nextUrlPathname) {
    return nextUrlPathname;
  }

  return new URL(request.url).pathname;
}

function getRedirectTarget(request: NextRequest) {
  const pathname = getRequestPathname(request);
  const search = request.nextUrl?.search ?? new URL(request.url).search;

  return `${pathname}${search}`;
}

function hasSignedInE2eOverride(request: NextRequest) {
  return hasNonProductionSignedInE2eOverrideFromHeaders(request.headers);
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const pathname = getRequestPathname(request as NextRequest);

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (hasSignedInE2eOverride(request as NextRequest)) {
    return NextResponse.next();
  }

  if (await convexAuth.isAuthenticated()) {
    return NextResponse.next();
  }

  if (isApiPath(pathname)) {
    return Response.json(missingSessionApiError, { status: 401 });
  }

  const redirectTarget = getRedirectTarget(request as NextRequest);
  const signInUrl = new URL("/sign-in", request.url);

  signInUrl.searchParams.set("redirectTo", redirectTarget);

  return NextResponse.redirect(signInUrl);
}, { apiRoute: "/api/convex-auth" });

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
