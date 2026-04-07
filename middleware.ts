import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/jobs(.*)",
  "/learn(.*)",
  "/settings(.*)",
  "/start-smart(.*)",
  "/api/v1/integrations(.*)",
  "/api/v1/jobs(.*)",
  "/api/v1/learn(.*)",
  "/api/v1/start-smart(.*)",
]);

function isExplicitPlaywrightBypassEnabled() {
  return (
    process.env.NODE_ENV === "test" &&
    process.env.E2E_BYPASS_AUTH === "true" &&
    process.env.E2E_BYPASS_AUTH_SOURCE === "playwright"
  );
}

export default clerkMiddleware(async (auth, request) => {
  if (isExplicitPlaywrightBypassEnabled()) {
    return NextResponse.next();
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/"],
};
