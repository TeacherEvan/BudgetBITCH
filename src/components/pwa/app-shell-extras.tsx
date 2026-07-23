// components/pwa/app-shell-extras.tsx
'use client';

import { useConvexAuth } from '@convex-dev/auth/react';
import { PushGate } from '@/components/pwa/push-gate';
import { WeeklyPrivacyDisclaimer } from '@/components/privacy/weekly-disclaimer';

/**
 * Client-only mounts for privacy + push surfaces. The weekly disclaimer shows
 * to everyone (no auth needed); the push prompt is gated on authentication so
 * anonymous visitors are never asked.
 */
export function AppShellExtras({ locale }: { locale: 'th' | 'en' }) {
  const auth = useConvexAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;

  return (
    <>
      <WeeklyPrivacyDisclaimer locale={locale} />
      <PushGate locale={locale} isAuthenticated={isAuthenticated} />
    </>
  );
}
