// components/wizard/steps/step-healthcare.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepHealthcareProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'healthcare', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepHealthcare({ locale, value, onChange, error, disabled }: StepHealthcareProps) {
  const labels = {
    th: {
      title: 'สุขภาพ / ค่ายา',
      subtitle: 'ค่ายา ค่าทันตกรรม ค่ารพ. วัคซีน ประกันสุขภาพ',
      placeholder: 'เช่น 1000',
      helper: 'ค่าสุขภาพและค่ายาต่อเดือน (บาท)',
    },
    en: {
      title: 'Healthcare',
      subtitle: 'Meds, dentist, hospital, vaccines, health insurance',
      placeholder: 'e.g. 1000',
      helper: 'Monthly healthcare costs (THB)',
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
          onChange={(e) => onChange('healthcare', Number(e.target.value) || 0)}
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
          onValueChange={(v) => onChange('healthcare', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' ? 'ค่ายา ค่าทันตกรรม ค่ารพ. ประกันสุขภาพ' : 'Meds, dentist, hospital, insurance'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'Healthy' },
          { value: 1000, label: 'Occasional' },
          { value: 3000, label: 'Regular' },
          { value: 8000, label: 'Chronic' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('healthcare', value)}
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