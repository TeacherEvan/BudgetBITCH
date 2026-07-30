// components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const DISMISS_KEY = 'budgetbitch:installPromptDismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const COPY = {
  en: {
    title: 'Install BudgetBITCH',
    body: 'Add to your home screen for quick offline access, instant load, and full screen privacy.',
    installBtn: 'Install App',
    dismissBtn: 'Not Now',
    closeBtn: 'Close',
    iosTitle: 'Install on iOS',
    iosBody: 'Tap the Share button in Safari, then select "Add to Home Screen".',
  },
  th: {
    title: 'ติดตั้ง BudgetBITCH',
    body: 'เพิ่มไปยังหน้าจอโฮมเพื่อเข้าถึงอย่างรวดเร็ว ใช้งานออฟไลน์ และความเป็นส่วนตัวแบบเต็มจอ',
    installBtn: 'ติดตั้งแอป',
    dismissBtn: 'ไว้ทีหลัง',
    closeBtn: 'ปิด',
    iosTitle: 'วิธีติดตั้งบน iOS',
    iosBody: 'แตะปุ่มแชร์ใน Safari จากนั้นเลือก "เพิ่มไปยังหน้าจอโฮม"',
  },
} as const;

export function PWAInstallPrompt({
  locale = 'en',
  onDismiss,
}: {
  locale?: 'th' | 'en';
  onDismiss?: () => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running as standalone PWA
    const inStandalone =
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(inStandalone);

    // Check iOS
    const ua = window.navigator.userAgent;
    const isIOSUser = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
    setIsIOS(isIOSUser);

    // Check dismissal state
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsDismissed(true);
        try {
          localStorage.setItem(DISMISS_KEY, '1');
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    onDismiss?.();
  };

  if (isStandalone || isDismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  const copy = COPY[locale === 'th' ? 'th' : 'en'];

  return (
    <div
      role="dialog"
      aria-label={copy.title}
      data-testid="pwa-install-prompt"
      className="fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-[55] mx-auto max-w-md rounded-2xl border border-[var(--gold-border-strong)] bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl pointer-events-auto sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-base)]/20 text-[var(--gold-bright)]">
            {isIOS ? <Share className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{isIOS ? copy.iosTitle : copy.title}</h3>
            <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">
              {isIOS ? copy.iosBody : copy.body}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={copy.closeBtn}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!isIOS && deferredPrompt && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            {copy.dismissBtn}
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--gold-base)] px-4 py-1.5 text-xs font-bold text-black hover:bg-[var(--gold-bright)] active:scale-95 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            {copy.installBtn}
          </button>
        </div>
      )}
    </div>
  );
}