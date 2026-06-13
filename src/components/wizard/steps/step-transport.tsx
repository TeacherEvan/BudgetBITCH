// components/wizard/steps/step-transport.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface StepTransportProps {
  locale: 'th' | 'en';
  value: number;
  onChange: (key: 'transport', value: number) => void;
  error?: string | null;
  disabled?: boolean;
}

export function StepTransport({ locale, value, onChange, error, disabled }: StepTransportProps) {
  const labels = {
    th: {
      title: 'ค่าเดินทาง',
      subtitle: 'BTS/MRT รถเมล์ มอไซค์ น้ำมัน Grab/Bolt',
      placeholder: 'เช่น 3000',
      helper: 'ค่าเดินทางต่อเดือนรวมทุกอย่าง (บาท)',
    },
    en: {
      title: 'Transport Cost',
      subtitle: 'BTS/MRT, bus, motorbike, fuel, Grab/Bolt',
      placeholder: 'e.g. 3000',
      helper: 'Monthly transport total (THB)',
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
          onChange={(e) => onChange('transport', Number(e.target.value) || 0)}
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
          onValueChange={(v) => onChange('transport', v)}
          disabled={disabled}
          showValue
          valueFormatter={(v) => `฿${v.toLocaleString()}`}
        />

        <p className="text-xs text-white/50 text-center">
          {locale === 'th' ? 'รวม BTS/MRT รถเมล์ มอไซน์ น้ำมัน Grab/Bolt' : 'Include BTS/MRT, bus, motorbike, fuel, Grab/Bolt'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { value: 0, label: 'Walk/WFH' },
          { value: 1500, label: 'BTS/Bus' },
          { value: 4000, label: 'Mixed' },
          { value: 10000, label: 'Car/Grab' },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange('transport', value)}
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