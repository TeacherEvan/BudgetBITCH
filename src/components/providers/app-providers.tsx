"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo, type ReactNode } from "react";
import { isClerkClientConfigured } from "@/lib/auth/clerk-config";

type AppProvidersProps = {
  children: ReactNode;
};

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

  if (!publishableKey || !isClerkClientConfigured()) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {convexUrl ? (
        <ConvexClerkProviders convexUrl={convexUrl}>{children}</ConvexClerkProviders>
      ) : (
        children
      )}
    </ClerkProvider>
  );
}
