// app/page.tsx
'use client';

import { useConvexAuth } from "@convex-dev/auth/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { LanguageSelectModal } from "@/components/onboarding/language-select-modal";
import { CleanAuthCard } from "@/components/auth/clean-auth-card";
import { GoldenSplash } from "@/components/launch/golden-splash";
import { MoneySyncLoading } from "@/components/ui/money-sync-loading";

export const dynamic = 'force-dynamic';

const LANGUAGE_STORAGE_KEY = "budgetbitch:locale";

function subscribeToMount() {
  return () => {};
}

export default function Home() {
  const router = useRouter();
  const auth = useConvexAuth();
  const { isLoading, isAuthenticated } = auth ?? { isLoading: true, isAuthenticated: false };

  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);

  // Synchronously initialize splash state to avoid state oscillation / double-renders on mount
  const [splashDismissed, setSplashDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem("bb:splash-seen") === "true";
  });

  const showLanguageModal = mounted && typeof window !== "undefined" && !localStorage.getItem(LANGUAGE_STORAGE_KEY);

  const finishLocaleSelect = (selectedLocale: 'th' | 'en') => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLocale);
    } catch {
      // noop
    }
    setSplashDismissed(true);
  };

  // Once authenticated, perform clean client-side navigation to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && splashDismissed) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, splashDismissed, router]);

  // Loading or authenticated — show Money In / Money Out Loading screen
  if (!isLoading && isAuthenticated && splashDismissed) {
    return <MoneySyncLoading message="Connecting Money In & Money Out Engines..." />;
  }

  if (mounted && !splashDismissed) {
    return (
      <GoldenSplash 
        onProceed={() => {
          sessionStorage.setItem("bb:splash-seen", "true");
          setSplashDismissed(true);
        }} 
      />
    );
  }

  return (
    <div className="relative">
      <CleanAuthCard initialFlow="signIn" redirectTo="/dashboard" />
      <LanguageSelectModal
        isOpen={showLanguageModal}
        onComplete={finishLocaleSelect}
      />
    </div>
  );
}
