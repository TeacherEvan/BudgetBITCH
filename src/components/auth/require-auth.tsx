"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isLocalUnlocked, isLocalModePreferred } from "@/lib/auth/local-lock";
import { isConvexConfigured } from "@/components/providers/convex-client-provider";

// Client-side route guard for protected pages.
// Checks BOTH local vault unlock status AND Convex cloud authentication (if active).
// When local vault is locked or user is unauthenticated, redirects to sign-in/unlock.
export function RequireAuth({
  children,
  redirectTo = "/sign-in",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const auth = useConvexAuth();
  const { isLoading: isConvexLoading, isAuthenticated: isConvexAuthenticated } =
    auth ?? { isLoading: false, isAuthenticated: false };
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [localUnlocked, setLocalUnlocked] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocalUnlocked(isLocalUnlocked());
    setIsLocalMode(isLocalModePreferred() || !isConvexConfigured());
  }, []);

  // When operating in local mode or when Convex is not configured,
  // access depends solely on whether the local vault is unlocked.
  // When operating in cloud mode with Convex configured, require Convex auth or local unlock.
  const isAllowed = isLocalMode ? localUnlocked : (localUnlocked && (isConvexAuthenticated || !isConvexConfigured()));

  useEffect(() => {
    if (!mounted) return;

    // If in local mode, we don't wait for Convex
    if (isLocalMode) {
      if (!localUnlocked) {
        const url = new URL(redirectTo, window.location.origin);
        url.searchParams.set("redirectTo", window.location.pathname);
        router.replace(url.toString());
      }
      return;
    }

    // In cloud mode: wait for Convex if it's still loading
    if (isConvexLoading) return;

    if (!isAllowed) {
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set("redirectTo", window.location.pathname);
      router.replace(url.toString());
    }
  }, [mounted, isConvexLoading, isLocalMode, localUnlocked, isAllowed, redirectTo, router]);

  if (!mounted || (!isLocalMode && isConvexLoading) || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-amber-400">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
