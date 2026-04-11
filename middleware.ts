import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  isClerkConfigured,
  isClerkSatelliteConfigured,
} from "@/lib/auth/clerk-config";

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

    return NextResponse.next();
  }

  return clerkMiddleware({ publishableKey })(request, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
