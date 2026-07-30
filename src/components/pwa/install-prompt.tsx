// components/pwa/install-prompt.tsx
'use client';

/**
 * Install feature has been removed as per specification.
 * Renders null for clean compatibility.
 */
interface PWAInstallPromptProps {
  onDismiss?: () => void;
  locale?: string;
}

export function PWAInstallPrompt({}: PWAInstallPromptProps = {}) {
  return null;
}