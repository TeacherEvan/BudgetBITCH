// app/page.tsx
'use client'

import { useConvexAuth } from "@convex-dev/auth/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LanguageSelectModal } from "@/components/onboarding/language-select-modal";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { CleanAuthCard } from "@/components/auth/clean-auth-card";

export const dynamic = 'force-dynamic';

const LANGUAGE_STORAGE_KEY = "budgetbitch:locale";

function getStoredLocale(): 'th' | 'en' | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return (stored === 'th' || stored === 'en') ? stored : null;
}

function subscribeToLocale() {
  return () => {};
}

export default function Home() {
  const auth = useConvexAuth();
  const { isLoading, isAuthenticated } = auth ?? { isLoading: true, isAuthenticated: false };
  const storedLocale = useSyncExternalStore(subscribeToLocale, getStoredLocale, () => null);
  const locale = storedLocale || 'en';
  const [showLanguageModal, setShowLanguageModal] = useState(!storedLocale);

  // Once authenticated, go straight to dashboard (wizard popup happens there if not done)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isLoading, isAuthenticated]);

  // Loading or authenticated — show minimal loading state
  if (!isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-amber-400">Loading...</div>
        <PWAInstallPrompt locale={locale as 'th' | 'en'} />
      </div>
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
          setShowLanguageModal(false);
        }}
      />
      <PWAInstallPrompt locale={locale as 'th' | 'en'} />
    </div>
  );
}