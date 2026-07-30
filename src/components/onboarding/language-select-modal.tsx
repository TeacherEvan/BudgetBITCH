// components/onboarding/language-select-modal.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface LanguageSelectModalProps {
  isOpen: boolean;
  onComplete: (locale: 'en' | 'fr' | 'zh' | string) => void;
}

export function LanguageSelectModal({ isOpen, onComplete }: LanguageSelectModalProps) {
  const previousOverflowRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isOpen) {
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = previousOverflowRef.current ?? 'unset';
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const restore = () => {
      document.body.style.overflow = previousOverflowRef.current ?? 'unset';
    };

    window.addEventListener('pagehide', restore);
    document.addEventListener('visibilitychange', restore);

    return () => {
      window.removeEventListener('pagehide', restore);
      document.removeEventListener('visibilitychange', restore);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={true}
      onClose={() => {}} // Prevent close - must select language
      title="Welcome to BudgetBITCH"
      description="Choose your country & language to get started"
      size="md"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-400/20 flex items-center justify-center mb-4 border border-amber-400/30">
            <span className="text-3xl">💰</span>
          </div>
          <h3 className="text-2xl font-semibold text-white">BudgetBITCH</h3>
          <p className="mt-2 text-white/70">Plan first. Panic less.</p>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            variant="primary"
            className="w-full justify-start gap-4 text-lg py-6 bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 border border-amber-400/40 text-white font-medium"
            onClick={() => onComplete('en')}
          >
            <span className="text-3xl">🇺🇸</span>
            <div className="text-left">
              <div className="font-semibold text-white">United States</div>
              <div className="text-xs text-amber-300/80 font-mono">English (US)</div>
            </div>
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="w-full justify-start gap-4 text-lg py-6 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium"
            onClick={() => onComplete('fr')}
          >
            <span className="text-3xl">🇫🇷</span>
            <div className="text-left">
              <div className="font-semibold text-white">France</div>
              <div className="text-xs text-white/60 font-mono">Français</div>
            </div>
          </Button>

          <Button
            size="lg"
            variant="secondary"
            className="w-full justify-start gap-4 text-lg py-6 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-medium"
            onClick={() => onComplete('zh')}
          >
            <span className="text-3xl">🇨🇳</span>
            <div className="text-left">
              <div className="font-semibold text-white">China (中国)</div>
              <div className="text-xs text-white/60 font-mono">中文 (Chinese)</div>
            </div>
          </Button>
        </div>

        <p className="text-xs text-white/50 text-center">
          Your language decision is saved on startup.
        </p>
      </div>
    </Modal>
  );
}