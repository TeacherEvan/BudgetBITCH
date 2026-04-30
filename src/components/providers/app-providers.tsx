"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { SessionProvider } from "next-auth/react";
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

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
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

  const providerChildren = <SessionProvider>{children}</SessionProvider>;

  if (!convexUrlConfigured) {
    return <PwaProvider>{providerChildren}</PwaProvider>;
  }

  return (
    <PwaProvider>
      <SessionProvider>
        <ConvexAppProviders convexUrl={convexUrlValue}>{children}</ConvexAppProviders>
      </SessionProvider>
    </PwaProvider>
  );
}
