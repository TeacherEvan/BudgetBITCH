"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useEffect, useMemo, useRef, type ComponentProps, type ReactNode } from "react";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { getClerkFrontendHost, isClerkClientConfigured } from "@/lib/auth/clerk-config";
import { isAbsoluteHttpUrl } from "@/lib/url";

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
  const convexUrlValue = convexUrl ?? "";
  const clerkConfigured = isClerkClientConfigured();
  const clerkFrontendHost = getClerkFrontendHost(publishableKey);
  const convexUrlConfigured = isAbsoluteHttpUrl(convexUrl);
  const hasWarnedAboutConvexUrl = useRef(false);
  const hasWarnedAboutClerkConfig = useRef(false);

  useEffect(() => {
    if (!publishableKey || clerkConfigured || hasWarnedAboutClerkConfig.current) {
      return;
    }

    hasWarnedAboutClerkConfig.current = true;
    console.warn(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing, placeholder, or malformed; skipping Clerk provider.",
    );
  }, [clerkConfigured, publishableKey]);

  useEffect(() => {
    if (!convexUrl || convexUrlConfigured || hasWarnedAboutConvexUrl.current) {
      return;
    }

    hasWarnedAboutConvexUrl.current = true;
    console.warn(
      "NEXT_PUBLIC_CONVEX_URL must be an absolute http(s) URL; skipping Convex provider.",
    );
  }, [convexUrl, convexUrlConfigured]);

  const pwaChildren = <PwaProvider>{children}</PwaProvider>;

  if (!publishableKey || !clerkConfigured) {
    return pwaChildren;
  }

  const clerkProviderProps = {
    publishableKey,
    ...(clerkFrontendHost
      ? {
          __internal_clerkJSUrl: `https://${clerkFrontendHost}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`,
        }
      : {}),
  } as unknown as ComponentProps<typeof ClerkProvider>;

  return (
    <PwaProvider>
      <ClerkProvider {...clerkProviderProps}>
        {convexUrlConfigured ? (
          <ConvexClerkProviders convexUrl={convexUrlValue}>{children}</ConvexClerkProviders>
        ) : (
          children
        )}
      </ClerkProvider>
    </PwaProvider>
  );
}
