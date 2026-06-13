// components/onboarding/language-select-modal.tsx
'use client';

import { useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface LanguageSelectModalProps {
  isOpen: boolean;
  onComplete: (locale: 'th' | 'en') => void;
}

export function LanguageSelectModal({ isOpen, onComplete }: LanguageSelectModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={true}
      onClose={() => {}} // Prevent close - must select language
      title="Welcome to BudgetBITCH"
      description="Choose your language to get started"
      size="md"
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-400/20 flex items-center justify-center mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <h3 className="text-2xl font-semibold text-white">BudgetBITCH</h3>
          <p className="mt-2 text-white/70">Plan first. Panic less.</p>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            variant="primary"
            className="w-full justify-center gap-3 text-lg"
            onClick={() => onComplete('th')}
          >
            <span className="text-2xl">🇹🇭</span>
            <span>ไทย (Thai)</span>
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full justify-center gap-3 text-lg"
            onClick={() => onComplete('en')}
          >
            <span className="text-2xl">🇺🇸</span>
            <span>English</span>
          </Button>
        </div>

        <p className="text-xs text-white/50 text-center">
          Your language preference is saved locally and can be changed in settings (globe icon in header)
        </p>
      </div>
    </Modal>
  );
}