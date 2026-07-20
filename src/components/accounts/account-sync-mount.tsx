// components/accounts/account-sync-mount.tsx
'use client';

import { useAccountSync } from '@/hooks/use-account-sync';

/**
 * Side-effect-only component that drives Accounts-feature board sync
 * (pull/push/offline) app-wide. Renders nothing; mount once inside the Convex
 * provider so a linked account syncs automatically on every page — no manual
 * "sync" action required.
 */
export function AccountSyncMount() {
  useAccountSync();
  return null;
}
