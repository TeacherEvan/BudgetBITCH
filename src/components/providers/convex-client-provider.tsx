"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud";
export const convex = new ConvexReactClient(convexUrl);

const DUMMY_REFRESH_TOKEN = "dummy";

function isRefreshTokenKey(key: string): boolean {
  return key.includes("convexAuthRefreshToken") || key === "__convexAuthRefreshToken";
}

/**
 * Wrapper around localStorage that filters out Convex Auth's "dummy" refresh token.
 * 
 * The Convex Auth Next.js proxy writes `refreshToken: "dummy"` to cookies for
 * security, but when using localStorage directly (as we do for webview support),
 * this dummy value can leak into localStorage. The client then tries to use it
 * to refresh the session, causing a Convex "Server Error" on every page load.
 * 
 * This wrapper intercepts get/set/remove for refresh token keys (including namespaced
 * keys like `__convexAuthRefreshToken_<namespace>`) and sanitizes the dummy value.
 */
function createSanitizedStorage(): Storage {
  if (typeof window === "undefined") {
    // Return a no-op storage for SSR
    return {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    };
  }

  const storage = window.localStorage;

  // Sweep storage and remove any stale dummy refresh tokens (including namespaced keys).
  for (let i = storage.length - 1; i >= 0; i--) {
    const k = storage.key(i);
    if (k && isRefreshTokenKey(k) && storage.getItem(k) === DUMMY_REFRESH_TOKEN) {
      storage.removeItem(k);
    }
  }

  return {
    get length() {
      return storage.length;
    },
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      const value = storage.getItem(key);
      if (isRefreshTokenKey(key) && value === DUMMY_REFRESH_TOKEN) {
        // Don't return the dummy token — treat as if it doesn't exist
        return null;
      }
      return value;
    },
    key(index: number) {
      return storage.key(index);
    },
    removeItem(key: string) {
      storage.removeItem(key);
    },
    setItem(key: string, value: string) {
      if (isRefreshTokenKey(key) && value === DUMMY_REFRESH_TOKEN) {
        // Don't persist the dummy token
        return;
      }
      storage.setItem(key, value);
    },
  };
}

// Client-only Convex Auth. Tokens live in localStorage (not cookies) so that
// sign-in works inside in-app webviews (LINE, WhatsApp, etc.) which drop or
// block HTTP cookies. This means the server/middleware cannot read the auth
// token — protected routes are gated client-side via <RequireAuth />.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const storage = createSanitizedStorage();
  return (
    <ConvexAuthProvider client={convex} storage={storage}>
      {children}
    </ConvexAuthProvider>
  );
}

