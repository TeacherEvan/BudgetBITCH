// components/pwa/install-prompt.tsx
'use client';

/**
 * Install feature has been removed as per specification.
 * Renders null for clean compatibility.
 */
export function PWAInstallPrompt({
  onDismiss,
  locale = 'en',
}: {
  onDismiss?: () => void;
  locale?: string;
}) {
  return null;
}