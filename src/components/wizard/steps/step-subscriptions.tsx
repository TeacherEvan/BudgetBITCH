// components/wizard/steps/step-subscriptions.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepSubscriptionsProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'subscriptions', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepSubscriptions({ locale, value, onChange, error, disabled }: StepSubscriptionsProps) {
  const labels = {
    th: {
      title: 'สมัครสมาชิก',
      subtitle: 'Netflix, Spotify, YouTube, Disney+, TrueID, Apple, ชั้นเรียนออนไลน์',
      placeholder: 'เช่น 500',
      helper: 'ค่าสมัครสมาชิกรายเดือนรวมทุกอย่าง (บาท)',
    },
    en: {
      title: 'Subscriptions',
      subtitle: 'Netflix, Spotify, YouTube, Disney+, TrueID, Apple, online courses',
      placeholder: 'e.g. 500',
      helper: 'Total monthly subscriptions (THB)',
    },
  };

  const l = labels[locale];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white">{l.title}</h2>
        <p className="mt-1 text-white/60">{l.subtitle}</p>
      </div>

      <div className="space-y-4">
        <Input
          label={l.helper}
          type="number"
          inputMode="decimal"
          min="0"
          step="100"
          value={value || ''}
          onChange={(e) => onChange('subscriptions', Number(e.target.value) || 0)}
          placeholder={l.placeholder}
          disabled={disabled}
          error={error || undefined}
          className="text-2xl font-mono text-center"
        />

        <Slider
          label=""
          min={0}
          max={3000}
          step={100}
          value={value}
          onValueChange={(v) => onChange('subscriptions', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' ? 'Netflix Spotify Disney+ TrueID YouTube Premium App Store' : 'Netflix Spotify Disney+ YouTube Apple courses apps'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'None' },
          { value: 300, label: '1-2 Apps' },
          { value: 800, label: 'Several' },
          { value: 1500, label: 'Many' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('subscriptions', value)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
              value === value 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            ฿{value.toLocaleString()}<br/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}