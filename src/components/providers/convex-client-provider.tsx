"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Client-only Convex Auth. Tokens live in localStorage (not cookies) so that
// sign-in works inside in-app webviews (LINE, WhatsApp, etc.) which drop or
// block HTTP cookies. This means the server/middleware cannot read the auth
// token — protected routes are gated client-side via <RequireAuth />.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
  );
}
