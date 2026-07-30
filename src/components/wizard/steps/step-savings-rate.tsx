// components/wizard/steps/step-savings-rate.tsx
'use client';

import { Slider } from '@/components/ui/slider';

interface StepSavingsRateProps {
  locale: string;
  value: number;
  onChange: (key: 'savingsRatePct', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepSavingsRate({ value, onChange, disabled }: StepSavingsRateProps) {
  const labels = {
    en: {
      title: 'Savings Rate',
      subtitle: 'Percentage of income to save each month',
      helper: 'Percentage of income to save (0-50%)',
    },
  };

  const l = labels.en;

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
          {'Slide to choose savings percentage'}
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