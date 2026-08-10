// app/page.tsx
'use client';

import { useConvexAuth } from "@convex-dev/auth/react";
import { useState, useEffect, useSyncExternalStore } from "react";
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

  // Initialize to the server-consistent value (no client storage available
  // during SSR) and resolve the real client state in an effect AFTER mount.
  // Reading sessionStorage/localStorage directly in the initializer causes a
  // React hydration mismatch (#418) because the server and first client render
  // would diverge. Gating the real read behind `mounted` keeps the first
  // client render identical to the server, then corrects post-hydration.
  const [splashDismissed, setSplashDismissed] = useState(true);
  const [localeChosen, setLocaleChosen] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSplashDismissed(sessionStorage.getItem('bb:splash-seen') === 'true');
    setLocaleChosen(Boolean(localStorage.getItem(LANGUAGE_STORAGE_KEY)));
  }, []);

  const showLanguageModal =
    mounted && typeof window !== "undefined" && !localeChosen;

  const finishLocaleSelect = (selection: { locale: string; currency: string }) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selection.locale);
      if (typeof document !== 'undefined') {
        document.cookie = `bb-locale=${selection.locale}; path=/; max-age=31536000; SameSite=Lax`;
      }
      // Persist the chosen currency as the display-currency override so the
      // whole app shows it from first load (Settings can change it later).
      localStorage.setItem('bb:currencyOverride', selection.currency);
      window.dispatchEvent(new Event('budgetbitch:currencyChanged'));
      void (async () => {
        try {
          const { getSettings, saveSettings } = await import('@/lib/db/local-db');
          const current = (await getSettings()) || {
            preferredLocale: 'en',
            voiceSettings: { enabled: false, rate: 1, pitch: 1 },
            privacyDisclaimerAccepted: true,
          };
          await saveSettings({ ...current, preferredCurrency: selection.currency } as never);
        } catch { /* non-fatal */ }
      })();
    } catch {
      // noop
    }
    setLocaleChosen(true);
    setSplashDismissed(true);
  };

  // Navigation to dashboard now happens in MoneySyncLoading's onComplete (after
  // its minimum display time), so no separate push effect is needed here.

  // Loading or authenticated — show Money In / Money Out Loading screen
  if (!isLoading && isAuthenticated && splashDismissed) {
    return (
      <MoneySyncLoading
        message="Connecting Money In & Money Out Engines..."
        onComplete={() => router.push('/dashboard')}
      />
    );
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

  // After splash screen animation: show country flags language modal BEFORE the login/sign-up card
  if (showLanguageModal) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <LanguageSelectModal
          isOpen={true}
          onComplete={finishLocaleSelect}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <CleanAuthCard initialFlow="signIn" redirectTo="/dashboard" />
    </div>
  );
}
