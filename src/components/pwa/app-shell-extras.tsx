// components/pwa/app-shell-extras.tsx
'use client';

import { useConvexAuth } from '@convex-dev/auth/react';
import { PushGate } from '@/components/pwa/push-gate';
import { WeeklyPrivacyDisclaimer } from '@/components/privacy/weekly-disclaimer';
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';

/**
 * Client-only mounts for privacy, PWA install, and push surfaces.
 */
export function AppShellExtras({ locale }: { locale: 'th' | 'en' }) {
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  return (
    <>
      <WeeklyPrivacyDisclaimer locale={locale} />
      <PushGate locale={locale} isAuthenticated={isAuthenticated} />
      <PWAInstallPrompt locale={locale} />
    </>
  );
}
