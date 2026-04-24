import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
  isClerkSatelliteConfigured,
} from "@/lib/auth/clerk-config";

const protectedPathPrefixes = ["/dashboard", "/settings", "/auth/continue"];
const protectedApiPathPrefixes = [
  "/api/v1/auth/bootstrap",
  "/api/v1/check-ins",
  "/api/v1/integrations",
];

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

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!isClerkConfigured() || !publishableKey) {
    if (
      process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE?.trim() === "true" &&
      !isClerkSatelliteConfigured()
    ) {
      console.warn(
        "Clerk satellite mode is enabled without NEXT_PUBLIC_CLERK_DOMAIN or NEXT_PUBLIC_CLERK_PROXY_URL; skipping Clerk middleware.",
      );
    }

    const pathname = getRequestPathname(request);

    if (isProtectedPath(pathname)) {
      if (isApiPath(pathname)) {
        return Response.json({ error: clerkConfigurationErrorMessage }, { status: 503 });
      }

      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
  }

  return clerkMiddleware(
    async (auth, req) => {
      if (isProtectedPath(getRequestPathname(req))) {
        const redirectTarget = getRedirectTarget(req);
        const signInUrl = new URL("/sign-in", req.url);

        signInUrl.searchParams.set("redirectTo", redirectTarget);

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      return NextResponse.next();
    },
    { publishableKey },
  )(request, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
