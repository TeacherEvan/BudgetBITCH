// components/wizard/steps/step-entertainment.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepEntertainmentProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'entertainment', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepEntertainment({ locale, value, onChange, error, disabled }: StepEntertainmentProps) {
  const labels = {
    th: {
      title: 'บันเทิง / ความบันเทิง',
      subtitle: 'หนัง คาเฟ่ กาแฟ เล่นเกม ออกไปข้างนอก ดูคอนเสิร์ต',
      placeholder: 'เช่น 2000',
      helper: 'เงินความบันเทิงต่อเดือน (บาท)',
    },
    en: {
      title: 'Entertainment',
      subtitle: 'Movies, coffee, games, going out, concerts, hobbies',
      placeholder: 'e.g. 2000',
      helper: 'Monthly entertainment budget (THB)',
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
          step="500"
          value={value || ''}
          onChange={(e) => onChange('entertainment', Number(e.target.value) || 0)}
          placeholder={l.placeholder}
          disabled={disabled}
          error={error || undefined}
          className="text-2xl font-mono text-center"
        />

        <Slider
          label=""
          min={0}
          max={20000}
          step={500}
          value={value}
          onValueChange={(v) => onChange('entertainment', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' ? 'หนัง คาเฟ่ เกม ออกไปข้างนอก ดูคอนเสิร์ต ฯลฯ' : 'Movies, coffee, games, going out, concerts, etc.'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'Minimal' },
          { value: 2000, label: 'Moderate' },
          { value: 5000, label: 'Active' },
          { value: 10000, label: 'Social' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('entertainment', value)}
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