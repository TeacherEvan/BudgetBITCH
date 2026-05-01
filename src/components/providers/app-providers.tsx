"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { isAbsoluteHttpUrl } from "@/lib/url";

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
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const convexUrlValue = convexUrl ?? "";
  const convexUrlConfigured = isAbsoluteHttpUrl(convexUrl);
  const hasWarnedAboutConvexUrl = useRef(false);

  useEffect(() => {
    if (!convexUrl || convexUrlConfigured || hasWarnedAboutConvexUrl.current) {
      return;
    }

    hasWarnedAboutConvexUrl.current = true;
    console.warn(
      "NEXT_PUBLIC_CONVEX_URL must be an absolute http(s) URL; skipping Convex provider.",
    );
  }, [convexUrl, convexUrlConfigured]);

  if (!convexUrlConfigured) {
    return <PwaProvider>{children}</PwaProvider>;
  }

  return (
    <PwaProvider>
      <ConvexAppProviders convexUrl={convexUrlValue}>{children}</ConvexAppProviders>
    </PwaProvider>
  );
}
