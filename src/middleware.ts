import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clerkConfigurationErrorMessage,
  isClerkConfigured,
  isClerkSatelliteConfigured,
} from "@/lib/auth/clerk-config";

const protectedPathPrefixes = ["/dashboard", "/settings", "/auth/continue", "/api/v1"];

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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

  return clerkMiddleware({ publishableKey })(request, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
