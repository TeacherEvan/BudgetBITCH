"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { normalizeConvexCloudUrl } from "@/lib/url";

type AppProvidersProps = {
  children: ReactNode;
};

function ConvexAppProviders({
  children,
  convexUrl,
}: AppProvidersProps & {
  convexUrl: string;
}) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}

export function AppProviders({ children }: AppProvidersProps) {
  const rawConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const convexUrl = normalizeConvexCloudUrl(rawConvexUrl);
  const hasWarnedAboutConvexUrl = useRef(false);

  useEffect(() => {
    if (!rawConvexUrl || convexUrl || hasWarnedAboutConvexUrl.current) {
      return;
    }

    hasWarnedAboutConvexUrl.current = true;
    console.warn(
      "NEXT_PUBLIC_CONVEX_URL must be an absolute http(s) URL; skipping Convex provider.",
    );
  }, [rawConvexUrl, convexUrl]);

  if (!convexUrl) {
    return <PwaProvider>{children}</PwaProvider>;
  }

  return (
    <PwaProvider>
      <ConvexAppProviders convexUrl={convexUrl}>{children}</ConvexAppProviders>
    </PwaProvider>
  );
}
