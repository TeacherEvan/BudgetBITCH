'use client';

import { useEffect } from 'react';
import { registerSyncWorker, flushOfflineQueue } from '@/lib/convex/sync-snapshots';
import { requestPersistentStorage } from '@/lib/db/local-db';

// The Service Worker owns connectivity but the page owns the authenticated
// Convex client, so background `sync` / `periodicsync` events message this
// handler to drain the offline snapshot queue.
function handleServiceWorkerMessage(event: MessageEvent) {
  const data = event.data;
  if (data?.type === 'TRIGGER_FLUSH') {
    void flushOfflineQueue();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('budgetbitch:flushQueues'));
    }
  }
}

export function PWARegister() {
  useEffect(() => {
    registerSyncWorker();
    void requestPersistentStorage();
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  return null;
}
