"use client";

import { useConvexAuth } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { isLocalUnlocked, hasLocalPassword } from "@/lib/auth/local-lock";

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

  useEffect(() => {
    setMounted(true);
    setLocalUnlocked(isLocalUnlocked());
  }, []);

  // An app is allowed if:
  // 1. Local vault is unlocked AND (user is Convex-authenticated OR using local/offline mode)
  // Or if no local lock is required and Convex is either authenticated or not blocking.
  const isUnlocked = localUnlocked;
  const isPermitted = isUnlocked && (isConvexAuthenticated || !hasLocalPassword());

  useEffect(() => {
    if (!mounted) return;

    // If Convex is still loading, wait for it unless we are unlocked locally without Convex requirement
    if (isConvexLoading && !isUnlocked) return;

    if (!isPermitted && !isConvexAuthenticated) {
      const url = new URL(redirectTo, window.location.origin);
      url.searchParams.set("redirectTo", window.location.pathname);
      router.replace(url.toString());
    }
  }, [mounted, isConvexLoading, isConvexAuthenticated, isPermitted, isUnlocked, redirectTo, router]);

  if (!mounted || (isConvexLoading && !isUnlocked) || (!isPermitted && !isConvexAuthenticated)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-pulse text-amber-400">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
