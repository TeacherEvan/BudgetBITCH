'use client';

import { useEffect } from 'react';
import { registerSyncWorker } from '@/lib/convex/sync-snapshots';

export function PWARegister() {
  useEffect(() => {
    registerSyncWorker();
  }, []);

  return null;
}
