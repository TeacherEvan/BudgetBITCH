// components/pwa/app-shell-extras.tsx
'use client';

import { useConvexAuth } from '@convex-dev/auth/react';
import { PushGate } from '@/components/pwa/push-gate';
import { WeeklyPrivacyDisclaimer } from '@/components/privacy/weekly-disclaimer';
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';
import { ImmersiveShell } from '@/components/pwa/immersive-shell';

/**
 * Client-only mounts for privacy, PWA install, push, and immersive-shell surfaces.
 */
export function AppShellExtras({ locale }: { locale: string }) {
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  return (
    <>
      <ImmersiveShell />
      <WeeklyPrivacyDisclaimer />
      <PushGate locale={locale} isAuthenticated={isAuthenticated} />
      <PWAInstallPrompt locale={locale} />
    </>
  );
}
