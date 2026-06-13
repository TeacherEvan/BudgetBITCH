// components/wizard/steps/step-savings-rate.tsx
'use client';

import { Slider } from '@/components/ui/slider';

interface StepSavingsRateProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'savingsRatePct', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepSavingsRate({ locale, value, onChange, error, disabled }: StepSavingsRateProps) {
  const labels = {
    th: {
      title: 'อัตราการออม',
      subtitle: 'เปอร์เซ็นต์ของรายได้ที่อยากออมต่อเดือน',
      helper: 'เปอร์เซ็นต์รายได้ที่จะออม (0-50%)',
    },
    en: {
      title: 'Savings Rate',
      subtitle: 'Percentage of income to save each month',
      helper: 'Percentage of income to save (0-50%)',
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
        <div className="text-center mb-4">
          <span className="text-4xl font-bold text-amber-400 font-mono">
            {value}%
          </span>
          <p className="mt-1 text-white/60">{l.helper}</p>
        </div>

        <Slider
          label=""
          min={0}
          max={50}
          step={5}
          value={value}
          onValueChange={(v) => onChange('savingsRatePct', v)}
          disabled={disabled}
          showValue={false}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' 
            ? 'เลื่อนเพื่อเลือกเปอร์เซ็นต์ที่ต้องการออม' 
            : 'Slide to choose savings percentage'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { value: 0, label: 'Live Now' },
          { value: 10, label: 'Start Small' },
          { value: 20, label: 'Balanced' },
          { value: 30, label: 'Aggressive' },
        ].map(({ value: v, label }) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange('savingsRatePct', v)}
            disabled={disabled}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
              v === value 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {v}%<br/>{label}
          </button>
        ))}
      </div>
    </div>
  );
}