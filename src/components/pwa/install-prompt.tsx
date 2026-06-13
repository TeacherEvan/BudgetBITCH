// components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallPrompt({ 
  onDismiss, 
  locale = 'en' 
}: { 
  onDismiss?: () => void;
  locale?: 'th' | 'en';
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(() => {
    // Check if already installed on initial render
    if (typeof window !== 'undefined') {
      return !window.matchMedia('(display-mode: standalone)').matches;
    }
    return false;
  });
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
      // Show prompt after a short delay
      setTimeout(() => {
        if (mountedRef.current) {
          setShowPrompt(true);
        }
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
      onDismiss?.();
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  if (!showPrompt || !deferredPrompt) return null;

  const labels = {
    th: {
      title: 'ติดตั้ง BudgetBITCH',
      description: 'เพิ่มลงหน้าจอหลักเพื่อเข้าถึงง่ายขึ้น ทำงานออฟไลน์ได้',
      install: 'ติดตั้ง',
      later: 'ภายหลัง',
    },
    en: {
      title: 'Install BudgetBITCH',
      description: 'Add to home screen for quick access. Works offline.',
      install: 'Install',
      later: 'Later',
    },
  };

  const l = labels[locale];

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-up">
      <div className="bg-black/95 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Download className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{l.title}</h3>
              <p className="text-sm text-white/70 mt-0.5">{l.description}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/50 hover:text-white transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 flex gap-3">
          <Button 
            variant="primary" 
            onClick={handleInstall}
            className="flex-1"
          >
            {l.install}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleDismiss}
            className="flex-1"
          >
            {l.later}
          </Button>
        </div>
      </div>
    </div>
  );
}