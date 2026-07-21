"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const DUMMY_REFRESH_TOKEN = "dummy";

/**
 * Wrapper around localStorage that filters out Convex Auth's "dummy" refresh token.
 * 
 * The Convex Auth Next.js proxy writes `refreshToken: "dummy"` to cookies for
 * security, but when using localStorage directly (as we do for webview support),
 * this dummy value can leak into localStorage. The client then tries to use it
 * to refresh the session, causing a Convex "Server Error" on every page load.
 * 
 * This wrapper intercepts get/set/remove for the refresh token key and sanitizes
 * the dummy value.
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

  const REFRESH_TOKEN_KEY = "__convexAuthRefreshToken";
  const storage = window.localStorage;

  // Remove any stale dummy refresh token left over from a proxy-based flow.
  if (storage.getItem(REFRESH_TOKEN_KEY) === DUMMY_REFRESH_TOKEN) {
    storage.removeItem(REFRESH_TOKEN_KEY);
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
      if (key === REFRESH_TOKEN_KEY && value === DUMMY_REFRESH_TOKEN) {
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
      if (key === REFRESH_TOKEN_KEY && value === DUMMY_REFRESH_TOKEN) {
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
