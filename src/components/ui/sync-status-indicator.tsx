// components/ui/sync-status-indicator.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Cloud, CloudOff, RefreshCw, ChevronDown } from 'lucide-react';
import { BOARD_CHANGED_EVENT } from '@/lib/types/budget';

interface SyncStatusIndicatorProps {
  locale: 'th' | 'en';
}

export function SyncStatusIndicator({ locale }: SyncStatusIndicatorProps) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [counts, setCounts] = useState({ accounts: 0, couple: 0, offline: 0 });
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const checkStatus = () => {
    if (typeof window === 'undefined') return;
    setOnline(window.navigator.onLine);
    
    let q1Size = 0;
    let q2Size = 0;
    let q3Size = 0;

    try {
      const q1 = JSON.parse(localStorage.getItem('budgetbitch:accountBoardQueue') || '[]');
      q1Size = Array.isArray(q1) ? q1.length : 0;
    } catch {
      q1Size = 0;
    }

    try {
      const q2 = JSON.parse(localStorage.getItem('budgetbitch:boardQueue') || '[]');
      q2Size = Array.isArray(q2) ? q2.length : 0;
    } catch {
      q2Size = 0;
    }

    try {
      const q3 = JSON.parse(localStorage.getItem('budgetbitch:offlineQueue') || '[]');
      q3Size = Array.isArray(q3) ? q3.length : 0;
    } catch {
      q3Size = 0;
    }

    setCounts({ accounts: q1Size, couple: q2Size, offline: q3Size });
    setPendingCount(q1Size + q2Size + q3Size);
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

  // Click outside to close dropdown
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const handleForceSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!online || syncing) return;
    setSyncing(true);
    try {
      // 1. Dispatch custom event for account sync and couple board sync hooks
      window.dispatchEvent(new Event('budgetbitch:flushQueues'));
      
      // 2. Dynamically import and run flushOfflineQueue
      const { flushOfflineQueue } = await import('@/lib/convex/sync-snapshots');
      await flushOfflineQueue();
      
      // 3. Re-check status after a short delay
      setTimeout(checkStatus, 1500);
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const labels = {
    th: {
      status: 'สถานะการซิงค์',
      online: 'ออนไลน์',
      offline: 'ออฟไลน์ (เซฟข้อมูลในเครื่อง)',
      sharedAccounts: 'บัญชีร่วมกัน',
      coupleBoard: 'บอร์ดคู่รัก',
      offlineSnapshots: 'สำรองข้อมูลความปลอดภัย',
      synced: 'ซิงค์เรียบร้อย ✓',
      pending: 'รออัปโหลด {n} รายการ ⏳',
      explanation: 'ข้อมูลของคุณจะถูกบันทึกลงในเครื่องทันที และจะอัปโหลดไปยังระบบคลาวด์โดยอัตโนมัติเมื่อออนไลน์ เพื่อให้ปลอดภัยและรวดเร็วเสมอ',
      manageAccounts: 'จัดการบัญชี',
      syncNow: 'ซิงค์ตอนนี้',
      syncing: 'กำลังซิงค์...',
    },
    en: {
      status: 'Sync Status',
      online: 'Online',
      offline: 'Offline (saved locally)',
      sharedAccounts: 'Shared Accounts',
      coupleBoard: 'Couple Board',
      offlineSnapshots: 'Security Snapshots',
      synced: 'Synced ✓',
      pending: '{n} pending updates ⏳',
      explanation: 'Your changes are saved instantly to your phone first. They upload automatically to the cloud when a connection is established.',
      manageAccounts: 'Manage Accounts',
      syncNow: 'Sync Now',
      syncing: 'Syncing...',
    },
  };

  const l = labels[locale];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={locale === 'th' ? 'ดูสถานะการซิงค์' : 'View sync status'}
        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all hover:bg-white/5 active:scale-95 ${
          !online
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            : pendingCount > 0
              ? 'border-amber-400/30 bg-amber-400/5 text-amber-300'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
        }`}
      >
        {!online ? (
          <CloudOff className="h-3.5 w-3.5" />
        ) : pendingCount > 0 ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Cloud className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">
          {!online ? (locale === 'th' ? 'ออฟไลน์' : 'Offline') : pendingCount > 0 ? (locale === 'th' ? 'กำลังซิงค์...' : 'Syncing...') : (locale === 'th' ? 'ซิงค์แล้ว' : 'Synced')}
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 z-50 w-72 rounded-2xl border border-[var(--gold-border-soft)] bg-black/95 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-semibold text-white text-sm">{l.status}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                online
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400 animate-pulse'
              }`}
            >
              {online ? (locale === 'th' ? 'ออนไลน์' : 'Online') : (locale === 'th' ? 'ออฟไลน์' : 'Offline')}
            </span>
          </div>

          <div className="space-y-3">
            {/* Shared Accounts Queue */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">{l.sharedAccounts}</span>
              <span className={counts.accounts > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                {counts.accounts > 0 ? l.pending.replace('{n}', String(counts.accounts)) : l.synced}
              </span>
            </div>

            {/* Couple Board Queue */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">{l.coupleBoard}</span>
              <span className={counts.couple > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                {counts.couple > 0 ? l.pending.replace('{n}', String(counts.couple)) : l.synced}
              </span>
            </div>

            {/* Offline Snapshots Queue */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/60">{l.offlineSnapshots}</span>
              <span className={counts.offline > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                {counts.offline > 0 ? l.pending.replace('{n}', String(counts.offline)) : l.synced}
              </span>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 flex flex-col gap-2">
            <p className="text-[11px] leading-relaxed text-white/45 text-left">
              {l.explanation}
            </p>
            {pendingCount > 0 && online && (
              <button
                type="button"
                onClick={handleForceSync}
                disabled={syncing}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-1.5 text-center text-xs font-bold text-black transition-all hover:bg-amber-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>{l.syncing}</span>
                  </>
                ) : (
                  <span>{l.syncNow}</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
