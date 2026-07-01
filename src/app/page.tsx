// app/page.tsx
'use client'

import { useConvexAuth } from "@convex-dev/auth/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LanguageSelectModal } from "@/components/onboarding/language-select-modal";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { CleanAuthCard } from "@/components/auth/clean-auth-card";
import { normalizeConvexCloudUrl } from "@/lib/url";

export const dynamic = 'force-dynamic';

const LANGUAGE_STORAGE_KEY = "budgetbitch:locale";
const WIZARD_COMPLETE_KEY = "budgetbitch:wizard-complete";

function getStoredLocale(): 'th' | 'en' | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return (stored === 'th' || stored === 'en') ? stored : null;
}

function getWizardComplete(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(WIZARD_COMPLETE_KEY);
  return stored === 'true';
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
  const wizardComplete = getWizardComplete();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !showLanguageModal) {
      // Always redirect to dashboard, the dashboard will pop up the wizard if not complete
      window.location.href = '/dashboard';
    }
  }, [isLoading, isAuthenticated, showLanguageModal, wizardComplete]);

  // Handle case where there's no Convex URL configured
  if (!normalizeConvexCloudUrl(process.env.NEXT_PUBLIC_CONVEX_URL)) {
    return <CleanAuthCard initialFlow="signIn" redirectTo="/dashboard" />;
  }

  // Show language select modal first
  if (showLanguageModal) {
    return (
      <LanguageSelectModal
        isOpen={true}
        onComplete={(selectedLocale) => {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLocale);
          setShowLanguageModal(false);
        }}
      />
    );
  }

  // Not authenticated - show welcome window
  if (!isAuthenticated) {
    return <CleanAuthCard initialFlow="signIn" redirectTo="/dashboard" />;
  }

  // Authenticated - redirect will happen via useEffect
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-amber-400">Loading...</div>
      <PWAInstallPrompt locale={locale as 'th' | 'en'} />
    </div>
  );
}