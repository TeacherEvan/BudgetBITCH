// app/page.tsx
'use client'

import { useConvexAuth } from "@convex-dev/auth/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LanguageSelectModal } from "@/components/onboarding/language-select-modal";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { CleanAuthCard } from "@/components/auth/clean-auth-card";
import { GoldenSplash } from "@/components/launch/golden-splash";

export const dynamic = 'force-dynamic';

const LANGUAGE_STORAGE_KEY = "budgetbitch:locale";

function getStoredLocale(): 'th' | 'en' | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return (stored === 'th' || stored === 'en') ? stored : null;
}

// SSR/test snapshot returns null; real client returns the stored value.
function subscribeToLocale() {
  return () => {};
}

// Hydration-safe "mounted" store: false on the server and during the first
// client render, true afterward. Gating localStorage-only UI behind this keeps
// server and client HTML identical, avoiding a React #418 hydration mismatch
// (which previously fired for returning visitors with a stored locale).
function subscribeToMount() {
  return () => {};
}

export default function Home() {
  const auth = useConvexAuth();
  const { isLoading, isAuthenticated } = auth ?? { isLoading: true, isAuthenticated: false };
  const storedLocale = useSyncExternalStore(subscribeToLocale, getStoredLocale, () => null);
  const locale = storedLocale || 'en';
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false);

  const [splashDismissed, setSplashDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("bb:splash-seen") === "true";
  });

  const showLanguageModal = mounted && !storedLocale;

  // Once authenticated, go straight to dashboard (wizard popup happens there if not done)
  useEffect(() => {
    if (!isLoading && isAuthenticated && splashDismissed) {
      window.location.href = '/dashboard';
    }
  }, [isLoading, isAuthenticated, splashDismissed]);

  // Loading or authenticated — show minimal loading state
  if (!isLoading && isAuthenticated && splashDismissed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-amber-400">Loading...</div>
        <PWAInstallPrompt locale={locale as 'th' | 'en'} />
      </div>
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

  // DEFAULT: The login screen is ALWAYS shown as the startup screen.
  // If no language is selected yet, the language select modal overlays on top.
  // After dismissing the language modal, the login card remains fully visible.
  return (
    <div className="relative">
      <CleanAuthCard initialFlow="signIn" redirectTo="/dashboard" />
      <LanguageSelectModal
        isOpen={showLanguageModal}
        onComplete={(selectedLocale) => {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLocale);
          // Re-read so the modal closes on the next server/client render.
          window.location.reload();
        }}
      />
      <PWAInstallPrompt locale={locale as 'th' | 'en'} />
    </div>
  );
}

