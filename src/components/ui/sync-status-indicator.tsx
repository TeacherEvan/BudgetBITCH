// components/ui/sync-status-indicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';

interface SyncStatusIndicatorProps {
  locale: 'th' | 'en';
}

export function SyncStatusIndicator({ locale }: SyncStatusIndicatorProps) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const checkStatus = () => {
    if (typeof window === 'undefined') return;
    setOnline(window.navigator.onLine);
    
    try {
      const q1 = JSON.parse(localStorage.getItem('budgetbitch:accountBoardQueue') || '[]');
      const q2 = JSON.parse(localStorage.getItem('budgetbitch:boardQueue') || '[]');
      const q3 = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
      setPendingCount(q1.length + q2.length + q3.length);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    checkStatus();

    const handleEvent = () => checkStatus();

    window.addEventListener('online', handleEvent);
    window.addEventListener('offline', handleEvent);
    window.addEventListener(BOARD_CHANGED_EVENT, handleEvent);

    return () => {
      window.removeEventListener('online', handleEvent);
      window.removeEventListener('offline', handleEvent);
      window.removeEventListener(BOARD_CHANGED_EVENT, handleEvent);
    };
  }, []);

  if (!online) {
    return (
      <div 
        className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 cursor-help animate-pulse"
        title={locale === 'th' ? 'ออฟไลน์ — ข้อมูลจะเซฟไว้ในเครื่อง' : 'Offline — saving changes locally'}
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{locale === 'th' ? 'ออฟไลน์' : 'Offline'}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div 
        className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/5 px-2.5 py-1 text-xs font-semibold text-amber-300 cursor-wait"
        title={locale === 'th' ? `รออัปโหลด ${pendingCount} รายการ` : `Pending sync: ${pendingCount} items`}
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span>{locale === 'th' ? 'กำลังซิงค์...' : 'Syncing...'}</span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs font-semibold text-emerald-400 cursor-default"
      title={locale === 'th' ? 'ซิงค์ข้อมูลเรียบร้อยแล้ว' : 'All changes synced'}
    >
      <Cloud className="h-3.5 w-3.5 text-emerald-400" />
      <span className="hidden sm:inline">{locale === 'th' ? 'ซิงค์แล้ว' : 'Synced'}</span>
    </div>
  );
}
