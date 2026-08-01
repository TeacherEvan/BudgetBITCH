'use client';

import { useEffect, useState } from 'react';
import { NOTICE_EVENT, type NoticeDetail } from '@/lib/ui/notice';

const AUTO_DISMISS_MS = 4000;

const LEVEL_STYLES: Record<NoticeDetail['level'], string> = {
  info: 'border-white/15 bg-black/85 text-white',
  success: 'border-emerald-400/40 bg-emerald-950/90 text-emerald-200',
  error: 'border-rose-400/40 bg-rose-950/90 text-rose-200',
};

/**
 * Renders transient notices raised via `notify()`. Mounted once in the root
 * layout so any surface (including plain store functions) can give the user
 * feedback that an action actually happened.
 */
export function NoticeHost() {
  const [notices, setNotices] = useState<NoticeDetail[]>([]);

  useEffect(() => {
    const onNotice = (e: Event) => {
      const detail = (e as CustomEvent<NoticeDetail>).detail;
      if (!detail?.message) return;
      setNotices((prev) => [...prev, detail].slice(-4));
      setTimeout(() => {
        setNotices((prev) => prev.filter((n) => n.id !== detail.id));
      }, AUTO_DISMISS_MS);
    };
    window.addEventListener(NOTICE_EVENT, onNotice);
    return () => window.removeEventListener(NOTICE_EVENT, onNotice);
  }, []);

  if (notices.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {notices.map((n) => (
        <div
          key={n.id}
          data-testid="app-notice"
          className={`pointer-events-auto max-w-md rounded-xl border px-4 py-2.5 text-sm shadow-xl backdrop-blur-xl ${LEVEL_STYLES[n.level]}`}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
