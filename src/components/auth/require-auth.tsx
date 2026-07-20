"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

// Client-side route guard for protected pages. Used instead of the server
// middleware cookie check once auth is stored in localStorage (which the
// server/middleware cannot read). While the token is loading we render
// nothing; unauthenticated users are redirected to /sign-in.
export function RequireAuth({
  children,
  redirectTo = "/sign-in",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set("redirectTo", window.location.pathname);
      router.replace(url.toString());
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-amber-400">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
