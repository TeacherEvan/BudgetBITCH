// components/onboarding/language-select-modal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import type { CurrencyCode } from '@/lib/utils/currency';

interface LanguageSelectModalProps {
  isOpen: boolean;
  onComplete: (selection: { locale: string; currency: CurrencyCode }) => void;
}

const LANGUAGES: { code: string; flag: string; label: string }[] = [
  { code: 'en', flag: '🇺🇸', label: 'English' },
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'zh', flag: '🇨🇳', label: '中文' },
];

// Common starting currencies. Free, local-first — no API lookup at startup.
const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'CNY', label: 'Chinese Yuan (CNY)' },
  { code: 'BRL', label: 'Brazilian Real (BRL)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
];

export function LanguageSelectModal({ isOpen, onComplete }: LanguageSelectModalProps) {
  const previousOverflowRef = useRef<string | null>(null);
  const [locale, setLocale] = useState('en');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

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
      title="Welcome to Budget Boss"
      description="Choose your language & currency to get started"
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
          <h3 className="text-2xl font-semibold text-white">Budget Boss</h3>
          <p className="mt-2 text-white/70">Plan first. Panic less.</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
            {'Language'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code)}
                aria-pressed={locale === l.code}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  locale === l.code
                    ? 'border-[#C9960C] bg-[#C9960C]/15 text-[#F5D742]'
                    : 'border-white/10 bg-white/4 text-white/70 hover:border-white/20 hover:text-white'
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#C9960C]">
            {'Currency'}
          </p>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full rounded-xl border border-white/10 bg-white/4 px-3 py-2.5 text-sm text-white focus:border-[#C9960C] focus:outline-none"
            aria-label="Select currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#0d0a02]">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          size="lg"
          variant="primary"
          className="w-full text-lg py-3"
          onClick={() => onComplete({ locale, currency })}
        >
          {'Get Started'}
        </Button>

        <p className="text-xs text-white/50 text-center">
          You can change language any time from the top-left menu and currency in Settings.
        </p>
      </div>
    </Modal>
  );
}
