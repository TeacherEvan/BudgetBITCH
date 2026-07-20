import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasNonProductionSignedInE2eOverrideFromHeaders } from "@/lib/auth/e2e-auth-override";
import {
  AUTH_ROUTES,
  isProtectedPath,
  isApiPath,
} from "@/lib/auth/routes";

// NOTE: As of the webview-localStorage-auth refactor, Convex Auth tokens live
// in localStorage (client-only) — the server/middleware cannot read them. So
// this middleware no longer gates protected routes by cookie; that is done
// client-side via <RequireAuth /> in each protected page tree. The middleware
// is kept only for the non-production E2E signed-in override header and as a
// thin pass-through. Production auth correctness relies on the client guard.

const missingSessionApiError = {
  error: {
    code: "missing-session",
    message: "Authentication is required.",
  },
};

function getRequestPathname(request: NextRequest) {
  const nextUrlPathname = request.nextUrl?.pathname;
  if (nextUrlPathname) return nextUrlPathname;
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

export default function middleware(request: NextRequest) {
  const pathname = getRequestPathname(request);

  // Non-production E2E signed-in override: let the request through so the
  // client-side guard (which the test forces) can resolve a session.
  if (hasSignedInE2eOverride(request)) {
    return NextResponse.next();
  }

  // API routes still need a real auth signal. In client-only auth mode the
  // request has no server-visible token, so the API route itself must rely on
  // a client-forwarded bearer (see legal routes). For any other protected API
  // we 401 to avoid serving authed data without a verifiable identity.
  if (isProtectedPath(pathname) && isApiPath(pathname)) {
    return Response.json(missingSessionApiError, { status: 401 });
  }

  // Protected PAGES are gated client-side (RequireAuth); let the request
  // through so the client guard can redirect unauthenticated users.
  if (isProtectedPath(pathname) && !isApiPath(pathname)) {
    return NextResponse.next();
  }

  // Unused redirect target kept for parity with prior behaviour if needed.
  void getRedirectTarget;
  void AUTH_ROUTES;

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
