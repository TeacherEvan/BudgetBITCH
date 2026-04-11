"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo, type ReactNode } from "react";
import { isClerkClientConfigured } from "@/lib/auth/clerk-config";
import { isAbsoluteHttpUrl } from "@/lib/url";

type AppProvidersProps = {
  children: ReactNode;
};

let hasWarnedAboutConvexUrl = false;

function ConvexClerkProviders({
  children,
  convexUrl,
}: AppProvidersProps & {
  convexUrl: string;
}) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

export function AppProviders({ children }: AppProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const convexUrlValue = convexUrl ?? "";
  const convexUrlConfigured = isAbsoluteHttpUrl(convexUrl);

  if (!publishableKey || !isClerkClientConfigured()) {
    return <>{children}</>;
  }

  if (convexUrl && !convexUrlConfigured) {
    if (!hasWarnedAboutConvexUrl) {
      hasWarnedAboutConvexUrl = true;
      console.warn(
        "NEXT_PUBLIC_CONVEX_URL must be an absolute http(s) URL; skipping Convex provider.",
      );
    }
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {convexUrlConfigured ? (
        <ConvexClerkProviders convexUrl={convexUrlValue}>{children}</ConvexClerkProviders>
      ) : (
        children
      )}
    </ClerkProvider>
  );
}
